# Spec / Viabilidade — Pagamentos Jantar Link (F2)

**Status:** **aprovado** Helder 2026-07-27 — implementação F2 iniciada (ADR + Worker + botão Pagar)  
**Data:** 2026-07-27  
**Produto:** licença white-label digital (não e-commerce físico)

---

## Problem

O prompt de “Arquiteto de Pagamentos E-commerce Sênior” descreve uma **plataforma completa** (carrinho, estoque, frete, cupons, impostos, multi-gateway, assinatura, chargeback maduro). O Jantar Link hoje é: **1 produto digital (Pro)** + preview com nome + entrega de link `?pro=` (F1 HITL).

Precisamos de pagamento **robusto o bastante para F2**, sem construir um LojApp/fintech.

## Veredito de viabilidade

| Bloco do prompt | Viável no Jantar Link? | Quando |
|-----------------|------------------------|--------|
| Carrinho / estoque / frete / impostos | **Não** | N/A (digital, 1 SKU) |
| Cupons | Depois (opcional) | F2.5+ |
| PIX | **Sim — obrigatório BR** | F2 |
| Cartão crédito (via gateway) | **Sim — desejável** | F2 |
| Débito / boleto / carteiras | Opcional | F2.5 se o gateway já der “de graça” no Checkout |
| Assinatura recorrente | **Não agora** | Só se mudar o modelo de negócio |
| Parcelado | Só se o Checkout do gateway oferecer | F2 se MP/Stripe Checkout |
| Pagamento misto | **Não** | N/A |
| Multi-gateway plugável (MP+Stripe+PagSeguro+…) | **Overkill F2** | Interface interna + **1** adapter; 2º gateway só se doer |
| Máquina de estados completa (12+ estados) | **Simplificar** | 6–8 estados no F2 |
| Webhooks + idempotência + assinatura | **Sim — obrigatório** | F2 |
| JWT / OAuth2 / RBAC completo | **Mínimo** | F2: sem conta de cliente; F3: auth leve |
| PCI / cartão no nosso servidor | **Proibido** | Só Checkout/token do gateway |
| Flyway + ER e-commerce completo | **Não** | F2: 2–4 tabelas; F3: licenças |
| Filas / escala horizontal | **Não** | Volume baixo; webhook síncrono + retry do provedor |
| Microsserviços | **Não** | 1 Worker/API pequena |

**Conclusão:** ~20% do prompt é F2; ~30% é F3/roadmap; ~50% é e-commerce físico — **fora de escopo**.

---

## Scope (F2 — o que construir)

### In scope
- 1 produto: **Jantar Link Pro** (preço fixo configurável)
- Checkout hospedado (Mercado Pago Checkout Pro **ou** Stripe Checkout) — PIX + cartão se o provedor permitir
- Criar “pedido” mínimo ao clicar Pagar (com nomes do preview + contato)
- Webhook: validar → idempotente → marcar pago → gerar URL Pro → notificar (e-mail e/ou WhatsApp)
- Fallback HITL (F1.5) se webhook falhar
- Secrets só em env do Worker (nunca no GitHub Pages / `.example`)

### Out of scope
- Carrinho, estoque, frete, NFe, cupom, assinatura, multi-gateway em produção
- Armazenar cartão, JWT de loja, painel admin completo
- Licença anti-vazamento forte (isso é **F3**)

## Acceptance criteria

1. ADR F2.1 aprovado (provedor + onde roda o webhook)
2. Sandbox: preview venda → Pagar → pago → link Pro chega sem ação manual
3. Webhook duplicado não gera 2 entregas
4. Sem pagamento: Pro não libera
5. Playbook F1 ainda funciona como fallback
6. Nenhum secret no repo estático

## Decisions (recomendadas)

| Decisão | Escolha | Por quê |
|---------|---------|---------|
| Arquitetura | **Monólito mínimo** = 1 Cloudflare Worker (ou Vercel serverless) + Pages estático | Pages não recebe webhook; volume baixo |
| Clean/SOLID | Camadas leves: `checkout` / `webhook` / `fulfillment` / `providers/mercadopago` | Sem DDD/microsserviços |
| Gateway F2 | **Mercado Pago** (1º) | PIX nativo BR, Checkout Pro, familiaridade |
| Alternativa | Stripe se priorizar cartão internacional | PIX via Stripe no BR é mais limitado/complexo |
| Multi-gateway | Interface `PaymentProvider` + **só MP** no F2 | Troca depois sem reescrever fulfillment |
| Entrega | E-mail (Resend/etc.) **ou** mensagem com link na success URL + e-mail | WhatsApp API = custo/extra; HITL WhatsApp no fallback |
| Estados F2 | `created` → `pending` → `paid` \| `failed` \| `expired` → `refunded` (manual) | Chargeback: tratar no F2.5 com alerta |

## Architecture (camadas enxutas)

```text
[Browser Pages]  index.html (?modo=venda)
        │  POST /api/checkout { from, to, contact }
        ▼
[Worker API]  createOrder + redirect Checkout MP
        │
        ▼
[Mercado Pago]  PIX / cartão
        │  webhook payment.updated
        ▼
[Worker webhook]  verify → idempotency → fulfill
        │
        ├─► gera ?pro=TOKEN#c=...
        └─► e-mail / success page com link
```

### Fluxo de compra real (Jantar Link) — não o e-commerce de 15 passos

1. Cliente informa nomes no `?modo=venda`  
2. Preview Free  
3. Clica **Pagar** → cria Order `pending`  
4. Gateway processa pagamento  
5. Webhook → Order `paid`  
6. Fulfillment gera link Pro  
7. Notifica + success URL  
8. (Opcional F3) registra licença  

Descartados do prompt: estoque, frete, cupom, imposto, reserva de estoque, emissão fiscal.

## Estados (máquina mínima)

```text
created → pending → paid
                 ↘ failed
                 ↘ expired
paid → refunded (manual / painel MP)
```

Transições inválidas: `paid → pending`, `failed → paid` sem novo payment id.

## Webhooks (obrigatório)

- Validar assinatura/secret do MP  
- Idempotência por `payment_id` / `event_id` (tabela `webhook_events` ou KV)  
- Responder 200 rápido; fulfillment atômico “só uma vez”  
- Log estruturado sem dump do `#c=` íntimo  
- Retry: confiar no MP + job manual HITL  

## Segurança (proporcional)

| Controle | F2 |
|----------|----|
| HTTPS | Sim (Pages + Worker) |
| Secrets | Env do Worker |
| Cartão no nosso DB | Nunca |
| Rate limit | No endpoint `/api/checkout` |
| XSS | Já no front estático; não refletir HTML cru do cliente no e-mail |
| CSRF | Checkout inicia com POST same-origin / signed state |
| JWT loja | Não no F2 |
| PCI SAQ | Checkout hospedado = carga mínima |

## Banco (mínimo F2)

Sem Flyway Java — **D1 / Postgres neon / Supabase** (escolher no ADR):

- `orders` (id, from_name, to_name, contact, status, amount, currency, provider, provider_ref, pro_url, created_at, paid_at)  
- `webhook_events` (id, provider, event_key UNIQUE, payload_hash, processed_at)  

F3 acrescenta `licenses`, `customers`.

## APIs (F2)

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/checkout` | Cria order + URL Checkout |
| GET | `/api/orders/:id` | Status (success page) |
| POST | `/api/webhooks/mercadopago` | Webhook |
| POST | `/api/admin/resend` | Opcional HITL (protegido por secret) |

OpenAPI curto no Worker — sem Spring.

## Frontend (F2)

Estender `?modo=venda`:

- Botão **Pagar** (além do WhatsApp HITL)  
- Redirect Checkout  
- Página/estado **sucesso** / **falha** / **aguardando PIX**  
- Sem carrinho

## Observabilidade / testes / escala

- Logs JSON no Worker + alertas se fulfill falhar  
- Testes: unit idempotência; integração webhook sandbox; 1 E2E manual sandbox  
- Sem filas/K8s no F2  

## Plano por etapas (implementação — só após aprovação)

1. **F2.1** ADR + conta MP sandbox + Worker vazio  
2. **F2.2** `POST /checkout` + botão Pagar  
3. **F2.3** Webhook + fulfill Pro + e-mail/success  
4. **F2.4** Fallback HITL + checklist deploy  

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Prompt e-commerce estoura escopo | Este spec; gate humano |
| Token Pro ainda compartilhável | Aceito até F3 |
| Webhook atrasado | Success page consulta order; HITL |
| Secret no Pages | Proibido; só Worker |
| Assinatura cedo demais | Fora |

## Verification

- Checklist sandbox MP ponta a ponta  
- Webhook duplicado  
- Order sem pago sem Pro  
- Diff sem `.env` / tokens  

---

## O que NÃO entregar agora (do prompt original)

Diagramas ER de 12 entidades, multi-gateway, recorrência, chargeback completo, testes de carga, microsserviços — **adiados** ou **descartados** até o produto exigir.

## Aprovação

- [x] Aprovo este recorte F2 (Mercado Pago + Worker + 1 SKU) — **Helder, 2026-07-27**
- [ ] Prefiro Stripe em vez de MP  
- [ ] Quero o monstro e-commerce (fora do Jantar Link — projeto separado)

**Próximo:** sandbox MP real (`MOCK_MODE=false`) + deploy Worker + `MP_NOTIFICATION_URL`.
