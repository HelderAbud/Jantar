# AGENTS.md — Convite Jantar (editável)

Base operacional alinhada ao **Helder Method v1.2** e ao **Superpowers Cursor Playbook**: contexto claro, triagem por risco, plano antes de tarefa relevante, fatias pequenas, validação objetiva e gate humano em mudanças sensíveis ou publicação.

**Referências metodológicas (fora do repo):**

- `../Agentes/helder-method-v1.2-resumo-compartilhavel.md`
- `../Skills/superpowers-cursor-playbook.md`

---

## Visão geral

- **Produto:** convite interativo estilo iPhone — mini app HTML. Qualquer pessoa pode personalizar nomes/textos e **compartilhar um link** (dados no hash da URL, sem servidor).
- **Exemplo padrão:** sem `#c=` na URL, o fluxo continua Helder → Alexia (comportamento histórico).
- **Stack:** HTML + CSS + JavaScript vanilla (arquivo único `index.html`).
- **Deploy:** GitHub Pages em [HelderAbud/Jantar](https://github.com/HelderAbud/Jantar).
- **URL pública:** https://helderabud.github.io/Jantar/
- **Tom:** divertido, moderno, leve — **sem** parecer pedido de namoro explícito.
- **Plano desta iniciativa:** `.cursor/plans/plan-2026-07-23-convite-editavel.md`

---

## Modos (contrato)

| Modo | Como entra | Comportamento |
|------|------------|---------------|
| Convite (default) | `/` sem config | Config Helder/Alexia |
| Convite personalizado | `/#c=<payload>` | Lê config Base64URL e aplica nas telas |
| Editor | `/#editor` ou botão “Criar o meu” | Formulário → copiar link com `#c=` |

### Campos editáveis (MVP)

- `fromName`, `toName`
- `notifLines` (2–4 linhas, tela 1)
- `resultNote` (tela 3)
- `missionPrompt` (tela 4)
- `foodOptions` (até 4 opções curtas, tela 5; “Outro” permanece fixo na UI)
- `finalPromises` (2–4, tela 6)
- `whatsappPhone` (só dígitos, opcional)
- `whatsappMessageTemplate` com `{from}` `{to}` `{food}` `{date}`
- `pickupLine` — linha no resumo do calendário (ex.: “vou te buscar”)

Fora do MVP: temas, upload de foto, calendário avançado customizável, analytics, backend.

### Encoding

JSON mínimo → Base64URL no hash `#c=...`. Limite prático ~2000 caracteres; o editor avisa se o link ficar longo demais para WhatsApp.

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
| Ver localmente | Abrir `index.html` no navegador ou `python -m http.server 8080` na raiz |
| Editor local | Abrir com `#editor` |
| Publicar | Branch → PR → merge em `Main` → GitHub Pages |
| Status Pages | `gh api repos/HelderAbud/Jantar/pages --jq '{status, html_url}'` |

Não há build, npm ou testes automatizados neste repositório.

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
- mudar nomes default (Helder/Alexia), tom da mensagem ou fluxo das telas;
- tornar o repo privado/público ou trocar URL/domínio;
- incluir dados pessoais reais no código versionado (além do exemplo default);
- adicionar tracking, formulários com persistência ou APIs.

---

## Testes e validação

- Abrir no Chrome mobile ou Safari iOS (DevTools → modo responsivo como smoke).
- Testar: deslize, barra, botão que foge, confetes, comida, calendário, WhatsApp.
- Testar `#editor` → copiar link → abrir `#c=` com nomes diferentes.
- Sem hash: fluxo Helder/Alexia intacto.
- Após push: confirmar https://helderabud.github.io/Jantar/ (status `built`).
- Antes de concluir: explicar o que foi verificado e riscos residuais.

---

## Segurança e privacidade

- **Não commitar** rascunhos pessoais (`Aléxia.md.txt`, notas privadas).
- Repositório é **público** — evitar detalhes íntimos além do convite-exemplo.
- Quem tem o link (incluindo `#c=`) acessa o conteúdo; trate como semi-público.
- Telefone WhatsApp no hash é visível a quem tiver o link.

---

## Caminhos importantes

| Caminho | Conteúdo |
|---------|----------|
| `index.html` | Convite + editor + encoding `#c=` |
| `AGENTS.md` | Este guia operacional |
| `README.md` | Como criar e compartilhar o link |
| `.cursor/rules/` | Regras persistentes do Cursor |
| `.cursor/plans/` | Planos aprovados |
| `../Agentes/helder-method-v1.2-resumo-compartilhavel.md` | Resumo do método |
| `../Skills/superpowers-cursor-playbook.md` | Playbook Superpowers |
