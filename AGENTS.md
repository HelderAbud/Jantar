# AGENTS.md — Convite Jantar (editável)

Base operacional alinhada ao **Helder Method v1.2** e ao **Superpowers Cursor Playbook**: contexto claro, triagem por risco, plano antes de tarefa relevante, fatias pequenas, validação objetiva e gate humano em mudanças sensíveis ou publicação.

**Referências metodológicas (fora do repo):**

- `../Agentes/helder-method-v1.2-resumo-compartilhavel.md`
- `../Skills/superpowers-cursor-playbook.md`

---

## Visão geral

- **Produto:** convite interativo estilo iPhone — mini app HTML (**marca comercial: Jantar Link**). Qualquer pessoa pode personalizar nomes/textos e **compartilhar um link** (dados no hash da URL, sem servidor).
- **Exemplo padrão:** sem `#c=` na URL, o fluxo continua Bruno → Lara (demo fictícia).
- **Stack:** HTML + CSS + JavaScript vanilla (arquivo único `index.html`).
- **Deploy:** GitHub Pages em [HelderAbud/Jantar](https://github.com/HelderAbud/Jantar).
- **URL pública:** https://helderabud.github.io/Jantar/
- **Instagram (Fase 1):** marca **Jantar Link** · conta **`@convitejantar`** (nome: ConviteJantar).
- **Tom:** divertido, moderno, leve — **sem** parecer pedido de namoro explícito.
- **Plano comercial:** `.cursor/plans/plan-2026-07-27-instagram-venda-white-label-3-fases.md` (F1–F3 + F4 IG-API opcional)
- **Pagamento F2:** ADR `docs/adr/0001-pagamento-mercado-pago-worker.md` · Worker `commerce/worker/`

---

## Modos (contrato)

| Modo | Como entra | Comportamento |
|------|------------|---------------|
| Convite (default) | `/` sem config | Config Bruno/Lara |
| Convite personalizado | `/#c=<payload>` | Lê config Base64URL e aplica nas telas |
| Editor | `/?modo=editor` (canónico), `/#editor` (alias) ou botão **Criar o seu convite** | Formulário → Ver / Copiar link curto / Enviar WA |
| Venda / white-label | `/?modo=venda` | Preview com nomes (Free) → CTA WhatsApp/PIX HITL |
| Pro (F1) | `/?pro=<token>` (+ opcional `#c=`) | Remove watermark; token em `BRAND.proTokens` (HITL) |

### Contrato Free vs Pro (envio)

- **Free:** montar + **só visualizar** (`Ver convite`). Sem copiar link, sem gerar link compartilhável, sem enviar WhatsApp/Instagram.
- **Pro** (`?pro=<token>` após pagamento): libera copiar/gerar link e enviar mensagem; remove marca “só visualizar”.
- Token de demo `JL-PRO-DEMO` só em localhost. No Pages, Pro vem do token **por pedido** depois do pagamento.
- Responder no WhatsApp no fim do fluxo (pessoa convidada) continua liberado e **não** consome a licença Pro de 1 envio.

### Campos editáveis (MVP)

- `fromName`, `toName`
- `notifLines` (2–4 linhas, tela 1)
- `resultNote` (tela 3)
- `missionPrompt` (tela 4)
- `foodOptions` (até 4 opções curtas, tela 5; “Outro” permanece fixo na UI)
- `finalPromises` (2–4, tela 6)
- `whatsappInvitePhone` — convidada (só no editor; Enviar link no WhatsApp)
- `whatsappPhone` — criador (vai no `#c=`; botão final `wa.me`)
- `whatsappMessageTemplate` com `{from}` `{to}` `{food}` `{date}`
- `pickupLine` — linha no resumo do calendário (ex.: “vou te buscar”)

Calendário: datas a partir de **hoje** (incluindo quartas).

Fora do MVP: temas, upload de foto, calendário avançado customizável, analytics, backend próprio.

### Encoding

JSON em **delta** (só o que difere do modelo com os nomes atuais) → Base64URL no hash `#c=...`.  
Só nomes + WhatsApp do criador → link curto. Limite prático ~2000 caracteres; o editor avisa se passar.  
Copiar/Enviar tentam encurtar via CleanURI (fallback is.gd / link completo).

---

## Fluxo do convite (telas)

| Tela | Conteúdo |
|------|----------|
| 1 | Bloqueio iPhone — notificação de `fromName`, deslize para desbloquear |
| 2 | IA analisando — checks + barra de progresso |
| 3 | Resultado — probabilidade + `resultNote` |
| 4 | Missão — `missionPrompt` ou botão que foge |
| 5 | Confetes + escolha (`foodOptions` + Outro) |
| 6 | Status final — promessas |
| 7 | Calendário + WhatsApp (opcional) |

Mudanças no fluxo, textos-base ou interações devem atualizar este contrato (ou um `plan-*` em `.cursor/plans/`) **antes** ou **junto** da implementação.

---

## Comandos

| Objetivo | Como |
|----------|------|
| Ver localmente | `python -m http.server 5177` na raiz → http://localhost:5177/ |
| Landing | http://localhost:5177/site/ · público: https://helderabud.github.io/Jantar/site/ |
| Editor local | http://localhost:5177/?modo=editor |
| Editor público | https://helderabud.github.io/Jantar/?modo=editor |
| Venda (white-label) | http://localhost:5177/?modo=venda · `/?modo=venda` no Pages |
| Pro (demo local) | `/?pro=JL-PRO-DEMO` só em localhost |
| Pagamento sandbox MP | `docs/venda/SANDBOX-MERCADO-PAGO.md` · `cd commerce/worker && npm run dev:mp` |
| Pagamento produção | `docs/venda/DEPLOY-CLOUDFLARE.md` · Worker Cloudflare + token MP de produção |
| Testes do Worker | `cd commerce/worker && npm test` |
| Publicar | Branch → PR → merge em `Main` → GitHub Pages |
| Status Pages | `gh api repos/HelderAbud/Jantar/pages --jq '{status, html_url}'` |

Há testes do Worker (`cd commerce/worker && npm test`; CI em `.github/workflows/worker-test.yml`). Não há testes automatizados do `index.html`. `/api/shorten` existe só no `mp-server` local; no Pages o front usa CleanURI / is.gd.

---

## Regras de produto e frontend

- Mobile-first: experiência pensada para celular (Safari iOS).
- Visual: glassmorphism, partículas, corações, animações suaves.
- Manter arquivo único enquanto o escopo couber — evitar split prematuro.
- Sons opcionais e discretos; respeitar autoplay do navegador (primeiro gesto do usuário).
- Não adicionar backend, analytics invasivo ou coleta de dados sem aprovação explícita.
- Não versionar configs de terceiros; dados personalizados ficam só no link gerado.

---

## Workflow (Helder + Superpowers)

### Triagem

| Trilha | Quando usar neste projeto |
|--------|---------------------------|
| **Simple** | Ajuste de texto, cor, animação ou emoji em uma tela |
| **Normal** | Nova tela, mudança de fluxo, editor/link, revisão do contrato |
| **Complex** | Backend, formulário com persistência, auth ou integração externa |
| **Hotfix** | Link quebrado, convite não abre no celular, bug visível em produção |

### Execução

- **Simple:** diff pequeno, validação manual no celular, explicar o que mudou.
- **Normal:** brainstorming curto → Plan Mode → plano em `.cursor/plans/plan-YYYY-MM-DD-assunto.md` → fatias → validação manual.
- **Complex / Hotfix:** subir trilha, spec/plano mínimo, patch focado, smoke no link publicado.

### Git

- Não commit/push direto em `Main`: branch `feat/` / `docs/` / `fix/` → PR → conferência → merge → `git pull` em `Main`.
- Autor: Helder Abud; não incluir `Co-authored-by: Cursor` / `cursoragent`.

### Gates humanos

Pedir aprovação explícita antes de:

- commit, push ou alterar visibilidade do repositório;
- mudar nomes default (Bruno/Lara), tom da mensagem ou fluxo das telas;
- tornar o repo privado/público ou trocar URL/domínio;
- incluir dados pessoais reais no código versionado (além do exemplo default);
- adicionar tracking, formulários com persistência ou APIs.

---

## Testes e validação

- Abrir no Chrome mobile ou Safari iOS (DevTools → modo responsivo como smoke).
- Testar: deslize, barra, botão que foge, confetes, comida, calendário, WhatsApp.
- Smoke editor: `/?modo=editor` → 2 WhatsApps → Ver convite (não volta ao form) → Copiar link curto → `#c=` com nomes novos → Enviar WA (convidada) → fim do fluxo WA (criador) → Voltar ao formulário.
- Calendário: passado bloqueado; hoje+ e quartas ok.
- Sem hash: fluxo Bruno/Lara intacto.
- Após push: confirmar https://helderabud.github.io/Jantar/ (status `built`).
- Antes de concluir: explicar o que foi verificado e riscos residuais.

---

## Segurança e privacidade

- **Não commitar** rascunhos pessoais (`Aléxia.md.txt`, notas privadas).
- **Não commitar** `.env`, `.env.instagram` nem senhas (ver `docs/instagram/COMO-TRABALHAR-SEM-SENHA.md`).
- **Não pedir à IA** para ler arquivo com senha do Instagram — isso expõe o segredo no histórico do chat.
- Trabalho Instagram Fase 1: humano opera a conta; IA só kit/código.
- Repositório é **público** — evitar detalhes íntimos além do convite-exemplo.
- Quem tem o link (incluindo `#c=`) acessa o conteúdo; trate como semi-público.
- Telefone WhatsApp no hash é visível a quem tiver o link.

---

## Caminhos importantes

| Caminho | Conteúdo |
|---------|----------|
| `index.html` | Convite + editor + encoding `#c=` |
| `site/` | Landing Convite Jantar (GitHub Pages `/site/`) |
| `AGENTS.md` | Este guia operacional |
| `README.md` | Como criar e compartilhar o link |
| `.cursor/rules/` | Regras persistentes do Cursor |
| `.cursor/plans/` | Planos aprovados |
| `../Agentes/helder-method-v1.2-resumo-compartilhavel.md` | Resumo do método |
| `../Skills/superpowers-cursor-playbook.md` | Playbook Superpowers |
