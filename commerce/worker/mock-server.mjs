/**
 * Mock HTTP do commerce (sem Wrangler) — só para dev local.
 * node mock-server.mjs
 */
import http from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const APP_ORIGIN = (process.env.PUBLIC_APP_ORIGIN || 'http://127.0.0.1:5177').replace(/\/$/, '');
const APP_PATH = process.env.PUBLIC_APP_PATH || '/';
const pathBase = APP_PATH.endsWith('/') ? APP_PATH : APP_PATH + '/';
const appBase = APP_ORIGIN + pathBase;

const orders = new Map();
const events = new Map();
const licenses = new Map();

function json(res, status, body, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Order-Secret'
  };
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('helderabud.github.io'))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
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
  const str = JSON.stringify(obj);
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomHex(bytes) {
  return randomBytes(bytes).toString('hex');
}

function providedSecret(req, url) {
  return String(req.headers['x-order-secret'] || url.searchParams.get('secret') || '').trim();
}

function fulfill(order) {
  const payload = order.configPayload || b64url({ f: order.fromName, t: order.toName });
  const proToken = 'jl_' + randomHex(16);
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  order.proToken = proToken;
  order.proUrl = `${appBase}?pro=${encodeURIComponent(proToken)}&modo=editor#c=${payload}`;
  orders.set(order.id, order);
  licenses.set(proToken, order.id);
  return order;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === 'OPTIONS') {
    return json(res, 204, null, origin);
  }

  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
      return json(res, 200, {
        ok: true,
        service: 'jantar-link-commerce-mock',
        hint: 'Isto é a API de pagamento, não o site. Abra o convite em http://127.0.0.1:5177/?modo=venda e use Pagar Pro.',
        health: '/health',
        checkout: 'POST /api/checkout'
      }, origin);
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, service: 'jantar-link-commerce-mock' }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/checkout') {
      const body = await readBody(req);
      const fromName = String(body?.fromName || '').trim().slice(0, 40);
      const toName = String(body?.toName || '').trim().slice(0, 40);
      if (!fromName || !toName) return json(res, 400, { error: 'names_required' }, origin);
      const orderId = 'ord_' + randomUUID().replace(/-/g, '').slice(0, 16);
      const orderSecret = randomHex(32);
      const order = {
        id: orderId,
        orderSecret,
        status: 'pending',
        fromName,
        toName,
        contact: String(body?.contact || '').slice(0, 120),
        configPayload: String(body?.configPayload || '').slice(0, 2500),
        amountCentavos: Number(process.env.CHECKOUT_AMOUNT_CENTAVOS || 200),
        provider: 'mock',
        proUrl: null,
        createdAt: new Date().toISOString(),
        paidAt: null
      };
      orders.set(orderId, order);
      const checkoutUrl = `${appBase}?modo=venda&pago=mock&order=${orderId}&mock_pay=1`;
      return json(res, 200, { orderId, orderSecret, checkoutUrl, mock: true, amountCentavos: order.amountCentavos }, origin);
    }

    if (req.method === 'GET' && url.pathname === '/api/licenses/pro') {
      const token = String(url.searchParams.get('token') || '').trim();
      if (token === 'JL-PRO-DEMO') return json(res, 200, { ok: true, demo: true }, origin);
      const orderId = licenses.get(token);
      if (!orderId) return json(res, 401, { error: 'unauthorized' }, origin);
      return json(res, 200, { ok: true, orderId }, origin);
    }

    const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (req.method === 'GET' && orderMatch) {
      const order = orders.get(orderMatch[1]);
      if (!order) return json(res, 404, { error: 'not_found' }, origin);
      if (providedSecret(req, url) !== order.orderSecret) {
        return json(res, 401, { error: 'unauthorized' }, origin);
      }
      return json(res, 200, {
        id: order.id,
        status: order.status,
        fromName: order.fromName,
        toName: order.toName,
        amountCentavos: order.amountCentavos,
        proUrl: order.proUrl,
        paidAt: order.paidAt,
        mock: true
      }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/webhooks/mercadopago') {
      const body = await readBody(req);
      if (body?.mock === true && body.orderId) {
        const key = `mock:${body.orderId}`;
        if (events.has(key)) return json(res, 200, { ok: true, duplicate: true }, origin);
        const order = orders.get(body.orderId);
        if (!order) return json(res, 404, { error: 'not_found' }, origin);
        fulfill(order);
        events.set(key, true);
        return json(res, 200, { ok: true, orderId: order.id, status: order.status }, origin);
      }
      return json(res, 200, { ok: true, skipped: true }, origin);
    }

    return json(res, 404, { error: 'not_found' }, origin);
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'internal_error' }, origin);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Jantar Link commerce mock on http://127.0.0.1:${PORT}`);
  console.log(`App base: ${appBase}`);
});
