/**
 * Smoke HTTP dos fluxos Jantar Link (site local + Worker + Pages).
 * Nao completa pagamento real no Mercado Pago.
 */
const SITE = 'http://127.0.0.1:5177';
const API = 'http://127.0.0.1:8787';
const PAGES = 'https://helderabud.github.io/Jantar';

const checks = [];

function ok(name, pass, detail) {
  checks.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
}

async function get(url) {
  const res = await fetch(url, { redirect: 'manual' });
  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  const site = await get(SITE + '/index.html');
  ok('Site local 5177', site.status === 200, site.status);
  ok('HTML tem modo venda', site.text.includes('id="vd-from"'), '');
  ok('HTML tem editor Pro', site.text.includes('id="ed-from"') && site.text.includes('JL-PRO-DEMO'), '');
  ok('HTML abre Pro apos pagar', site.text.includes('localizeProUrl(data.proUrl)'), '');

  const venda = await get(SITE + '/index.html?modo=venda');
  ok('GET ?modo=venda', venda.status === 200, venda.status);

  const editor = await get(SITE + '/index.html?pro=JL-PRO-DEMO&modo=editor');
  ok('GET editor Pro demo', editor.status === 200, editor.status);

  const localPago = await get(SITE + '/pago.html');
  ok('pago.html local existe', localPago.status === 200, localPago.status);
  ok(
    'pago.html redireciona para o app local',
    localPago.text.includes('127.0.0.1:5177') && localPago.text.includes('location.replace'),
    ''
  );

  const health = await get(API + '/health');
  ok('Worker /health', health.status === 200 && health.text.includes('"ok":true'), health.text.slice(0, 180));
  let h = {};
  try {
    h = JSON.parse(health.text);
  } catch {
    h = {};
  }
  ok('Worker sandbox (nao mock)', h.mock === false && h.hasToken === true, JSON.stringify({ mock: h.mock, hasToken: h.hasToken }));

  const checkoutRes = await fetch(API + '/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:5177' },
    body: JSON.stringify({
      fromName: 'Bruno',
      toName: 'Lara',
      invitePhone: '5561999999999',
      replyPhone: '5561888888888'
    })
  });
  const ctext = await checkoutRes.text();
  let cjson = {};
  try {
    cjson = JSON.parse(ctext);
  } catch {
    cjson = {};
  }
  ok(
    'POST /api/checkout',
    checkoutRes.status === 200 && !!cjson.orderId && !!cjson.checkoutUrl && !!cjson.orderSecret,
    String(checkoutRes.status)
  );
  ok(
    'Checkout URL e Mercado Pago',
    typeof cjson.checkoutUrl === 'string' && cjson.checkoutUrl.includes('mercadopago'),
    cjson.checkoutUrl ? 'ok' : 'missing'
  );

  if (cjson.orderId) {
    const ord = await fetch(API + '/api/orders/' + cjson.orderId, {
      headers: { 'X-Order-Secret': cjson.orderSecret || '' }
    });
    const otext = await ord.text();
    const o = JSON.parse(otext);
    ok('GET pedido pending', ord.status === 200 && o.status === 'pending', o.status);
  } else {
    ok('GET pedido pending', false, 'sem orderId');
  }

  const pagesPago = await get(PAGES + '/pago.html');
  ok('Pages pago.html no ar', pagesPago.status === 200, pagesPago.status);
  ok(
    'Pages pago.html faz bounce local',
    pagesPago.text.includes('location.replace') && pagesPago.text.includes('127.0.0.1:5177'),
    ''
  );

  const pagesHome = await get(PAGES + '/');
  ok('Pages home no ar', pagesHome.status === 200, pagesHome.status);

  const failed = checks.filter((c) => !c.pass);
  for (const c of checks) {
    console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.name + (c.detail ? '  (' + c.detail + ')' : ''));
  }
  console.log('---');
  console.log('total=' + checks.length + ' pass=' + (checks.length - failed.length) + ' fail=' + failed.length);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
