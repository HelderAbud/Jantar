/**
 * Servidor local com Mercado Pago REAL (sandbox/produção via token).
 * Lê .dev.vars — NÃO use MOCK_MODE=true.
 *
 *   cd commerce/worker
 *   npm run dev:mp
 *   # ou: node --use-system-ca mp-server.mjs
 *   (no Windows com antivírus, sem --use-system-ca o fetch à API MP falha com TLS)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { buildMpReturnUrls } from './lib/checkout-urls.mjs';
import {
  paymentAmountMatches,
  verifyMpWebhookSignature,
  webhookSignatureRequired
} from './lib/mp-webhook-security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);

function loadDevVars() {
  const env = { ...process.env };
  const file = path.join(__dirname, '.dev.vars');
  if (!fs.existsSync(file)) {
    console.warn('AVISO: .dev.vars não encontrado. Copie de .dev.vars.example');
    return env;
  }
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const ENV = loadDevVars();
const orders = new Map();
const events = new Map();
const licenses = new Map();

function appBase() {
  const origin = (ENV.PUBLIC_APP_ORIGIN || 'http://127.0.0.1:5177').replace(/\/$/, '');
  let p = ENV.PUBLIC_APP_PATH || '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/')) p += '/';
  return origin + p;
}

function moneyCentavos() {
  const n = parseInt(ENV.CHECKOUT_AMOUNT_CENTAVOS || '200', 10);
  return Number.isFinite(n) && n > 0 ? n : 200;
}

function isMock() {
  if (String(ENV.MOCK_MODE || '').toLowerCase() === 'true') return true;
  return !ENV.MP_ACCESS_TOKEN;
}

function isTestToken() {
  const t = String(ENV.MP_ACCESS_TOKEN || '');
  if (String(ENV.MP_USE_SANDBOX || 'true').toLowerCase() === 'true') return true;
  return t.includes('TEST') || t.startsWith('TEST-');
}

function json(res, status, body, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Order-Secret'
  };
  if (
    origin &&
    (origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('helderabud.github.io'))
  ) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(body == null ? '' : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function providedSecret(req, url) {
  return String(req.headers['x-order-secret'] || url.searchParams.get('secret') || '').trim();
}

function fulfill(order) {
  const payload = order.configPayload || b64url({ f: order.fromName, t: order.toName });
  const proToken = 'jl_' + randomBytes(16).toString('hex');
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  order.proToken = proToken;
  order.proUrl =
    `${appBase()}?pro=${encodeURIComponent(proToken)}&modo=editor#c=${payload}`;
  orders.set(order.id, order);
  licenses.set(proToken, order.id);
  return order;
}

async function createMpPreference(order) {
  const unitPrice = order.amountCentavos / 100;
  const returns = buildMpReturnUrls({
    appOrigin: ENV.PUBLIC_APP_ORIGIN || 'http://127.0.0.1:5177',
    appPath: ENV.PUBLIC_APP_PATH || '/',
    returnOrigin: ENV.PUBLIC_RETURN_ORIGIN,
    orderId: order.id
  });
  const payload = {
    external_reference: order.id,
    items: [
      {
        id: 'jantar-link-pro',
        title: 'Jantar Link Pro — white-label',
        description: `Convite Pro: ${order.fromName} → ${order.toName}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: unitPrice
      }
    ],
    back_urls: {
      success: returns.success,
      pending: returns.pending,
      failure: returns.failure
    },
    statement_descriptor: 'JANTAR LINK PRO'
  };
  if (returns.autoReturn) payload.auto_return = 'approved';
  if (ENV.MP_NOTIFICATION_URL) {
    payload.notification_url = ENV.MP_NOTIFICATION_URL;
  }
  console.log('MP back_urls', returns.success, 'auto_return=' + !!payload.auto_return);

  async function postPreference(body) {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + ENV.MP_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order.id + (body.auto_return ? '' : '-noar')
      },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  let { res, data } = await postPreference(payload);
  if (!res.ok && payload.auto_return) {
    const origin = ENV.PUBLIC_APP_ORIGIN || '';
    if (origin.includes('127.0.0.1') || origin.includes('localhost')) {
      console.warn('MP preference com auto_return falhou; tentando sem redirect automático', res.status);
      delete payload.auto_return;
      ({ res, data } = await postPreference(payload));
    }
  }
  if (!res.ok) {
    const err = new Error('mp_preference_failed');
    err.detail = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

async function syncOrderFromMp(order) {
  if (!ENV.MP_ACCESS_TOKEN || order.provider === 'mock') return order;
  if (order.status === 'paid') return order;

  async function searchPayments(query) {
    const url =
      'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&' + query;
    const res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + ENV.MP_ACCESS_TOKEN }
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return [];
    return data.results || [];
  }

  let results = await searchPayments(
    'external_reference=' + encodeURIComponent(order.id)
  );

  /* Fallback: preference_id (providerRef logo após criar a preferência) */
  if (!results.length && order.providerRef && !String(order.providerRef).match(/^\d+$/)) {
    results = await searchPayments(
      'preference_id=' + encodeURIComponent(order.providerRef)
    );
  }
  /* Fallback: preference id numérico antigo / id da preferência MP */
  if (!results.length && order.providerRef) {
    results = await searchPayments(
      'preference_id=' + encodeURIComponent(order.providerRef)
    );
  }

  const approved = results.find((p) => p.status === 'approved');
  if (approved) {
    if (!paymentAmountMatches(order, approved)) {
      console.warn('amount_mismatch', order.id, approved.transaction_amount, order.amountCentavos);
      return order;
    }
    order.providerRef = String(approved.id);
    console.log('sync paid', order.id, 'payment', approved.id);
    return fulfill(order);
  }
  const rejected = results.find((p) => p.status === 'rejected' || p.status === 'cancelled');
  if (rejected) {
    order.status = 'failed';
    order.providerRef = String(rejected.id);
    orders.set(order.id, order);
  } else {
    console.log(
      'sync pending',
      order.id,
      'results',
      results.length,
      results.map((p) => p.status).join(',')
    );
  }
  return order;
}

async function handleWebhook(body, query, headers = {}) {
  let topic = query.get('topic') || query.get('type') || '';
  let paymentId = query.get('id') || query.get('data.id') || '';
  if (body) {
    if (body.type) topic = body.type;
    if (body.data && body.data.id) paymentId = String(body.data.id);
  }

  if (webhookSignatureRequired(ENV, () => isMock())) {
    const secret = String(ENV.MP_WEBHOOK_SECRET || '').trim();
    if (!secret) return { error: 'webhook_secret_required', status: 401 };
    const ok = await verifyMpWebhookSignature({
      signatureHeader: headers['x-signature'] || '',
      requestId: headers['x-request-id'] || '',
      dataId: query.get('data.id') || paymentId,
      secret
    });
    if (!ok) return { error: 'invalid_signature', status: 401 };
  }

  if (!paymentId) {
    return { ok: true, skipped: true };
  }

  const key = createHash('sha256')
    .update(`${topic}:${paymentId}:${JSON.stringify(body || {})}`)
    .digest('hex')
    .slice(0, 24);
  if (events.has(key)) return { ok: true, duplicate: true };
  events.set(key, true);

  if (!ENV.MP_ACCESS_TOKEN) {
    return { ok: true, skipped: true };
  }

  const payRes = await fetch('https://api.mercadopago.com/v1/payments/' + paymentId, {
    headers: { Authorization: 'Bearer ' + ENV.MP_ACCESS_TOKEN }
  });
  const payment = await payRes.json().catch(() => null);
  if (!payRes.ok || !payment) return { error: 'payment_fetch_failed', status: 502 };

  const orderId = payment.external_reference;
  if (!orderId || !orders.has(orderId)) return { ok: true, order_missing: true };

  let order = orders.get(orderId);
  order.providerRef = String(payment.id);
  if (payment.status === 'approved') {
    if (!paymentAmountMatches(order, payment)) {
      return { ok: true, orderId, status: order.status, error: 'amount_mismatch' };
    }
    order = fulfill(order);
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    order.status = 'failed';
    orders.set(orderId, order);
  }
  return { ok: true, orderId, status: order.status };
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === 'OPTIONS') return json(res, 204, null, origin);

  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
      return json(
        res,
        200,
        {
          ok: true,
          service: 'jantar-link-commerce-mp',
          mock: isMock(),
          testToken: isTestToken(),
          amountCentavos: moneyCentavos(),
          hint: 'Site: http://127.0.0.1:5177/?modo=venda'
        },
        origin
      );
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return json(
        res,
        200,
        {
          ok: true,
          service: 'jantar-link-commerce-mp',
          mock: isMock(),
          hasToken: !!ENV.MP_ACCESS_TOKEN
        },
        origin
      );
    }

    /* Só local: lista pedidos em memória (some se reiniciar o Worker) */
    if (req.method === 'GET' && url.pathname === '/api/debug/orders') {
      const list = Array.from(orders.values()).map((o) => ({
        id: o.id,
        status: o.status,
        fromName: o.fromName,
        toName: o.toName,
        providerRef: o.providerRef,
        paidAt: o.paidAt,
        createdAt: o.createdAt
      }));
      return json(res, 200, { count: list.length, orders: list }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/shorten') {
      const body = await readBody(req);
      const longUrl = String(body?.url || '').trim();
      if (!/^https?:\/\//i.test(longUrl)) {
        return json(res, 400, { error: 'invalid_url' }, origin);
      }
      // CleanURI
      try {
        const r = await fetch('https://cleanuri.com/api/v1/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'url=' + encodeURIComponent(longUrl)
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.result_url) {
          return json(res, 200, { shortUrl: String(data.result_url).trim(), via: 'cleanuri' }, origin);
        }
      } catch (e) {
        console.warn('shorten cleanuri', e.message);
      }
      // TinyURL
      try {
        const r = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(longUrl));
        const text = (await r.text()).trim();
        if (r.ok && text.indexOf('http') === 0) {
          return json(res, 200, { shortUrl: text, via: 'tinyurl' }, origin);
        }
      } catch (e) {
        console.warn('shorten tinyurl', e.message);
      }
      return json(res, 502, { error: 'shorten_failed', shortUrl: longUrl }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/checkout') {
      if (isMock()) {
        return json(
          res,
          400,
          {
            error: 'mock_mode',
            hint: 'Defina MP_ACCESS_TOKEN e MOCK_MODE=false em .dev.vars'
          },
          origin
        );
      }
      const body = await readBody(req);
      const fromName = String(body?.fromName || '').trim().slice(0, 40);
      const toName = String(body?.toName || '').trim().slice(0, 40);
      if (!fromName || !toName) return json(res, 400, { error: 'names_required' }, origin);

      const orderId = 'ord_' + randomUUID().replace(/-/g, '').slice(0, 16);
      const orderSecret = randomBytes(32).toString('hex');
      const invitePhone = String(body?.invitePhone || '').replace(/\D/g, '').slice(0, 15);
      const replyPhone = String(body?.replyPhone || '').replace(/\D/g, '').slice(0, 15);
      const order = {
        id: orderId,
        orderSecret,
        status: 'pending',
        fromName,
        toName,
        contact: String(body?.contact || '').slice(0, 120),
        configPayload: String(body?.configPayload || '').slice(0, 2500),
        invitePhone,
        replyPhone,
        consumed: false,
        consumedAt: null,
        amountCentavos: moneyCentavos(),
        provider: 'mercadopago',
        providerRef: null,
        proUrl: null,
        createdAt: new Date().toISOString(),
        paidAt: null
      };

      let preference;
      try {
        preference = await createMpPreference(order);
      } catch (e) {
        const cause = e.cause || e;
        const tlsHint =
          String(cause.code || cause.message || e.message || '').includes('UNABLE_TO_VERIFY') ||
          String(e.message || '') === 'fetch failed'
            ? ' TLS: reinicie com node --use-system-ca mp-server.mjs (ou npm run dev:mp)'
            : '';
        console.error('MP preference error', e.status, JSON.stringify(e.detail || e.message), tlsHint);
        return json(
          res,
          502,
          {
            error: 'mp_preference_failed',
            status: e.status || null,
            detail: e.detail || String(e.message || e),
            hint: tlsHint.trim() || undefined
          },
          origin
        );
      }

      order.providerRef = preference.id;
      orders.set(orderId, order);

      const checkoutUrl = isTestToken()
        ? preference.sandbox_init_point || preference.init_point
        : preference.init_point || preference.sandbox_init_point;

      if (!checkoutUrl) {
        return json(res, 502, { error: 'mp_no_checkout_url', preference }, origin);
      }

      return json(
        res,
        200,
        {
          orderId,
          orderSecret,
          checkoutUrl,
          mock: false,
          amountCentavos: order.amountCentavos,
          sandbox: isTestToken()
        },
        origin
      );
    }

    if (req.method === 'GET' && url.pathname === '/api/licenses/pro') {
      const token = String(url.searchParams.get('token') || '').trim();
      const originHost = String(ENV.PUBLIC_APP_ORIGIN || '');
      if (token === 'JL-PRO-DEMO') {
        if (originHost.includes('helderabud.github.io')) {
          return json(res, 401, { error: 'unauthorized' }, origin);
        }
        return json(res, 200, { ok: true, demo: true }, origin);
      }
      const orderId = licenses.get(token);
      if (!orderId) return json(res, 401, { error: 'unauthorized' }, origin);
      return json(res, 200, { ok: true, orderId }, origin);
    }

    const syncMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/sync$/);
    if (req.method === 'POST' && syncMatch) {
      const order = orders.get(syncMatch[1]);
      if (!order) return json(res, 404, { error: 'not_found' }, origin);
      if (providedSecret(req, url) !== order.orderSecret) {
        return json(res, 401, { error: 'unauthorized' }, origin);
      }
      const updated = await syncOrderFromMp(order);
      return json(
        res,
        200,
        {
          id: updated.id,
          status: updated.status,
          proUrl: updated.proUrl,
          paidAt: updated.paidAt,
          amountCentavos: updated.amountCentavos,
          invitePhone: updated.invitePhone || '',
          replyPhone: updated.replyPhone || '',
          consumed: !!updated.consumed
        },
        origin
      );
    }

    const consumeMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/consume$/);
    if (req.method === 'POST' && consumeMatch) {
      const order = orders.get(consumeMatch[1]);
      if (!order) return json(res, 404, { error: 'not_found' }, origin);
      if (providedSecret(req, url) !== order.orderSecret) {
        return json(res, 401, { error: 'unauthorized' }, origin);
      }
      if (order.status !== 'paid') return json(res, 409, { error: 'not_paid' }, origin);
      if (order.consumed) {
        return json(
          res,
          200,
          { ok: true, id: order.id, consumed: true, consumedAt: order.consumedAt },
          origin
        );
      }
      order.consumed = true;
      order.consumedAt = new Date().toISOString();
      orders.set(order.id, order);
      return json(
        res,
        200,
        { ok: true, id: order.id, consumed: true, consumedAt: order.consumedAt },
        origin
      );
    }

    const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (req.method === 'GET' && orderMatch) {
      let order = orders.get(orderMatch[1]);
      if (!order) return json(res, 404, { error: 'not_found' }, origin);
      if (providedSecret(req, url) !== order.orderSecret) {
        return json(res, 401, { error: 'unauthorized' }, origin);
      }
      if (order.status === 'pending' && url.searchParams.get('sync') === '1') {
        order = await syncOrderFromMp(order);
      }
      return json(
        res,
        200,
        {
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
          mock: false
        },
        origin
      );
    }

    if (
      (req.method === 'POST' || req.method === 'GET') &&
      url.pathname === '/api/webhooks/mercadopago'
    ) {
      const body = req.method === 'POST' ? await readBody(req).catch(() => null) : null;
      const out = await handleWebhook(body, url.searchParams, req.headers);
      const status = out.status || (out.error === 'payment_fetch_failed' ? 502 : 200);
      return json(res, status, out, origin);
    }

    return json(res, 404, { error: 'not_found' }, origin);
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'internal_error', message: String(e.message || e) }, origin);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`MP server http://127.0.0.1:${PORT}`);
  console.log(`mock=${isMock()} testToken=${isTestToken()} amount=${moneyCentavos()} centavos`);
  console.log(`appBase=${appBase()}`);
  if (isMock()) {
    console.log('>>> Configure MP_ACCESS_TOKEN e MOCK_MODE=false em .dev.vars');
  } else {
    console.log('>>> Sandbox/real pronto. Abra http://127.0.0.1:5177/?modo=venda');
  }
});
