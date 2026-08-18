import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import {
  paymentAmountMatches,
  signMpWebhook,
  verifyMpWebhookSignature
} from './mp-webhook-security.mjs';

function memoryKv() {
  const store = new Map();
  return {
    get: async (key) => store.get(key) || null,
    put: async (key, value) => {
      store.set(key, value);
    }
  };
}

function envWithKv(extra) {
  return {
    MOCK_MODE: 'true',
    PRO_TOKEN: 'JL-PRO-DEMO',
    PUBLIC_APP_ORIGIN: 'http://127.0.0.1:5177',
    PUBLIC_APP_PATH: '/',
    CHECKOUT_AMOUNT_CENTAVOS: '200',
    ORDERS: memoryKv(),
    ...extra
  };
}

async function call(env, method, path, body, headers = {}) {
  const req = new Request('https://worker.test' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://127.0.0.1:5177',
      ...headers
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  const res = await worker.fetch(req, env, {});
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function stubMpPayment(payment) {
  const orig = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('api.mercadopago.com/v1/payments/search')) {
      return new Response(JSON.stringify({ results: [payment] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('api.mercadopago.com/v1/payments/')) {
      return new Response(JSON.stringify(payment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return orig(input);
  };
  return () => {
    globalThis.fetch = orig;
  };
}

async function seedPending(env, id = 'ord_hard1') {
  const order = {
    id,
    orderSecret: 'ab'.repeat(32),
    status: 'pending',
    fromName: 'Bruno',
    toName: 'Lara',
    amountCentavos: 200,
    consumed: false,
    consumedAt: null,
    proUrl: null,
    provider: 'mercadopago'
  };
  await env.ORDERS.put('order:' + id, JSON.stringify(order));
  return order;
}

describe('payment amount fixture', () => {
  it('matches only the exact centavos', () => {
    const order = { amountCentavos: 200 };
    assert.equal(paymentAmountMatches(order, { transaction_amount: 2 }), true);
    assert.equal(paymentAmountMatches(order, { transaction_amount: 2.0 }), true);
    assert.equal(paymentAmountMatches(order, { transaction_amount: 1 }), false);
    assert.equal(paymentAmountMatches(order, { transaction_amount: 29 }), false);
  });
});

describe('consume paid only', () => {
  let env;

  beforeEach(() => {
    env = envWithKv();
  });

  it('refuses consume while the order is still pending', async () => {
    const created = await call(env, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara'
    });
    const consumed = await call(
      env,
      'POST',
      '/api/orders/' + created.json.orderId + '/consume',
      { reason: 'outbound' },
      { 'X-Order-Secret': created.json.orderSecret }
    );
    assert.equal(consumed.status, 409);
    assert.equal(consumed.json.error, 'not_paid');
  });

  it('is idempotent after the first consume', async () => {
    const created = await call(env, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara'
    });
    await call(env, 'POST', '/api/webhooks/mercadopago', {
      mock: true,
      orderId: created.json.orderId
    });
    const first = await call(
      env,
      'POST',
      '/api/orders/' + created.json.orderId + '/consume',
      {},
      { 'X-Order-Secret': created.json.orderSecret }
    );
    const second = await call(
      env,
      'POST',
      '/api/orders/' + created.json.orderId + '/consume',
      {},
      { 'X-Order-Secret': created.json.orderSecret }
    );
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.json.consumed, true);
    assert.equal(first.json.consumedAt, second.json.consumedAt);
  });
});

describe('webhook signature and amount', () => {
  it('does not dedup a webhook without paymentId', async () => {
    const env = envWithKv({
      MOCK_MODE: 'false',
      MP_ACCESS_TOKEN: 'APP_USR-dummy'
    });
    const a = await call(env, 'POST', '/api/webhooks/mercadopago', { type: 'payment' });
    const b = await call(env, 'POST', '/api/webhooks/mercadopago', { type: 'payment' });
    assert.equal(a.status, 200);
    assert.equal(a.json.skipped, true);
    assert.equal(b.json.duplicate, undefined);
    assert.equal(b.json.skipped, true);
  });

  it('refuses Pages webhooks without MP_WEBHOOK_SECRET', async () => {
    const env = envWithKv({
      MOCK_MODE: 'false',
      MP_ACCESS_TOKEN: 'APP_USR-dummy',
      PUBLIC_APP_ORIGIN: 'https://helderabud.github.io',
      PUBLIC_APP_PATH: '/Jantar/'
    });
    const res = await call(env, 'POST', '/api/webhooks/mercadopago?data.id=99', {
      type: 'payment',
      data: { id: '99' }
    });
    assert.equal(res.status, 401);
    assert.equal(res.json.error, 'webhook_secret_required');
  });

  it('rejects an invalid x-signature', async () => {
    const env = envWithKv({
      MOCK_MODE: 'false',
      MP_ACCESS_TOKEN: 'APP_USR-dummy',
      MP_WEBHOOK_SECRET: 'whsec_test'
    });
    const res = await call(
      env,
      'POST',
      '/api/webhooks/mercadopago?data.id=99',
      { type: 'payment', data: { id: '99' } },
      { 'x-signature': 'ts=1,v1=deadbeef', 'x-request-id': 'req-1' }
    );
    assert.equal(res.status, 401);
    assert.equal(res.json.error, 'invalid_signature');
  });

  it('does not fulfill when transaction_amount differs', async () => {
    const env = envWithKv({
      MOCK_MODE: 'false',
      MP_ACCESS_TOKEN: 'APP_USR-dummy'
    });
    await seedPending(env, 'ord_amtbad');
    const restore = stubMpPayment({
      id: 111,
      status: 'approved',
      transaction_amount: 1,
      external_reference: 'ord_amtbad'
    });
    try {
      const res = await call(env, 'POST', '/api/webhooks/mercadopago?data.id=111', {
        type: 'payment',
        data: { id: '111' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.json.error, 'amount_mismatch');
      const got = await call(env, 'GET', '/api/orders/ord_amtbad', null, {
        'X-Order-Secret': 'ab'.repeat(32)
      });
      assert.equal(got.json.status, 'pending');
      assert.equal(got.json.proUrl, null);
    } finally {
      restore();
    }
  });

  it('fulfills a signed webhook with the matching amount', async () => {
    const secret = 'whsec_test';
    const env = envWithKv({
      MOCK_MODE: 'false',
      MP_ACCESS_TOKEN: 'APP_USR-dummy',
      MP_WEBHOOK_SECRET: secret
    });
    await seedPending(env, 'ord_amtok');
    const signed = await signMpWebhook({
      secret,
      dataId: '222',
      requestId: 'req-ok',
      ts: '1700000000000'
    });
    assert.equal(
      await verifyMpWebhookSignature({
        signatureHeader: signed.header,
        requestId: 'req-ok',
        dataId: '222',
        secret
      }),
      true
    );
    const restore = stubMpPayment({
      id: 222,
      status: 'approved',
      transaction_amount: 2,
      external_reference: 'ord_amtok'
    });
    try {
      const res = await call(
        env,
        'POST',
        '/api/webhooks/mercadopago?data.id=222',
        { type: 'payment', data: { id: '222' } },
        { 'x-signature': signed.header, 'x-request-id': 'req-ok' }
      );
      assert.equal(res.status, 200);
      assert.equal(res.json.status, 'paid');
      const got = await call(env, 'GET', '/api/orders/ord_amtok', null, {
        'X-Order-Secret': 'ab'.repeat(32)
      });
      assert.equal(got.json.status, 'paid');
      assert.match(got.json.proUrl, /pro=jl_/);
    } finally {
      restore();
    }
  });
});
