# AGENTS.md — Convite Jantar (Aléxia)

Base operacional alinhada ao **Helder Method v1.2** e ao **Superpowers Cursor Playbook**: contexto claro, triagem por risco, plano antes de tarefa relevante, fatias pequenas, validação objetiva e gate humano em mudanças sensíveis ou publicação.

**Referências metodológicas (fora do repo):**

- `../Agentes/helder-method-v1.2-resumo-compartilhavel.md`
- `../Skills/superpowers-cursor-playbook.md`

---

## Visão geral

- **Produto:** convite interativo estilo iPhone — mini app HTML para convidar Alexia a um jantar.
- **Stack:** HTML + CSS + JavaScript vanilla (arquivo único `index.html`).
- **Deploy:** GitHub Pages em [HelderAbud/Jantar](https://github.com/HelderAbud/Jantar).
- **URL pública:** https://helderabud.github.io/Jantar/
- **Tom:** divertido, moderno, leve — **sem** parecer pedido de namoro explícito.

---

## Fluxo do convite (contrato mínimo)

| Tela | Conteúdo |
|------|----------|
| 1 | Bloqueio iPhone — notificação do Helder, deslize para desbloquear |
| 2 | IA analisando — checks + barra de progresso |
| 3 | Resultado — probabilidade de jantar agradável + observação |
| 4 | Missão — aceitar ou botão que foge |
| 5 | Confetes + escolha (pizza, churrasco, hambúrguer, chef decide) |
| 6 | Status final — jantar desbloqueado + promessas |

Mudanças no fluxo, textos ou interações devem atualizar este contrato (ou um `plan-*` em `.cursor/plans/`) **antes** ou **junto** da implementação.

---

## Comandos

| Objetivo | Como |
|----------|------|
| Ver localmente | Abrir `index.html` no navegador ou `python -m http.server 8080` na raiz |
| Publicar | Push na branch `deleter-repositorio` → GitHub Pages rebuild automático |
| Status Pages | `gh api repos/HelderAbud/Jantar/pages --jq '{status, html_url}'` |

Não há build, npm ou testes automatizados neste repositório.

---

## Regras de produto e frontend

- Mobile-first: experiência pensada para celular (Safari iOS).
- Visual: glassmorphism, partículas, corações, animações suaves.
- Manter arquivo único enquanto o escopo couber — evitar split prematuro.
- Sons opcionais e discretos; respeitar autoplay do navegador (primeiro gesto do usuário).
- Não adicionar backend, analytics invasivo ou coleta de dados sem aprovação explícita.

---

## Workflow (Helder + Superpowers)

### Triagem

| Trilha | Quando usar neste projeto |
|--------|---------------------------|
| **Simple** | Ajuste de texto, cor, animação ou emoji em uma tela |
| **Normal** | Nova tela, mudança de fluxo, novo efeito ou revisão do contrato |
| **Complex** | Backend, formulário com persistência, auth ou integração externa |
| **Hotfix** | Link quebrado, convite não abre no celular, bug visível em produção |

### Execução

- **Simple:** diff pequeno, validação manual no celular, explicar o que mudou.
- **Normal:** brainstorming curto → Plan Mode → plano em `.cursor/plans/plan-YYYY-MM-DD-assunto.md` → fatias → validação manual.
- **Complex / Hotfix:** subir trilha, spec/plano mínimo, patch focado, smoke no link publicado.

### Gates humanos

Pedir aprovação explícita antes de:

- commit, push ou alterar visibilidade do repositório;
- mudar nomes (Helder/Alexia), tom da mensagem ou fluxo das 6 telas;
- tornar o repo privado/público ou trocar URL/domínio;
- incluir dados pessoais reais no código versionado;
- adicionar tracking, formulários ou APIs.

---

## Testes e validação

- Abrir no Chrome mobile ou Safari iOS (DevTools → modo responsivo como smoke).
- Testar: deslize, barra de progresso, botão que foge, confetes, escolha de comida, tela final.
- Após push: confirmar https://helderabud.github.io/Jantar/ (status `built`).
- Antes de concluir: explicar o que foi verificado e riscos residuais.

---

## Segurança e privacidade

- **Não commitar** rascunhos pessoais (`Aléxia.md.txt`, notas privadas).
- Repositório é **público** (exigência do GitHub Pages no plano gratuito) — evitar detalhes íntimos além do convite.
- Quem tem o link acessa; URL não é indexada automaticamente, mas trate como semi-público.

---

## Caminhos importantes

| Caminho | Conteúdo |
|---------|----------|
| `index.html` | Convite completo (HTML, CSS, JS) |
| `AGENTS.md` | Este guia operacional |
| `.cursor/rules/` | Regras persistentes do Cursor |
| `.cursor/plans/` | Planos aprovados |
| `../Agentes/helder-method-v1.2-resumo-compartilhavel.md` | Resumo do método |
| `../Skills/superpowers-cursor-playbook.md` | Playbook Superpowers |
