import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8799;
const BASE = 'http://127.0.0.1:' + PORT;

function waitForHealth(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('mock-server health timeout')), timeoutMs);
    const tick = async () => {
      try {
        const res = await fetch(BASE + '/health');
        if (res.ok) {
          clearTimeout(t);
          resolve();
          return;
        }
      } catch (_) {}
      if (child.exitCode != null) {
        clearTimeout(t);
        reject(new Error('mock-server exited ' + child.exitCode));
        return;
      }
      setTimeout(tick, 80);
    };
    tick();
  });
}

describe('mock checkout flow', () => {
  let child;

  before(async () => {
    child = spawn(process.execPath, ['mock-server.mjs'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: String(PORT), PUBLIC_APP_ORIGIN: 'http://127.0.0.1:5177' },
      stdio: 'pipe'
    });
    await waitForHealth(child, 5000);
  });

  after(() => {
    if (child && !child.killed) child.kill();
  });

  it('checkout then mock webhook returns proUrl to the local editor', async () => {
    const created = await fetch(BASE + '/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromName: 'Bruno', toName: 'Lara' })
    });
    assert.equal(created.status, 200);
    const order = await created.json();
    assert.ok(order.orderId);
    assert.match(order.checkoutUrl, /mock_pay=1/);

    const paid = await fetch(BASE + '/api/webhooks/mercadopago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mock: true, orderId: order.orderId })
    });
    assert.equal(paid.status, 200);
    const fulfill = await paid.json();
    assert.equal(fulfill.status, 'paid');
    assert.match(fulfill.proUrl, /127\.0\.0\.1:5177/);
    assert.match(fulfill.proUrl, /pro=JL-PRO-DEMO/);
    assert.match(fulfill.proUrl, /modo=editor/);
  });
});
