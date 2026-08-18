# Alexia × Instagram × Venda White-label — Plano 3 Fases

> **For agentic workers:** NÃO implementar sem aprovação explícita do Helder. Ao executar: uma fase por vez; HITL entre fases. Preferir fatias verticais verificáveis.

**Goal:** Divulgar o convite no Instagram (A+B), vender licença white-label com preview do nome antes do pagamento, e evoluir até licença/pagamento robustos sem retrabalho.

**Architecture:** Produto atual permanece HTML estático + `#c=` no GitHub Pages. Fase 1 diferencia Free vs Pro com watermark + unlock por token no link (HITL/PIX). Fase 2 adiciona gateway e entrega automática do unlock. Fase 3 introduz backend de licenças (conta, anti-vazamento, auditoria). Instagram é canal + botão share — sem API Meta nas fases 1–2.

**Tech Stack (evolutivo):**
- Fase 1: `index.html` + GitHub Pages + docs Instagram + PIX/WhatsApp HITL
- Fase 2: + Mercado Pago **ou** Stripe Checkout + webhook mínimo (edge/serverless)
- Fase 3: + backend (auth leve, tabela de licenças, emissão/revogação de token)

**Trilha Helder:** Complex (integração externa + monetização + possível backend).  
**Status:** roadmap **F1–F3** aprovado + **F4 IG-API opcional** acrescentada (2026-07-27). Marca **Jantar Link** · handle `@convitejantar` · demo **Bruno→Lara**. **F1.1** em curso; F4 **não** iniciar antes do gate F1.

---

## Global Constraints

- Manter mobile-first e tom leve do convite (não parecer pedido de namoro explícito).
- Editor básico **continua gratuito** (decisão A+C).
- Fluxo de venda desejado: **B+C** na Fase 1 (preview com nome → PIX → liberação HITL); Fase 2 automatiza o pagamento; Fase 3 endurece a licença.
- Instagram: só **A+B** (kit + share). Sem Login Meta, DM bot ou Shopping até decisão futura.
- Não commitar telefones reais, PIX pessoais em texto público se evitável (usar placeholder + config local / nota privada).
- Não expandir contrato das 7 telas sem atualizar `AGENTS.md`.
- Preferir domínio/path de venda separado do convite-exemplo Helder→Alexia (ex.: `/?modo=venda` ou `/venda` se o host permitir).
- Ambiente de desenvolvimento/staging: validar funil de venda em URL local/`gh-pages` preview **antes** de bio do Instagram apontar para produção.
- Commit/push/PR/deploy: só com pedido explícito.

---

## Decisões já fechadas (brainstorming)

| Tema | Decisão |
|------|----------|
| Instagram | A+B — rebrand conta antiga + kit + botão share/copiar link Stories |
| Marca IG / comercial | **Jantar Link** (conta **ConviteJantar**, handle `@convitejantar`) |
| Demo default no app | **Bruno → Lara** (substitui Helder → Alexia) |
| Produto | Licença / white-label |
| Valor pago (A+C) | Remover marca Helder–Alexia + pacote white-label + extras (temas/templates, sem watermark, suporte) |
| Free | Editor básico permanece |
| Funil | B+C → preview com nome antes; PIX HITL na F1 |
| Abordagem base | Estático + HITL → gateway → backend de licenças (3 fases) |

---

## Contrato mínimo Free vs Pro

| Capacidade | Free | Pro |
|------------|------|-----|
| Ver / preview do convite | Sim | Sim |
| Copiar / gerar link `#c=` | Não | Sim |
| Enviar link no WhatsApp | Não | Sim |
| Copiar para Instagram | Não | Sim |
| Responder no WA no fim (convidada) | Sim | Sim |
| Sem watermark | Não | Sim |

**Unlock F1 (contrato técnico mínimo):** campo no payload `#c=` ou query `?pro=<token>` que, se válido contra uma lista/assinatura simples versionada no cliente **ou** entregue só em links gerados por você, remove watermark e habilita extras. Aceitar fragilidade (link compartilhável) até F3.

---

## Mapa de arquivos (previsto)

| Arquivo / área | Responsabilidade |
|----------------|------------------|
| `index.html` | Convite, editor, share IG, watermark Free, unlock Pro, modo venda/preview |
| `AGENTS.md` / `README.md` | Contrato Free/Pro, modos, limites |
| `docs/instagram/` | Kit bio, legendas, checklist rebrand, link-in-bio |
| `docs/venda/` | Funil PIX HITL, script de entrega do link Pro, preços (placeholder) |
| `.cursor/plans/` | Este plano + planos filhos por fase se necessário |
| *F2* serverless / edge | Checkout + webhook → gera/envia link Pro |
| *F3* backend + DB | Usuários, licenças, revogação, auditoria |

*(F2/F3 podem viver em repo separado ou pasta `commerce/` — decidir no gate de início de cada fase.)*

---

## Fase 1 — Instagram + vitrine + HITL (fecha requisitos A+B e B+C)

**Objetivo:** Operar venda white-label com preview do nome e Instagram, sem gateway e sem backend.

### Fatias

#### F1.1 — Rebrand Instagram + kit (quase só docs/processo)
- [ ] Definir nome/handle, bio, foto, highlights (produto / como funciona / depoimentos)
- [ ] Link da bio → ambiente de **venda** (staging primeiro; produção após smoke)
- [ ] Criar `docs/instagram/` com: checklist rebrand, 3–5 legendas Reels/Stories, CTA para preview com nome
- [ ] Critério de pronto: conta atualizada + bio com link de staging/venda + kit revisado

#### F1.2 — Share no produto (A+B código)
- [x] Botão “Compartilhar / Copiar link para Instagram” (copia URL do convite `#c=` + texto curto de legenda)
- [x] Opcional: deep link `instagram://` onde funcionar; fallback = copiar
- [x] Critério de pronto: no mobile, copiar link + abrir Stories manualmente com o link colado

#### F1.3 — Free vs Pro (watermark + unlock)
- [x] Watermark/marca discreta no Free (telas finais ou rodapé)
- [x] Modo Pro: sem watermark + defaults white-label (nome do comprador)
- [x] Mecanismo de unlock por token no link (documentar como você gera o link pós-PIX)
- [x] Critério de pronto: Free mostra marca; mesmo fluxo com token Pro remove marca

#### F1.4 — Ambiente de venda com nome (preview B)
- [x] Modo `venda` (path ou `?modo=venda`): campo nome (e opcional “de”/“para”) → gera preview `#c=` **sem** unlock Pro
- [x] CTA “Quero este white-label” → instruções PIX + WhatsApp (HITL)
- [x] Staging/dev: mesma UX em localhost / preview Pages
- [x] Critério de pronto: digitar nome → ver preview personalizado → ver como pagar → sem liberar Pro sozinho

#### F1.5 — Playbook HITL de entrega (C)
- [x] `docs/venda/ENTREGA-HITL.md`: confirmar PIX → gerar link Pro com nome → enviar no WhatsApp → checklist suporte
- [x] Registrar preço e o que está incluso (A+C) em doc de venda (sem hardcodar dados sensíveis no repo se possível)
- [ ] Critério de pronto: você consegue fechar 1 venda simulada ponta a ponta em &lt;15 min *(validação humana)*

### Fora da Fase 1
- Gateway, webhook, login, API Meta, anti-pirataria forte

### Validação F1
- Mobile Safari/Chrome: editor free, preview venda, unlock Pro, share copy
- Smoke Pages staging antes de bio oficial
- Checklist Instagram + 1 ensaio HITL

### Gate humano (fim F1)
Aprovar: textos de marca/watermark, preço, dados PIX/WhatsApp de atendimento, ir bio → produção.

---

## Fase 2 — Gateway + entrega automática (remove atrito do PIX manual)

**Objetivo:** Manter preview B; trocar C manual por pagamento online + envio automático do link Pro. Reduz erro operacional; unlock ainda baseado em token (ainda compartilhável).

### Fatias

#### F2.1 — Escolha e ADR de pagamento
- [x] ADR: Mercado Pago + Cloudflare Worker — `docs/adr/0001-pagamento-mercado-pago-worker.md`
- [x] Spec de viabilidade: `docs/venda/SPEC-PAGAMENTO-F2-VIABILIDADE.md`
- [x] Runtime: `commerce/worker/` (mock + hooks MP)
- [ ] Conta sandbox MP + secrets reais (HITL Helder)
- [ ] Critério de pronto: ADR aprovado + conta sandbox criada

#### F2.2 — Checkout a partir do modo venda
- [x] Botão **Pagar Pro** em `?modo=venda` → `POST /api/checkout`
- [x] Metadata: nomes + `configPayload` `#c=`
- [ ] Critério de pronto: pagamento sandbox MP real (hoje: mock local)

#### F2.3 — Webhook → link Pro
- [x] Webhook + fulfill `?pro=` (mock + caminho MP)
- [x] Idempotência por event key
- [ ] E-mail transacional (opcional)
- [ ] Critério de pronto: 1 pagamento sandbox MP → link Pro

#### F2.4 — HITL residual
- [ ] Fallback: se webhook falhar, playbook F1 ainda funciona
- [ ] Painel mínimo **ou** inbox: lista de pagamentos recentes (pode ser dashboard do gateway no MVP F2)
- [ ] Critério de pronto: falha simulada de entrega ainda recuperável manualmente

### Fora da Fase 2
- Contas de usuário, revogação sofisticada, Instagram Shopping

### Validação F2
- Sandbox ponta a ponta + teste de webhook duplicado
- LGPD: mínimo de PII; não logar payload íntimo completo

### Gate humano (fim F2)
Aprovar: provedor, go-live com chaves de produção, textos legais básicos (pagamento, reembolso).

---

## Fase 3 — Backend de licenças (evita “nenhum problema” de vazamento/repasse)

**Objetivo:** Licença amarrada a comprador; token rotativo ou sessão; possibilidade de revogar; base para suporte e auditoria.

### Fatias

#### F3.1 — Spec/ADR de licença
- [ ] Modelo: 1 compra → 1 licença (status active/revoked); unlock deixa de ser só segredo no link
- [ ] Opções: login mágico (e-mail) **ou** código de ativação de uso único amarrado a device fingerprint leve (avaliar UX)
- [ ] Critério de pronto: ADR aprovado antes de schema

#### F3.2 — Schema + API mínima
- [ ] Tabelas: `customers`, `licenses`, `activations` (nomes finais no ADR)
- [ ] Endpoints: criar licença (interno/webhook), validar, revogar
- [ ] Critério de pronto: testes de API cobrindo active/revoked

#### F3.3 — Integração no front
- [ ] Pro features exigem validação online (com cache curto offline-friendly se desejado)
- [ ] Fluxo: pagar (F2) → conta/ativação → editor Pro
- [ ] Critério de pronto: link antigo F1 sem licença **não** libera Pro; licença ativa libera

#### F3.4 — Operação
- [ ] Revogar licença vazada; reemitir para o comprador
- [ ] Export mínimo para suporte
- [ ] Critério de pronto: ensaio de “link vazou” → revoke → comprador recupera

### Fora da Fase 3 (ainda)
- Marketplace de templates de terceiros, afiliados, API Meta completa

### Validação F3
- Testes automatizados de licença + smoke mobile do fluxo Pro
- Revisão LGPD (base legal, retenção, exclusão)

### Gate humano (fim F3)
Aprovar: go-live backend, política de reembolso/revogação, backup/secrets.

---

## Fase 4 (opcional) — IG-API / publicação assistida

**Objetivo:** acelerar posts no Instagram **sem** login com senha no Cursor. Conteúdo continua gerado aqui; publicação via **Meta Graph API** e/ou ferramenta (Buffer, Make, Meta Business Suite).

**Pré-requisitos (gate):**
- [ ] F1 concluída (kit + share + funil venda smoke)
- [ ] Conta `@convitejantar` em modo **Professional** + ativo ligado a Página/Business Meta
- [ ] Decisão registrada: API direta **ou** ferramenta no meio (recomendado no início: Buffer/Make + drafts)
- [ ] Aprovação explícita HITL antes de criar app Meta / tokens

### Fatias

#### F4.1 — ADR Instagram oficial
- [ ] Escopo permitido: feed photo/carousel e/ou Reels via API; **fora:** bot de DM frio, scrape, login com senha, automação de Stories se a API não cobrir de forma estável
- [ ] Escolher: (A) só gerador de conteúdo + calendário manual, (B) Buffer/Make, (C) app Meta próprio
- [ ] Critério de pronto: ADR aprovado

#### F4.2 — Sandbox / permissões
- [ ] App Meta (ou conta Buffer) em modo teste
- [ ] Token de longa duração guardado só em secret local/CI — **nunca** em `.env.instagram.example` nem no chat
- [ ] Critério de pronto: 1 post de teste em conta/página de teste

#### F4.3 — Pipeline “Cursor → rascunho → publicar”
- [ ] Pasta ou doc de fila: legenda + mídia sugerida (já alinhado ao kit `docs/instagram/`)
- [ ] Publicação: botão humano “aprovar” **ou** schedule na ferramenta
- [ ] Critério de pronto: 1 Reel/post real da marca Jantar Link publicado por esse fluxo (não por senha no agente)

#### F4.4 — Operação
- [ ] Playbook: o que fazer se token expirar / API negar Reels
- [ ] Limite de volume (evitar spam; alinhado a uso humano)
- [ ] Critério de pronto: 1 semana de operação sem ban/restrição

### Fora da Fase 4
- Agente controlando o app Instagram com senha / Computer Use logado na conta pessoal
- Compra de “bots Claude Instagram” de anúncio sem Meta oficial

### Validação F4
- Post de teste ok; secrets não versionados; revisão ToS Meta

### Gate humano (fim F4)
Aprovar go-live de tokens de produção e volume semanal de posts.

---

## Ordem e dependências

```text
F1.1 Instagram kit ──┐
F1.2 Share           ├──► F1.4 Venda+preview ──► F1.5 HITL ──► GATE F1
F1.3 Free/Pro unlock ┘                              │
                                                    ├──────────────► F4 IG-API (opcional, em paralelo a F2/F3 se F1 ok)
                                                    ▼
                                         F2 ADR + checkout + webhook ──► GATE F2
                                                    │
                                                    ▼
                                         F3 ADR + DB + validação Pro ──► GATE F3
```

Instagram (F1.1) pode avançar em paralelo com F1.2–F1.3.  
**F4** não bloqueia F2/F3; só exige gate pós-F1 + conta Professional + ADR.

---

## Riscos e mitigações

| Risco | Fase | Mitigação |
|-------|------|-----------|
| Link Pro vazado / revendido | F1–F2 | Aceito até F3; watermark free reduz incentivo; F3 revoga |
| Bio Instagram aponta para free sem conversão | F1 | Bio → modo venda, não só editor |
| PIX errado / atraso HITL | F1 | Playbook + prazo de entrega no anúncio |
| Webhook falha | F2 | Fallback HITL F1 |
| Escopo F3 cedo demais | — | Só iniciar F3 após N vendas reais (sugerido: gate por demanda, ex. ≥5–10 vendas) |
| LGPD / dados no `#c=` | todas | Avisar semi-público; mínimo de PII no gateway |
| Conta Instagram antiga (histórico) | F1 | Checklist limpeza highlights/posts ou “nova fase” explícita no feed |
| Ban por bot/senha no agente | F4 | Só Meta API / Buffer; proibir login com senha no Cursor |
| Token Meta vazado | F4 | Secret local/CI; nunca `.example` nem chat |

---

## Critérios de sucesso por fase

- **F1:** 1 venda simulada + 1 post/kit IG prontos; Free≠Pro visível; preview com nome funciona.
- **F2:** 1 pagamento sandbox → Pro sem intervenção; fallback HITL testado.
- **F3:** licença revogável; Pro depende de validação; ensaio de vazamento resolvido.
- **F4 (opcional):** 1 publicação via fluxo oficial/ferramenta; zero uso de senha no agente.

---

## O que NÃO fazer até aprovação

- Implementar código, criar webhook, abrir conta de pagamento, alterar bio do Instagram em produção.
- Commit/PR deste plano só se você pedir.

---

## Aprovação

- [x] Aprovo o plano das 3 fases como roadmap — **Helder, 2026-07-27**
- [x] Acrescentar **Fase 4 IG-API** (opcional, pós-F1) — **Helder, 2026-07-27**
- [ ] Quero ajustes em: _______________
- [x] Após aprovar, autorizo **somente Fase 1** — início por nomes demo + **F1.1** (2026-07-27)

**Próximo passo agora:** concluir F1 (kit no app + F1.2–F1.5 no código). **F4** só depois do gate F1 + ADR Meta — não implementar ainda.
