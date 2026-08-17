# Deploy Cloudflare Worker — Jantar Link (produção)

Objetivo: quem paga em `https://helderabud.github.io/Jantar/?modo=venda` volta ao **editor Pro no Pages**, sem `127.0.0.1`.

Token Mercado Pago de **produção** (não começa com `TEST-`) e `PRO_TOKEN` **nunca** entram no chat nem no Git.

## Preço (HITL)

O Worker cobra `CHECKOUT_AMOUNT_CENTAVOS` (hoje **200 = R$ 2,00**, igual ao rótulo do site). Confirme o valor **antes** do primeiro PIX/cartão real. Para R$ 29: `2900`.

## 1. Login e KV

Neste PC o `wrangler login` (botão Autorizar) costuma **quebrar**: depois do Allow o Cloudflare manda o browser para `http://localhost:8976/oauth/callback`. Se o Wrangler já fechou, ou o antivírus/VPN bloqueia esse localhost, a página fica em branco / não carrega.

**Caminho que funciona:** API Token (sem OAuth).

1. Abra https://dash.cloudflare.com/profile/api-tokens  
2. **Create Token** → use o template **Edit Cloudflare Workers** (ou permissões: Workers Scripts Edit, Workers KV Storage Edit, Account Settings Read).  
3. Copie o token **só no PowerShell** — nunca no chat nem no Git.

```powershell
cd "$env:USERPROFILE\Desktop\Aléxia\commerce\worker"
$env:NODE_OPTIONS='--use-system-ca'
$env:CLOUDFLARE_API_TOKEN='cole-aqui-sem-aspas'
npx wrangler whoami
npx wrangler kv namespace create ORDERS
```

`whoami` tem de mostrar e-mail/conta. Depois cole o `id` do KV em `wrangler.toml` (`[[kv_namespaces]]`, `binding = "ORDERS"`).

Se ainda quiser tentar OAuth: deixe `npx wrangler login` **rodando**, clique Autorizar em até 1 minuto, janela anónima, VPN desligada. Não use o login disparado pelo Cursor — o processo morre e o localhost:8976 some.

## 2. Secrets (colar só no terminal)

```bash
npx wrangler secret put MP_ACCESS_TOKEN
npx wrangler secret put PRO_TOKEN
```

`PRO_TOKEN` = o mesmo de `BRAND.proTokens` no `index.html` (`JL-PRO-DEMO` no MVP).

O Access Token de produção **não** começa com `TEST-`. Comprador `TESTUSER…` **não** funciona com token de produção.

## 3. Deploy e health

Worker no ar:

`https://jantar-link-commerce.jantar-alexia-2026alexia-link-pagamentojantar-hunter.workers.dev`

Aceite de health (2026-08-17): `GET /health` → `{ "ok": true, "kv": true }`.

Depois de gravar `MP_NOTIFICATION_URL` no `wrangler.toml`, rode de novo:

```powershell
npx wrangler deploy
```

No painel Mercado Pago, webhook da aplicação =  
`https://jantar-link-commerce.jantar-alexia-2026alexia-link-pagamentojantar-hunter.workers.dev/api/webhooks/mercadopago`

## 4. Smoke ponta a ponta (não use :8787)

Antes do merge no Pages, use o front local contra o Worker público:

`http://127.0.0.1:5177/?modo=venda&api=cf`

(`python -m http.server 5177` na raiz do repo. Não precisa do `:8787`.)

1. Pagar com PIX/cartão **real** (R$ 2,00). Comprador `TESTUSER…` não serve.
2. Voltar → editor Pro (nomes + 1 envio).
3. Pedido `paid` no Worker (webhook ou sync).

Depois do merge: `https://helderabud.github.io/Jantar/?modo=venda` (sem `api=cf`).

## 5. Git

Não commitar `.dev.vars`. PR só depois do aceite HITL deste guia.
