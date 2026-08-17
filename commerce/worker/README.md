# Commerce Worker — Jantar Link (F2)

API de checkout + webhook Mercado Pago. Front estático chama este Worker.

## Setup rápido (mock — sem MP / sem Wrangler)

```bash
cd commerce/worker
npm run dev:mock
```

Sobe `http://127.0.0.1:8787`. No front local, `BRAND.checkoutApiBase` aponta para essa URL. No GitHub Pages, aponta para o Worker HTTPS (`checkoutApiPublic`).

Com Pages em `5177` + mock em `8787`: `/?modo=venda` → nomes → **Pagar Pro**.

## Setup Wrangler (Cloudflare)

```bash
cd commerce/worker
npm install
# se o npm bloquear scripts: npm approve-scripts esbuild && npm approve-scripts workerd && npm rebuild
copy .dev.vars.example .dev.vars
npm run dev
```

## Fluxo mock

1. Front `POST /api/checkout` → recebe `checkoutUrl` com `mock_pay=1`
2. Front detecta `mock_pay` → `POST /api/webhooks/mercadopago` `{ mock:true, orderId }`
3. `GET /api/orders/:id` → `proUrl` com `?pro=`

## Mercado Pago sandbox (real)

Guia completo: [`docs/venda/SANDBOX-MERCADO-PAGO.md`](../../docs/venda/SANDBOX-MERCADO-PAGO.md)

```bash
cd commerce/worker
# edite .dev.vars: MP_ACCESS_TOKEN=TEST-...  MOCK_MODE=false
npm run dev:mp
```

Front: `http://127.0.0.1:5177/?modo=venda` → Pagar Pro → Checkout MP.


```bash
cd commerce/worker
npm test
```

## Secrets

| Var | Uso |
|-----|-----|
| `MP_ACCESS_TOKEN` | API MP |
| `PRO_TOKEN` | Mesmo valor de `BRAND.proTokens` no front |
| `CHECKOUT_AMOUNT_CENTAVOS` | Preço (4900 = R$ 49) |
| `PUBLIC_APP_ORIGIN` / `PUBLIC_APP_PATH` | Base do link Pro (localhost no sandbox) |
| `PUBLIC_RETURN_ORIGIN` | HTTPS para o MP voltar (Pages). Localhost é recusado. |

Nunca commitar `.dev.vars`.

## Produção (Cloudflare)

Go-live com token de produção, KV e Pages: [`docs/venda/DEPLOY-CLOUDFLARE.md`](../../docs/venda/DEPLOY-CLOUDFLARE.md).

## HITL

Se o Worker cair: `docs/venda/ENTREGA-HITL.md`.
