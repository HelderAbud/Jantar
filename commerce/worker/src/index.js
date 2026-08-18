/**
 * Jantar Link — Commerce Worker (F2)
 * POST /api/checkout
 * GET  /api/orders/:id
 * POST /api/webhooks/mercadopago
 * GET  /health
 */

import { buildMpReturnUrls, pickMpCheckoutUrl } from '../lib/checkout-urls.mjs';
import {
  paymentAmountMatches,
  verifyMpWebhookSignature,
  webhookSignatureRequired,
  timingSafeEqualHex
} from '../lib/mp-webhook-security.mjs';

const ALLOWED_ORIGINS = [
  'http://127.0.0.1:5177',
  'http://localhost:5177',
  'https://helderabud.github.io'
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return cors(request, new Response(null, { status: 204 }));
    }

    try {
      if (url.pathname === '/' || url.pathname === '') {
      return cors(
        request,
        json({
          ok: true,
          service: 'jantar-link-commerce',
          hint: 'API de pagamento. Use o site em PUBLIC_APP_ORIGIN/?modo=venda',
          health: '/health',
          checkout: 'POST /api/checkout'
        })
      );
    }

      if (url.pathname === '/health' && request.method === 'GET') {
        return cors(
          request,
          json({
            ok: true,
            service: 'jantar-link-commerce',
            kv: hasOrders(env)
          })
        );
      }

      const kvErr = requireOrdersKv(env);
      if (
        kvErr &&
        (url.pathname === '/api/checkout' ||
          url.pathname.startsWith('/api/orders/') ||
          url.pathname === '/api/webhooks/mercadopago' ||
          url.pathname === '/api/licenses/pro')
      ) {
        return cors(request, kvErr);
      }

      if (url.pathname === '/api/checkout' && request.method === 'POST') {
        return cors(request, await handleCheckout(request, env));
      }

      if (url.pathname === '/api/licenses/pro' && request.method === 'GET') {
        return cors(request, await handleLicensePro(request, env));
      }

      const consumeMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/consume$/);
      if (consumeMatch && request.method === 'POST') {
        return cors(request, await handleConsumeOrder(request, consumeMatch[1], env));
      }

      const syncMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/sync$/);
      if (syncMatch && request.method === 'POST') {
        return cors(request, await handleSyncOrder(request, syncMatch[1], env));
      }

      const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
      if (orderMatch && request.method === 'GET') {
        const sync = url.searchParams.get('sync') === '1';
        return cors(request, await handleGetOrder(request, orderMatch[1], env, sync));
      }

      if (
        url.pathname === '/api/webhooks/mercadopago' &&
        (request.method === 'POST' || request.method === 'GET')
      ) {
        return await handleMpWebhook(request, env, ctx);
      }

      return cors(request, json({ error: 'not_found' }, 404));
    } catch (err) {
      console.error('unhandled', err);
      return cors(request, json({ error: 'internal_error' }, 500));
    }
  }
};

function cors(request, response) {
  const origin = request.headers.get('Origin') || '';
  const headers = new Headers(response.headers);
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Order-Secret');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(response.body, { status: response.status, headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/* Fallback em memória quando KV ainda não foi provisionado (só útil em `wrangler dev`). */
const memoryStore = new Map();

function hasOrders(env) {
  return !!(env && env.ORDERS && typeof env.ORDERS.get === 'function');
}

function isPublicApp(env) {
  return String(env.PUBLIC_APP_ORIGIN || '').includes('helderabud.github.io');
}

function requireOrdersKv(env) {
  if (hasOrders(env)) return null;
  if (isPublicApp(env)) return json({ error: 'kv_required' }, 503);
  return null;
}

function kvGet(env, key) {
  if (hasOrders(env)) return env.ORDERS.get(key);
  return Promise.resolve(memoryStore.get(key) || null);
}

function kvPut(env, key, value, opts) {
  if (hasOrders(env)) return env.ORDERS.put(key, value, opts);
  memoryStore.set(key, value);
  return Promise.resolve();
}

function orderPublic(order) {
  return {
    id: order.id,
    status: order.status,
    fromName: order.fromName,
    toName: order.toName,
    amountCentavos: order.amountCentavos,
    proUrl: order.proUrl,
    paidAt: order.paidAt,
    invitePhone: order.invitePhone || '',
    replyPhone: order.replyPhone || '',
    consumed: !!order.consumed,
    mock: order.provider === 'mock'
  };
}

function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function providedOrderSecret(request) {
  const url = new URL(request.url);
  return String(request.headers.get('X-Order-Secret') || url.searchParams.get('secret') || '').trim();
}

function orderSecretOk(order, provided) {
  return !!(order && order.orderSecret && provided && timingSafeEqualHex(order.orderSecret, provided));
}

function denyOrder() {
  return json({ error: 'unauthorized' }, 401);
}

async function rateLimitCheckout(request, env) {
  const ip = String(
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local'
  )
    .split(',')[0]
    .trim()
    .slice(0, 80);
  const bucket = Math.floor(Date.now() / 60000);
  const key = `rl:checkout:${ip}:${bucket}`;
  const n = parseInt((await kvGet(env, key)) || '0', 10) || 0;
  if (n >= 10) return json({ error: 'rate_limited' }, 429);
  await kvPut(env, key, String(n + 1), { expirationTtl: 120 });
  return null;
}

function appBase(env) {
  const origin = (env.PUBLIC_APP_ORIGIN || 'http://127.0.0.1:5177').replace(/\/$/, '');
  let path = env.PUBLIC_APP_PATH || '/';
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.endsWith('/')) path += '/';
  return origin + path;
}

function moneyCentavos(env) {
  const n = parseInt(env.CHECKOUT_AMOUNT_CENTAVOS || '200', 10);
  return Number.isFinite(n) && n > 0 ? n : 200;
}

function isMock(env) {
  if (String(env.MOCK_MODE || '').toLowerCase() === 'true') return true;
  return !env.MP_ACCESS_TOKEN;
}

function newId() {
  return 'ord_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

async function handleCheckout(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const fromName = String(body.fromName || body.from || '').trim().slice(0, 40);
  const toName = String(body.toName || body.to || '').trim().slice(0, 40);
  const contact = String(body.contact || body.email || body.whatsapp || '').trim().slice(0, 120);
  const configPayload = String(body.configPayload || '').trim().slice(0, 2500);
  const invitePhone = String(body.invitePhone || '').replace(/\D/g, '').slice(0, 15);
  const replyPhone = String(body.replyPhone || '').replace(/\D/g, '').slice(0, 15);

  if (!fromName || !toName) {
    return json({ error: 'names_required' }, 400);
  }

  const limited = await rateLimitCheckout(request, env);
  if (limited) return limited;

  const orderId = newId();
  const orderSecret = randomHex(32);
  const amount = moneyCentavos(env);
  const base = appBase(env);
  const returns = buildMpReturnUrls({
    appOrigin: env.PUBLIC_APP_ORIGIN || 'http://127.0.0.1:5177',
    appPath: env.PUBLIC_APP_PATH || '/',
    returnOrigin: env.PUBLIC_RETURN_ORIGIN,
    orderId
  });
  const successUrl = returns.success;
  const pendingUrl = returns.pending;
  const failureUrl = returns.failure;

  const order = {
    id: orderId,
    orderSecret,
    status: 'pending',
    fromName,
    toName,
    contact,
    configPayload,
    invitePhone,
    replyPhone,
    consumed: false,
    consumedAt: null,
    amountCentavos: amount,
    currency: 'BRL',
    provider: isMock(env) ? 'mock' : 'mercadopago',
    providerRef: null,
    proUrl: null,
    createdAt: new Date().toISOString(),
    paidAt: null
  };

  let checkoutUrl;

  if (isMock(env)) {
    order.providerRef = 'mock_' + orderId;
    // Success imediato em mock para o front testar fulfillment localmente via GET order + botão
    checkoutUrl = `${base}?modo=venda&pago=mock&order=${orderId}&mock_pay=1`;
  } else {
    const preference = await createMpPreference(env, {
      orderId,
      fromName,
      toName,
      amountCentavos: amount,
      successUrl,
      pendingUrl,
      failureUrl,
      autoReturn: returns.autoReturn
    });
    order.providerRef = preference.id;
    const picked = pickMpCheckoutUrl({
      accessToken: env.MP_ACCESS_TOKEN,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      publicApp: isPublicApp(env)
    });
    if (picked.error) {
      return json({ error: picked.error }, 503);
    }
    checkoutUrl = picked.url;
    if (!checkoutUrl) {
      return json({ error: 'mp_preference_failed', detail: preference }, 502);
    }
  }

  await kvPut(env, `order:${orderId}`, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 30 });

  return json({
    orderId,
    orderSecret,
    checkoutUrl,
    mock: isMock(env),
    amountCentavos: amount
  });
}

async function createMpPreference(env, opts) {
  const unitPrice = opts.amountCentavos / 100;
  const payload = {
    external_reference: opts.orderId,
    items: [
      {
        id: 'jantar-link-pro',
        title: 'Jantar Link Pro — white-label',
        description: `Convite Pro: ${opts.fromName} → ${opts.toName}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: unitPrice
      }
    ],
    back_urls: {
      success: opts.successUrl,
      pending: opts.pendingUrl,
      failure: opts.failureUrl
    },
    notification_url: undefined
  };
  if (opts.autoReturn) payload.auto_return = 'approved';

  if (env.MP_NOTIFICATION_URL) {
    payload.notification_url = env.MP_NOTIFICATION_URL;
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.MP_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('mp preference error', res.status, data);
    return { error: true, status: res.status, data };
  }
  return data;
}

async function handleGetOrder(request, orderId, env, sync) {
  const id = String(orderId || '').slice(0, 40);
  const raw = await kvGet(env, `order:${id}`);
  if (!raw) return json({ error: 'not_found' }, 404);
  let order = JSON.parse(raw);
  if (!orderSecretOk(order, providedOrderSecret(request))) return denyOrder();
  if (sync && order.status === 'pending' && !isMock(env)) {
    order = await syncOrderFromMp(env, order);
  }
  return json(orderPublic(order));
}

async function handleSyncOrder(request, orderId, env) {
  const id = String(orderId || '').slice(0, 40);
  const raw = await kvGet(env, `order:${id}`);
  if (!raw) return json({ error: 'not_found' }, 404);
  let order = JSON.parse(raw);
  if (!orderSecretOk(order, providedOrderSecret(request))) return denyOrder();
  if (!isMock(env)) order = await syncOrderFromMp(env, order);
  return json(orderPublic(order));
}

async function handleConsumeOrder(request, orderId, env) {
  const id = String(orderId || '').slice(0, 40);
  const raw = await kvGet(env, `order:${id}`);
  if (!raw) return json({ error: 'not_found' }, 404);
  const order = JSON.parse(raw);
  if (!orderSecretOk(order, providedOrderSecret(request))) return denyOrder();
  if (order.status !== 'paid') return json({ error: 'not_paid' }, 409);
  if (order.consumed) {
    return json({ ok: true, id: order.id, consumed: true, consumedAt: order.consumedAt });
  }
  order.consumed = true;
  order.consumedAt = new Date().toISOString();
  await kvPut(env, `order:${order.id}`, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 30 });
  return json({ ok: true, id: order.id, consumed: true, consumedAt: order.consumedAt });
}

async function syncOrderFromMp(env, order) {
  if (!env.MP_ACCESS_TOKEN) return order;
  const url =
    'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=' +
    encodeURIComponent(order.id);
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + env.MP_ACCESS_TOKEN }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return order;
  const results = data.results || [];
  const approved = results.find((p) => p.status === 'approved');
  if (approved) {
    if (!paymentAmountMatches(order, approved)) {
      console.warn('amount_mismatch', order.id, approved.transaction_amount, order.amountCentavos);
      return order;
    }
    order.providerRef = String(approved.id);
    return fulfillOrder(env, order);
  }
  const rejected = results.find((p) => p.status === 'rejected' || p.status === 'cancelled');
  if (rejected) {
    order.status = 'failed';
    order.providerRef = String(rejected.id);
    await kvPut(env, `order:${order.id}`, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 30 });
  }
  return order;
}

async function fulfillOrder(env, order) {
  if (order.status === 'paid' && order.proUrl) return order;

  const proToken = 'jl_' + randomHex(16);
  const base = appBase(env);
  const payload = order.configPayload
    ? order.configPayload
    : await buildDefaultPayload(order.fromName, order.toName);

  const proUrl = `${base}?pro=${encodeURIComponent(proToken)}&modo=editor#c=${payload}`;
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  order.proToken = proToken;
  order.proUrl = proUrl;
  await kvPut(env, `pro:${proToken}`, order.id, { expirationTtl: 60 * 60 * 24 * 30 });
  await kvPut(env, `order:${order.id}`, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 30 });
  return order;
}

async function handleLicensePro(request, env) {
  const url = new URL(request.url);
  const token = String(url.searchParams.get('token') || '').trim();
  if (!token || token.length > 96) return json({ error: 'unauthorized' }, 401);
  const origin = request.headers.get('Origin') || '';
  const local = /127\.0\.0\.1|localhost/.test(origin);
  if (token === 'JL-PRO-DEMO') {
    if (isPublicApp(env)) return json({ error: 'unauthorized' }, 401);
    if (local || isMock(env)) return json({ ok: true, demo: true });
    return json({ error: 'unauthorized' }, 401);
  }
  const orderId = await kvGet(env, `pro:${token}`);
  if (!orderId) return json({ error: 'unauthorized' }, 401);
  return json({ ok: true, orderId: String(orderId) });
}

/** Payload mínimo Base64URL {f,t} — espelha compact do front. */
async function buildDefaultPayload(fromName, toName) {
  const obj = { f: fromName, t: toName };
  const str = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  // btoa available in Workers
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function requireWebhookSignature(request, env, paymentId) {
  if (!webhookSignatureRequired(env, isMock)) return null;
  const secret = String(env.MP_WEBHOOK_SECRET || '').trim();
  if (!secret) return json({ error: 'webhook_secret_required' }, 401);
  const url = new URL(request.url);
  const dataId = url.searchParams.get('data.id') || paymentId || '';
  const ok = await verifyMpWebhookSignature({
    signatureHeader: request.headers.get('x-signature') || '',
    requestId: request.headers.get('x-request-id') || '',
    dataId,
    secret
  });
  if (!ok) return json({ error: 'invalid_signature' }, 401);
  return null;
}

async function handleMpWebhook(request, env, ctx) {
  const url = new URL(request.url);
  let topic = url.searchParams.get('topic') || url.searchParams.get('type') || '';
  let paymentId = url.searchParams.get('id') || url.searchParams.get('data.id') || '';

  let body = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (body) {
    if (body.type) topic = body.type;
    if (body.action) topic = body.action;
    if (body.data && body.data.id) paymentId = String(body.data.id);
    if (body.id && !paymentId) paymentId = String(body.id);
  }

  // Mock pay shortcut: POST { mock:true, orderId } — só com MOCK_MODE
  if (body && body.mock === true && body.orderId) {
    if (!isMock(env)) return json({ error: 'mock_forbidden' }, 403);
    const raw = await kvGet(env, `order:${body.orderId}`);
    if (!raw) return json({ error: 'not_found' }, 404);
    let order = JSON.parse(raw);
    order = await fulfillOrder(env, order);
    return json({ ok: true, orderId: order.id, status: order.status });
  }

  const sigErr = await requireWebhookSignature(request, env, paymentId);
  if (sigErr) return sigErr;

  if (!paymentId) {
    console.warn('webhook skip', { topic, paymentId, hasToken: !!env.MP_ACCESS_TOKEN });
    return json({ ok: true, skipped: true });
  }

  const eventKey = `wh:${topic}:${paymentId}:${await hashRequest(request, body)}`;
  const seen = await kvGet(env, eventKey);
  if (seen) {
    return json({ ok: true, duplicate: true });
  }

  if (!env.MP_ACCESS_TOKEN) {
    console.warn('webhook skip', { topic, paymentId, hasToken: false });
    return json({ ok: true, skipped: true });
  }

  const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: 'Bearer ' + env.MP_ACCESS_TOKEN }
  });
  const payment = await payRes.json().catch(() => null);
  if (!payRes.ok || !payment) {
    console.error('payment fetch failed', payRes.status);
    return json({ error: 'payment_fetch_failed' }, 502);
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    await kvPut(env, eventKey, '1', { expirationTtl: 60 * 60 * 24 * 7 });
    return json({ ok: true, ignored: true });
  }

  const raw = await kvGet(env, `order:${orderId}`);
  if (!raw) {
    await kvPut(env, eventKey, '1', { expirationTtl: 60 * 60 * 24 * 7 });
    return json({ ok: true, order_missing: true });
  }

  let order = JSON.parse(raw);
  order.providerRef = String(payment.id);

  if (payment.status === 'approved') {
    if (!paymentAmountMatches(order, payment)) {
      await kvPut(env, eventKey, '1', { expirationTtl: 60 * 60 * 24 * 7 });
      return json({ ok: true, orderId, status: order.status, error: 'amount_mismatch' });
    }
    order = await fulfillOrder(env, order);
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    order.status = 'failed';
    await kvPut(env, `order:${orderId}`, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 30 });
  }

  await kvPut(env, eventKey, '1', { expirationTtl: 60 * 60 * 24 * 7 });
  return json({ ok: true, orderId, status: order.status });
}

async function hashRequest(request, body) {
  const base = JSON.stringify(body || {}) + (request.headers.get('X-Request-Id') || '');
  const data = new TextEncoder().encode(base);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
