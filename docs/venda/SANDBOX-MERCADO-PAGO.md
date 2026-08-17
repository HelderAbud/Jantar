# Mercado Pago Sandbox — Jantar Link

Objetivo: PIX/cartão de **teste** (não mock). Token **só** em `.dev.vars` — nunca no chat nem no Git.

## 1. Conta e token de teste

1. Entre em https://www.mercadopago.com.br/developers/panel  
2. Crie uma aplicação (ou use uma existente).  
3. Em **Credenciais de teste**, copie o **Access Token** (costuma conter `TEST-...`).  
4. Abra `commerce/worker/.dev.vars` (copie de `.dev.vars.example` se não existir).  
5. Cole o token **só no arquivo**, assim:

```env
MP_ACCESS_TOKEN=TEST-cole-aqui-sem-aspas
MOCK_MODE=false
PRO_TOKEN=JL-PRO-DEMO
CHECKOUT_AMOUNT_CENTAVOS=200
PUBLIC_APP_ORIGIN=http://127.0.0.1:5177
PUBLIC_APP_PATH=/
# Opcional (túnel público para webhook):
# MP_NOTIFICATION_URL=https://xxxx.trycloudflare.com/api/webhooks/mercadopago
```

## 2. Subir API + site

Terminal A (pagamento real):

```bash
cd commerce/worker
npm run dev:mp
# equivalente: node --use-system-ca mp-server.mjs
```

Deve imprimir `mock=false testToken=true`.

> **Windows / antivírus:** se aparecer `fetch failed` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, o Node não está a usar o CA do sistema. Use sempre `--use-system-ca` (já no script `npm run dev:mp`).

Terminal B (front):

```bash
cd <raiz Aléxia>
python -m http.server 5177
```

## 3. Testar compra

1. http://127.0.0.1:5177/?modo=venda  
2. Nomes → **Pagar Pro**  
3. Abre Checkout Mercado Pago (sandbox)  
4. Pague com usuário/cartão/PIX de **teste** do MP  
5. Volta para o site → sync busca o pagamento → libera Pro (`?pro=JL-PRO-DEMO`)

### Cartões de teste (MP)

Consulte a doc atual: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards  

Exemplo clássico (pode mudar — confira a doc):

- Mastercard: `5031 4332 1540 6351`  
- CVV: `123` · validade futura · nome qualquer  

PIX teste: no **sandbox** o Checkout Pro muitas vezes **não mostra Pix**. Use cartão ou saldo da conta teste.

### Depois de pagar

O Mercado Pago **não volta para localhost** (`127.0.0.1`). Por isso a tela verde “pagamento aprovado” parecia travada.

Fluxo certo agora:

1. Clique **Pagar Pro** e **deixe a aba do Jantar Link aberta**.
2. Pague na janela do Mercado Pago (usuário/cartão de **teste**).
3. A aba do app confirma sozinha e abre o **editor Pro**.
4. Se a janela do MP ficar verde, pode fechá-la.
5. No editor, o convite **ainda não foi enviado** — você clica **Enviar** (1 vez).

O MP redireciona a janela de checkout para o GitHub Pages (`/?modo=venda&pago=1`). Isso só tira da tela verde; o Pro continua a abrir no `http://127.0.0.1:5177`. Não use `pago.html` na bio/retorno até esse arquivo estar publicado no Pages.

Em produção (HTTPS no próprio site) o `auto_return` volta direto ao Jantar Link.

### Erro: “Uma das partes … é de teste”

Significa mistura de conta **real** e **sandbox**. Você estava logado como Helder (produção) a pagar uma preferência de teste.

1. No sandbox, **sair** da conta Helder.  
2. Entrar com um **usuário comprador de teste** (painel → Sua integração → Contas de teste).  
3. Repetir **Pagar Pro** e pagar com cartão de teste.  

Nunca use a conta real do vendedor como comprador no sandbox.

## 4. Webhook (opcional no sandbox local)

Sem URL pública, o fluxo usa **sync** na volta do checkout (`/api/orders/:id?sync=1`).  

Se quiser webhook de verdade:

```bash
# com cloudflared instalado, apontando para 8787
cloudflared tunnel --url http://127.0.0.1:8787
```

Coloque a URL HTTPS em `MP_NOTIFICATION_URL=.../api/webhooks/mercadopago` e reinicie `mp-server.mjs`.

## 5. Checklist

- [ ] Token TEST no `.dev.vars`  
- [ ] `MOCK_MODE=false`  
- [ ] `npm run dev:mp` → `mock=false` (usa `--use-system-ca`)  
- [ ] Front 5177 no ar  
- [ ] Pagamento sandbox aprovado → Pro liberado  
- [ ] Sem token no chat / Git  

## Problemas comuns

| Sintoma | Causa |
|---------|--------|
| `mock_mode` / `mock=true` | Token vazio ou `MOCK_MODE=true` |
| `mp_preference_failed` | Token inválido / app errada |
| Voltou do MP e não liberou | Clique **Já paguei** na aba do app; não feche o terminal `npm run dev:mp` |
| Tela verde do MP sem voltar | Esperado no localhost. Feche essa janela; o editor abre na aba do Jantar Link |
| Pagamento produção | Token de produção + Worker na Cloudflare: `docs/venda/DEPLOY-CLOUDFLARE.md` |
