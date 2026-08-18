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
    PUBLIC_APP_ORIGIN: 'http://127.0.0.1:5177',
    PUBLIC_APP_PATH: '/',
    CHECKOUT_AMOUNT_CENTAVOS: '200',
    ORDERS: memoryKv(),
    ...extra
  };
}

async function call(env, method, path, body, extraHeaders = {}) {
  const req = new Request('https://worker.test' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: extraHeaders.Origin || 'http://127.0.0.1:5177',
      ...extraHeaders
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

describe('order secret and Pro token per payment', () => {
  let env;

  beforeEach(() => {
    env = envWithKv();
  });

  it('returns orderSecret on checkout and hides PII without it', async () => {
    const created = await call(env, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara',
      invitePhone: '5561999999999',
      replyPhone: '5561888888888'
    });
    assert.equal(created.status, 200);
    assert.match(created.json.orderSecret, /^[a-f0-9]{64}$/);

    const naked = await call(env, 'GET', '/api/orders/' + created.json.orderId);
    assert.equal(naked.status, 401);
    assert.equal(naked.json.invitePhone, undefined);
    assert.equal(naked.json.proUrl, undefined);

    const ok = await call(env, 'GET', '/api/orders/' + created.json.orderId, null, {
      'X-Order-Secret': created.json.orderSecret
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.invitePhone, '5561999999999');
  });

  it('issues a unique Pro token after mock pay', async () => {
    const created = await call(env, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara'
    });
    await call(env, 'POST', '/api/webhooks/mercadopago', {
      mock: true,
      orderId: created.json.orderId
    });
    const got = await call(env, 'GET', '/api/orders/' + created.json.orderId, null, {
      'X-Order-Secret': created.json.orderSecret
    });
    assert.equal(got.json.status, 'paid');
    assert.match(got.json.proUrl, /pro=jl_[a-f0-9]{32}/);
    assert.doesNotMatch(got.json.proUrl, /JL-PRO-DEMO/);

    const token = new URL(got.json.proUrl).searchParams.get('pro');
    const license = await call(env, 'GET', '/api/licenses/pro?token=' + encodeURIComponent(token));
    assert.equal(license.status, 200);
    assert.equal(license.json.ok, true);
    assert.equal(license.json.orderId, created.json.orderId);
  });

  it('rejects JL-PRO-DEMO on the public Pages origin', async () => {
    const prod = envWithKv({ PUBLIC_APP_ORIGIN: 'https://helderabud.github.io' });
    const res = await call(prod, 'GET', '/api/licenses/pro?token=JL-PRO-DEMO', null, {
      Origin: 'https://helderabud.github.io'
    });
    assert.equal(res.status, 401);
  });

  it('allows JL-PRO-DEMO only on local mock', async () => {
    const res = await call(env, 'GET', '/api/licenses/pro?token=JL-PRO-DEMO');
    assert.equal(res.status, 200);
    assert.equal(res.json.demo, true);
  });

  it('rate-limits checkout after 10 requests per IP per minute', async () => {
    for (let i = 0; i < 10; i++) {
      const created = await call(env, 'POST', '/api/checkout', {
        fromName: 'Bruno',
        toName: 'Lara'
      });
      assert.equal(created.status, 200);
    }
    const blocked = await call(env, 'POST', '/api/checkout', {
      fromName: 'Bruno',
      toName: 'Lara'
    });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.json.error, 'rate_limited');
  });
});
