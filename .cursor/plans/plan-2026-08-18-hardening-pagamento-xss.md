# Hardening F2 — pagamento, XSS e gates Pro

Data: 2026-08-18  
Projeto: Jantar Link  
Status: **em implementação** — fatias A–D e F–G nesta sessão; **não iniciar E** sem gate humano.  
Trilha: **Hotfix** (fatias A–B) → **Complex** (fatias C–E) → **Normal** (F–G)  
Origem: code review do repo (2026-08-18)

> **For agentic workers:** NÃO implementar o plano inteiro de uma vez. Executar **uma fatia**, validar o critério de pronto, parar. Commit/push/deploy só com pedido explícito. Não mudar o fluxo das 7 telas nem os textos-base do convite.

---

## Objetivo

Fechar buracos que impedem **cobrar de verdade** e que permitem **XSS via link `#c=`**, sem antecipar a Fase 3 completa (conta, revogação, auditoria).

Sucesso: (1) não dá para marcar pedido como pago sem `MOCK_MODE` ou pagamento MP válido; (2) nomes no hash não executam HTML; (3) resposta da convidada não queima Pro; (4) GET/sync/consume exigem prova de posse; (5) testes cobrem o mock e rodam em CI.

## Fora de escopo (explícito)

- Fase 3: login, tabela de usuários, revogação, e-mail de entrega.
- Temas, foto, analytics, split de `index.html`.
- Implementar `/api/shorten` no Worker Cloudflare (manter fallback is.gd; documentar).
- Traduzir landing PT-PT → PT-BR (opcional, fatia G se sobrar).
- Trocar preço / SKU / gateway.

## Contrato afetado

| Área | Mudança? |
|------|----------|
| 7 telas do convite | Não (só sanitização de HTML na tela 3) |
| Free vs Pro (AGENTS) | **Confirmar:** resposta WA da convidada **não** consome licença |
| Editor / `#c=` | Mesmo encoding; nomes escapados no HTML gerado |
| Worker F2 | Mock, webhook, valor, auth de pedido |
| Token Pro | F2.1: token **por pedido** (não lista pública `JL-PRO-DEMO` em produção) — gate humano antes da fatia E |

Alinha com `AGENTS.md` (Free/Pro) e **corrige** o conflito do plano `plan-2026-07-28-venda-whatsapps-licenca-1-envio.md` item B (ciclo completo no browser da convidada): no MVP a resposta **não** queima Pro no client. Consumo server-side da resposta fica para F3.

Atualizar `AGENTS.md` na fatia F (docs): linha “não há testes automatizados”; README Free vs Pro.

---

## Decisões fechadas neste plano

| Tema | Escolha |
|------|---------|
| Mock webhook | Só se `MOCK_MODE=true` **e** origin/dev. Produção: 403. Não devolver `proUrl` no body do mock. |
| XSS | Escapar `from`/`to` em `personalizeDefaults` **e** `sanitizeNote` sempre em `applyConfig` |
| Valor MP | Fulfill só se `transaction_amount` (centavos) == `order.amountCentavos` (tolerância 0) |
| Assinatura webhook | Validar `x-signature` / secret MP quando `MP_WEBHOOK_SECRET` estiver setado; sem secret em prod = recusar webhook (fail closed) |
| Auth pedidos | Secret `orderSecret` gerado no checkout, devolvido **só** na resposta de `POST /api/checkout` e guardado no front (sessionStorage). GET/sync/consume exigem header `X-Order-Secret` ou query `secret=` |
| Token Pro produção | Fatia E: token opaco **por pedido**, validado contra KV (`pro:<token>` → orderId). `JL-PRO-DEMO` só se `MOCK_MODE` ou localhost |
| `invitee_reply` | Remover `consumeProLicense` nesse clique |
| CI | Workflow mínimo: `cd commerce/worker && npm test` em PR |
| Encurtador | Sem endpoint CF nesta entrega |

## Decisão em aberto (gate humano na fatia E)

**Token por pedido vs só trocar `PRO_TOKEN` secreto.**  
Recomendado: **por pedido** (senão um pagante vaza `?pro=` e libera o produto para todos). Sem aprovação, parar depois da fatia D.

---

## Arquitetura (delta)

```text
Checkout → order { id, secret, amount, payload } no KV
         → client guarda secret
GET/sync/consume → 401 sem secret correto
Webhook MP → verifica assinatura → GET payment → amount match → fulfill
fulfill → gera proToken aleatório → KV pro:<token> = orderId
         → proUrl ?pro=<token>&modo=editor#c=...
Front resolveProFromUrl → consulta Worker OU valida formato + lookup
         (MVP: GET /api/pro/validate?token=  com rate limit leve)
```

Front atual compara token com `BRAND.proTokens`. Fatia E troca isso por validação no Worker (com cache curto em sessionStorage). Até E, fatias A–D **não** quebram o demo `JL-PRO-DEMO` em localhost.

`orderPublic` **não** inclui `proUrl` nem telefones se o secret não bater. Com secret: pode devolver `proUrl`.

---

## Fatias verticais

### A — Hotfix mock webhook (trilha Hotfix)

**Arquivos:** `commerce/worker/src/index.js`, `commerce/worker/lib/mock-flow.test.mjs` (ou novo teste), `index.html` (só o `fetch` mock: não chamar se Worker recusar).

- Recusar `{ mock: true }` quando `isMock(env) === false` → `403 mock_forbidden`.
- Em mock permitido: não retornar `proUrl` no JSON do webhook (o GET autenticado continua sendo a fonte).
- Teste: `MOCK_MODE=false` + `MP_ACCESS_TOKEN` dummy → mock 403; `MOCK_MODE=true` → fulfill ok.

**Pronto:** `npm test` passa; curl contra Worker local não paga pedido “real”.

### B — XSS nomes / `resultNote` (trilha Hotfix)

**Arquivos:** `index.html` (`personalizeDefaults`, `applyConfig`, `expandConfig`).

- `escapeHtml(from/to)` **antes** de interpolar em `resultNote`.
- `applyConfig`: `note.innerHTML = sanitizeNote(cfg.resultNote)`.
- Não relaxar `sanitizeNote` (só `<strong>`).

**Pronto:** `#c=` com `f` contendo `<img onerror>` mostra texto escapado na tela 3; demo Bruno/Lara visualmente igual.

### C — Licença: não queimar na resposta da convidada + landing (trilha Simple/Normal)

**Arquivos:** `index.html` (listener `btn-whatsapp`), `site/index.html` + `site/main.js`.

- Remover `consumeProLicense('invitee_reply')`.
- Mobile: botão `#btn-load-live` inicia com “Carregar demo no telefone” (ou chamar `showSlides()` no init mobile para sincronizar texto).

**Pronto:** convite com `?pro=` + fluxo até WA final **não** zera `jl_sends_left`; landing mobile: rótulo bate com slides visíveis.

### D — Valor + assinatura webhook + consume pago (trilha Complex)

**Arquivos:** `commerce/worker/src/index.js`, testes novos, `docs/venda/SANDBOX-MERCADO-PAGO.md` (como obter secret).

- `fulfill` só se amount bate (webhook e `syncOrderFromMp`).
- Assinatura MP fail-closed se `PUBLIC_APP_ORIGIN` for Pages **ou** se `MP_WEBHOOK_SECRET` definido. Local mock: skip.
- `handleConsumeOrder`: 404/409 se `status !== 'paid'`; idempotente se já consumed.
- Evento webhook sem `paymentId`: **não** gravar dedup key (permite retry).

**Pronto:** testes unitários com payment fixture (amount errado → não paid; signature inválida → 401).

### E — Auth de pedido + token Pro por pedido (trilha Complex) — **gate humano**

**Arquivos:** Worker + `index.html` (checkout, poll, `resolveProFromUrl`).

1. `orderSecret` (32 bytes hex) no checkout; client: `sessionStorage.jl_order_secret`.
2. GET/sync/consume exigem secret; sem ele: 401, body sem PII/`proUrl`.
3. `PRO_TOKEN` global deixa de autenticar produção. Token por pedido no KV; front valida via `GET /api/licenses/pro?token=` (nome a definir) **ou** lista só `JL-PRO-DEMO` em localhost/`MOCK_MODE`.
4. Rate limit simples por IP no checkout (ex.: 10/min KV) — mínimo da spec F2.

**Pronto:** sem secret, GET order não vaza WhatsApp; `?pro=JL-PRO-DEMO` **falha** no Pages de produção; pagamento sandbox gera token único que abre o editor.

**Risco:** quebra links Pro HITL antigos com `JL-PRO-DEMO`. Mitigação: Helder gera novos após deploy; documentar em `ENTREGA-HITL.md`.

### F — Testes de regressão + CI (trilha Normal)

- Teste A (mock 403) já na fatia A; acrescentar XSS não dá no Worker — smoke manual documentado.
- `.github/workflows/worker-test.yml`: `npm test` em `commerce/worker` (Node 22).
- Corrigir `AGENTS.md`: “há testes do Worker; não há testes do `index.html`”.
- `README.md`: Copiar/Enviar = Pro.

**Pronto:** PR fictício/local mostra workflow verde; docs não se contradizem.

### G — Docs e polish residual (opcional)

- `postMessage` em `pago.html`: origin explícita (Pages + localhost).
- Footer landing: Kit LinkedIn → blob GitHub ou HTML, não `.md` cru no Pages.
- `:focus-visible` básico na landing.
- Nota: `/api/shorten` só no `mp-server` local.

---

## Ordem e dependências

```text
A (mock) ─┬─ B (XSS) ─┬─ C (licença + landing)
          │           └─ D (amount + signature)
          └─────────────── D
                              │
                         gate humano
                              ▼
                           E (auth + token/pedido)
                              ▼
                           F (CI + docs)
                              ▼
                           G (opcional)
```

A e B podem em paralelo. **Não iniciar E sem ok do Helder.**

---

## Validação manual (após cada fatia relevante)

| Fatia | O quê |
|-------|--------|
| A | Local `dev:mp`: mock_pay não fulfilla se MOCK_MODE false; mock-server ainda paga |
| B | Chrome: montar `#c=` malicioso; tela 3 sem script; Bruno/Lara ok |
| C | Pro demo local: WA final não consome; landing mobile DevTools |
| D | Sandbox MP: pagar R$ 2 → paid; (se possível) amount mismatch não libera |
| E | Após pagar: outro browser sem secret não lê o pedido; token demo morto no Pages |
| F | `npm test` + Actions |
| Deploy | Só se pedido: Worker **antes** do Pages se E mudar o contrato do `?pro=` |

Smoke Pages: https://helderabud.github.io/Jantar/ — fluxo Bruno/Lara **sem** `#c=` intacto.

---

## Riscos e gates humanos

| Risco | Mitigação |
|-------|-----------|
| Token por pedido quebra HITL atual | Gate E; playbook de reentrega |
| Assinatura MP mal documentada bloqueia webhook | Fail-open **só** em localhost; produção fail-closed + sync por polling ainda funciona |
| Secret no sessionStorage some se o user voltar noutro device | Esperado no F2; HITL / novo pagamento |
| `JL-PRO-DEMO` ainda no git | Intencional para localhost; produção ignora |

Gates (já em AGENTS): commit, push, Pages, trocar comportamento Pro em produção, incluir tracking.

---

## Mapa de arquivos

| Caminho | Fatias |
|---------|--------|
| `commerce/worker/src/index.js` | A, D, E |
| `commerce/worker/lib/*.test.mjs` | A, D, E, F |
| `commerce/worker/.dev.vars.example` | D (secret webhook, sem duplicar `MP_ACCESS_TOKEN`) |
| `index.html` | B, C, E |
| `pago.html` | G |
| `site/index.html`, `site/main.js`, `site/styles.css` | C, G |
| `AGENTS.md`, `README.md`, `docs/venda/*` | F, E |
| `.github/workflows/worker-test.yml` | F |
| Este plano | status → em implementação / feito por fatia |

---

## Critério de “hardening F2 pronto para cobrar”

- [ ] A + B + C + D merged e Worker em produção *(código local A–D feito; falta merge + `MP_WEBHOOK_SECRET` no Worker)*
- [ ] E aprovado **ou** decisão explícita de “só `PRO_TOKEN` secreto, aceitar vazamento do `?pro=`”
- [ ] F: CI verde *(workflow criado; verde só no próximo PR)*
- [ ] Smoke: pagar sandbox → editor Pro → 1 envio → segundo envio bloqueado
- [ ] `?pro=JL-PRO-DEMO` **não** funciona no domínio público

Até E estar em produção, **não** tratar o PIX de R$ 2 como anti-fraude — só como funil HITL.
