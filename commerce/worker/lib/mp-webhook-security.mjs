/**
 * Assinatura e valor do webhook Mercado Pago (fatia D).
 * Manifesto: id:[data.id];request-id:[x-request-id];ts:[ts];
 */

export function parseMpSignatureHeader(header) {
  const out = { ts: '', v1: '' };
  String(header || '')
    .split(',')
    .forEach((part) => {
      const i = part.indexOf('=');
      if (i < 0) return;
      const k = part.slice(0, i).trim();
      const v = part.slice(i + 1).trim();
      if (k === 'ts') out.ts = v;
      if (k === 'v1') out.v1 = v;
    });
  return out;
}

export function buildMpWebhookManifest({ dataId, requestId, ts }) {
  const parts = [];
  const id = String(dataId || '').toLowerCase();
  if (id) parts.push(`id:${id}`);
  if (requestId) parts.push(`request-id:${requestId}`);
  if (ts) parts.push(`ts:${ts}`);
  return parts.length ? parts.join(';') + ';' : '';
}

export async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(message)));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqualHex(a, b) {
  const x = String(a || '').toLowerCase();
  const y = String(b || '').toLowerCase();
  if (!x || x.length !== y.length) return false;
  let out = 0;
  for (let i = 0; i < x.length; i++) out |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return out === 0;
}

export async function verifyMpWebhookSignature({ signatureHeader, requestId, dataId, secret }) {
  const parsed = parseMpSignatureHeader(signatureHeader);
  if (!parsed.ts || !parsed.v1 || !secret) return false;
  const manifest = buildMpWebhookManifest({ dataId, requestId, ts: parsed.ts });
  const expected = await hmacSha256Hex(secret, manifest);
  return timingSafeEqualHex(expected, parsed.v1);
}

export function webhookSignatureRequired(env, isMockEnv) {
  if (typeof isMockEnv === 'function' ? isMockEnv(env) : false) return false;
  if (String(env.MP_WEBHOOK_SECRET || '').trim()) return true;
  return String(env.PUBLIC_APP_ORIGIN || '').includes('helderabud.github.io');
}

export function paymentAmountMatches(order, payment) {
  const paid = Math.round(Number(payment && payment.transaction_amount) * 100);
  const expected = Number(order && order.amountCentavos);
  return Number.isFinite(paid) && Number.isFinite(expected) && paid === expected;
}

export async function signMpWebhook({ secret, dataId, requestId, ts }) {
  const stamp = String(ts || Date.now());
  const manifest = buildMpWebhookManifest({ dataId, requestId, ts: stamp });
  const v1 = await hmacSha256Hex(secret, manifest);
  return { ts: stamp, v1, header: `ts=${stamp},v1=${v1}` };
}
