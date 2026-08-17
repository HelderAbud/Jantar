import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMpReturnUrls,
  buildPagoBounceUrl,
  isLocalHttpOrigin,
  pickMpCheckoutUrl
} from './checkout-urls.mjs';

describe('buildMpReturnUrls', () => {
  it('does not send localhost back_urls to Mercado Pago', () => {
    const urls = buildMpReturnUrls({
      appOrigin: 'http://127.0.0.1:5177',
      appPath: '/',
      orderId: 'ord_abc'
    });

    assert.equal(urls.success.includes('127.0.0.1'), false);
    assert.equal(urls.success.includes('localhost'), false);
    assert.equal(urls.success.includes('pago.html'), true);
    assert.match(
      urls.success,
      /^https:\/\/helderabud\.github\.io\/Jantar\/pago\.html\?order=ord_abc$/
    );
    assert.equal(urls.autoReturn, true);
  });

  it('uses the public app origin in production', () => {
    const urls = buildMpReturnUrls({
      appOrigin: 'https://helderabud.github.io',
      appPath: '/Jantar/',
      orderId: 'ord_prod'
    });

    assert.equal(
      urls.success,
      'https://helderabud.github.io/Jantar/pago.html?order=ord_prod'
    );
    assert.equal(urls.autoReturn, true);
  });
});

describe('buildPagoBounceUrl', () => {
  it('stays on GitHub Pages for the public return', () => {
    const bounce = buildPagoBounceUrl({
      hostname: 'helderabud.github.io',
      origin: 'https://helderabud.github.io',
      pathname: '/Jantar/pago.html',
      orderId: 'ord_prod'
    });
    assert.equal(bounce.sameOrigin, true);
    assert.equal(
      bounce.url,
      'https://helderabud.github.io/Jantar/?modo=venda&pago=1&order=ord_prod'
    );
    assert.equal(bounce.url.includes('127.0.0.1'), false);
  });

  it('bounces localhost pago.html to the local editor', () => {
    const bounce = buildPagoBounceUrl({
      hostname: '127.0.0.1',
      origin: 'http://127.0.0.1:5177',
      pathname: '/pago.html',
      orderId: 'ord_dev'
    });
    assert.equal(bounce.sameOrigin, false);
    assert.equal(
      bounce.url,
      'http://127.0.0.1:5177/index.html?modo=venda&pago=1&order=ord_dev&api=cf'
    );
  });
});

describe('isLocalHttpOrigin', () => {
  it('treats loopback as local', () => {
    assert.equal(isLocalHttpOrigin('http://127.0.0.1:5177'), true);
    assert.equal(isLocalHttpOrigin('http://localhost:5177'), true);
    assert.equal(isLocalHttpOrigin('https://helderabud.github.io/Jantar'), false);
  });
});

describe('pickMpCheckoutUrl', () => {
  it('refuses TEST token on the public app origin', () => {
    const picked = pickMpCheckoutUrl({
      accessToken: 'TEST-abc',
      initPoint: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1',
      sandboxInitPoint: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=1',
      publicApp: true
    });
    assert.equal(picked.error, 'test_token_not_allowed');
  });

  it('never returns sandbox checkout for production origin', () => {
    const picked = pickMpCheckoutUrl({
      accessToken: 'APP_USR-live',
      initPoint: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1',
      sandboxInitPoint: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=1',
      publicApp: true
    });
    assert.equal(picked.url.includes('sandbox.mercadopago'), false);
    assert.match(picked.url, /^https:\/\/www\.mercadopago\.com\.br\//);
  });
});
