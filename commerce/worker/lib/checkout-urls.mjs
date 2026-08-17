/** URLs de retorno do Checkout Pro. Mercado Pago recusa localhost/127.0.0.1. */

export const DEFAULT_PUBLIC_RETURN = 'https://helderabud.github.io/Jantar';

export function isLocalHttpOrigin(origin) {
  const o = String(origin || '').toLowerCase();
  return o.includes('localhost') || o.includes('127.0.0.1') || /^http:\/\//.test(o.trim());
}

export function isTestAccessToken(token) {
  const t = String(token || '');
  return /TEST-/i.test(t);
}

/**
 * Produção (Pages) nunca pode devolver sandbox.mercadopago.
 * Token TEST- com origem github.io = erro explícito, não redirect de teste.
 */
export function pickMpCheckoutUrl({
  accessToken,
  initPoint,
  sandboxInitPoint,
  publicApp
}) {
  const test = isTestAccessToken(accessToken);
  if (publicApp && test) return { error: 'test_token_not_allowed' };
  if (publicApp) {
    const url = String(initPoint || '');
    if (!url || /sandbox\.mercadopago/i.test(url)) {
      return { error: 'sandbox_checkout_not_allowed' };
    }
    return { url };
  }
  if (test) return { url: sandboxInitPoint || initPoint || '' };
  return { url: initPoint || sandboxInitPoint || '' };
}

function joinOriginPath(origin, path) {
  const o = String(origin || '').replace(/\/$/, '');
  let p = path == null || path === '' ? '/' : String(path);
  if (!p.startsWith('/')) p = '/' + p;
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  if (p === '/') return o;
  return o + p;
}

/**
 * back_urls para a preferência MP.
 * Em localhost, aponta para Pages (HTTPS) para o MP conseguir redirecionar
 * para fora da tela verde. O Pro continua a abrir no PUBLIC_APP_ORIGIN.
 */
export function buildMpReturnUrls({
  appOrigin,
  appPath = '/',
  returnOrigin,
  orderId
}) {
  const id = encodeURIComponent(String(orderId || ''));
  const local = isLocalHttpOrigin(appOrigin);
  const base = local
    ? String(returnOrigin || DEFAULT_PUBLIC_RETURN).replace(/\/$/, '')
    : joinOriginPath(appOrigin, appPath);
  const bounce = (extra) => {
    const q = extra ? `&${extra}` : '';
    return `${base}/pago.html?order=${id}${q}`;
  };
  return {
    success: bounce(),
    pending: bounce('status=pending'),
    failure: bounce('status=failure'),
    autoReturn: !isLocalHttpOrigin(base)
  };
}

/**
 * Onde o pago.html manda o comprador depois do Mercado Pago.
 * Pages: editor no mesmo origin. Localhost: bounce para 5177.
 */
export function buildPagoBounceUrl({ hostname, origin, pathname, orderId }) {
  const id = String(orderId || '');
  const onPages = String(hostname || '') === 'helderabud.github.io';
  if (onPages) {
    const dir = String(pathname || '/').replace(/pago\.html$/i, '');
    const root = String(origin || '').replace(/\/$/, '') + (dir.endsWith('/') ? dir : dir + '/');
    const q = id
      ? `?modo=venda&pago=1&order=${encodeURIComponent(id)}`
      : '?modo=venda';
    return { url: root + q, sameOrigin: true };
  }
  const q = id ? `&pago=1&order=${encodeURIComponent(id)}&api=cf` : '&api=cf';
  return {
    url: `http://127.0.0.1:5177/index.html?modo=venda${q}`,
    sameOrigin: false
  };
}

export function buildProUrl({ appOrigin, appPath = '/', proToken, payload }) {
  const base = joinOriginPath(appOrigin, appPath) + '/';
  const token = encodeURIComponent(proToken || 'JL-PRO-DEMO');
  const hash = payload ? `#c=${payload}` : '';
  return `${base}?pro=${token}&modo=editor${hash}`;
}
