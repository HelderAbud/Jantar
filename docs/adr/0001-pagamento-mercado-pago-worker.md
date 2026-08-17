# ADR 0001 — Pagamento F2: Mercado Pago + Cloudflare Worker

**Status:** Aceito (Helder, 2026-07-27)  
**Contexto:** Jantar Link — 1 SKU digital (Pro white-label); Pages estático não recebe webhook.

## Decisão

1. **Gateway:** Mercado Pago (Checkout Pro) — PIX + cartão no checkout hospedado.  
2. **Runtime:** Cloudflare Worker em `commerce/worker/` (API + webhook).  
3. **Front:** GitHub Pages / localhost continua em `index.html`; chama `POST /api/checkout`.  
4. **Segredos:** só em Cloudflare secrets / `.dev.vars` local — nunca no Pages nem em `.env.example` com valores reais.  
5. **Fulfillment F2:** após `paid`, gerar URL com `?pro=<PRO_TOKEN>` + `#c=` e devolver na success page (e-mail opcional depois).  
6. **Fallback:** playbook HITL F1 (`docs/venda/ENTREGA-HITL.md`).

## Consequências

- Precisa conta MP (teste) + `wrangler` para dev/deploy.  
- CORS liberado só para origens do produto (Pages + localhost:5177).  
- Token Pro ainda compartilhável até F3.  
- Stripe / multi-gateway: fora do F2.

## Alternativas rejeitadas

| Opção | Motivo |
|-------|--------|
| Só Pages + client-side MP | Secrets e webhook impossíveis com segurança |
| Stripe primeiro | PIX BR mais simples no MP |
| Backend Java/Spring | Overkill vs 1 Worker |

## Referências

- `docs/venda/SPEC-PAGAMENTO-F2-VIABILIDADE.md`
- Plano: `.cursor/plans/plan-2026-07-27-instagram-venda-white-label-3-fases.md` (Fase 2)
