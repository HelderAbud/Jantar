import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

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

async function call(env, method, path, body) {
  const req = new Request('https://worker.test' + path, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:5177' },
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

describe('CF worker order parity', () => {
  let env;

  beforeEach(() => {
    env = envWithKv();
  });

  it('stores phones and consumed=false on mock checkout', async () => {
    const created = await call(env, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara',
      invitePhone: '5561999999999',
      replyPhone: '5561888888888'
    });
    assert.equal(created.status, 200);
    assert.ok(created.json.orderId);

    const got = await call(env, 'GET', '/api/orders/' + created.json.orderId);
    assert.equal(got.status, 200);
    assert.equal(got.json.invitePhone, '5561999999999');
    assert.equal(got.json.replyPhone, '5561888888888');
    assert.equal(got.json.consumed, false);
  });

  it('marks license consumed', async () => {
    const created = await call(env, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara',
      invitePhone: '5561999999999',
      replyPhone: '5561888888888'
    });
    const paid = await call(env, 'POST', '/api/webhooks/mercadopago', {
      mock: true,
      orderId: created.json.orderId
    });
    assert.equal(paid.json.status, 'paid');

    const consumed = await call(
      env,
      'POST',
      '/api/orders/' + created.json.orderId + '/consume',
      { reason: 'outbound' }
    );
    assert.equal(consumed.status, 200);
    assert.equal(consumed.json.consumed, true);

    const got = await call(env, 'GET', '/api/orders/' + created.json.orderId);
    assert.equal(got.json.consumed, true);
  });

  it('refuses production origin without KV', async () => {
    const bare = {
      MOCK_MODE: 'true',
      PUBLIC_APP_ORIGIN: 'https://helderabud.github.io',
      PUBLIC_APP_PATH: '/Jantar/'
    };
    const res = await call(bare, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara'
    });
    assert.equal(res.status, 503);
    assert.equal(res.json.error, 'kv_required');
  });
});
