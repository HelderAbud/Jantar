# Handoff — Jantar Link (Aléxia) — 2026-07-28

**Para:** continuar amanhã (Helder / agente)  
**Branch local:** `Main` (muitas mudanças **ainda sem commit**)  
**NÃO versionar:** `.env.instagram`, `.dev.vars`, senhas, token MP

---

## Onde paramos

Produto **Jantar Link** (`@basicmodaeacessorios`): convite free = só ver; Pro = copiar/enviar após pagamento.

| Fase | Estado |
|------|--------|
| F1 código (Bruno/Lara, share IG, venda, Free/Pro permissões, R$ 2 teste) | Feito no disco |
| F1.1 Instagram (zerar conta, bio, nome) | **HITL você** — kit pronto |
| F2 mock checkout | Feito (`npm run dev:mock`) |
| F2 Mercado Pago sandbox | **Código pronto**; falta colar `MP_ACCESS_TOKEN` TEST em `.dev.vars` e `npm run dev:mp` |
| F3 licenças / F4 IG-API | Só no roadmap |

---

## Artefatos (ler nesta ordem)

1. `.cursor/plans/plan-2026-07-27-instagram-venda-white-label-3-fases.md` — roadmap F1–F4  
2. `docs/venda/SPEC-PAGAMENTO-F2-VIABILIDADE.md` — pagamento enxuto  
3. `docs/adr/0001-pagamento-mercado-pago-worker.md` — decisão MP + Worker  
4. `docs/venda/SANDBOX-MERCADO-PAGO.md` — **próximo passo técnico**  
5. `docs/instagram/F1.1-KIT-JANTAR-LINK.md` — Instagram  
6. `docs/venda/ENTREGA-HITL.md` — fallback PIX manual  
7. `AGENTS.md` — contrato Free/Pro atualizado  

---

## Como subir amanhã (2 terminais)

```text
# A — site
cd Desktop/Aléxia
python -m http.server 5177

# B — pagamento (depois do token MP no .dev.vars)
cd Desktop/Aléxia/commerce/worker
# editar .dev.vars: MP_ACCESS_TOKEN=TEST-...  MOCK_MODE=false
npm run dev:mp
```

- Site: http://127.0.0.1:5177/?modo=venda  
- Pro demo: http://127.0.0.1:5177/?pro=JL-PRO-DEMO  
- Preço teste: R$ 2,00 (`CHECKOUT_AMOUNT_CENTAVOS=200`)

---

## Próximas ações (escolha)

1. Colar token MP TEST em `commerce/worker/.dev.vars` (nunca no chat) → testar PIX/cartão sandbox  
2. Commit/PR das mudanças (ainda não commitadas)  
3. F1.1 no Instagram  
4. Deploy Pages + bio com `?modo=venda`  

---

## Suggested skills (amanhã)

- `slice-verification` — smoke após sandbox MP  
- `git-workflow-and-versioning` / `finishing-a-development-branch` — se for PR  
- `diagnose` — se checkout MP falhar  

---

## Segurança

- Não abrir `.env.instagram` / `.dev.vars` no chat  
- Se senha IG vazou antes: já orientado trocar  
- Arquivo estranho: `.env.instagram.instagram` — preferir só `.env.instagram`  
