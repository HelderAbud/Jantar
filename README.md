# Convite Jantar ✨ (editável)

Convite interativo estilo iPhone — mini app HTML. Use o exemplo Helder → Alexia **ou** crie o seu e compartilhe um link.

**Link:** https://helderabud.github.io/Jantar/

**Crie o seu:** https://helderabud.github.io/Jantar/?modo=editor

(Alternativa com hash: https://helderabud.github.io/Jantar/#editor — no próprio convite use o botão **Criar o seu convite**.)

## O que é

Experiência mobile com telas: bloqueio → IA → resultado → missão → escolha do jantar → promessas → calendário + WhatsApp.

Qualquer pessoa pode preencher nomes e textos no **editor**, copiar um link (`#c=...`) e enviar no WhatsApp. **Sem cadastro e sem servidor** — a configuração vai no próprio link.

Sem parâmetros na URL, o site continua com o convite-exemplo Helder → Alexia.

## Como criar o seu (rápido)

1. Abra `#editor` (ou o botão **Criar o seu convite** na tela de bloqueio).
2. Preencha seu nome, o nome de quem convida, textos e (opcional) WhatsApp com DDI.
3. Toque em **Copiar link**.
4. Se o aviso de link longo aparecer, encurte os textos (limite prático ~2000 caracteres para WhatsApp).
5. Cole o link no WhatsApp.

Opções de comida no editor: uma por linha no formato `emoji|nome` (ex.: `🍕|Pizza`). Use `|chef` na última coluna se quiser o estilo “chef decide”.

Placeholders da mensagem WhatsApp: `{from}` `{to}` `{food}` `{date}`.

## Mensagem para enviar (exemplo Helder/Alexia)

Texto pronto em [`mensagem-whatsapp.txt`](mensagem-whatsapp.txt) — copie e cole no WhatsApp antes do link do exemplo.

### Dicas rápidas

- Manda em um momento tranquilo (não de madrugada).
- Tom discreto com 😊 em todo o convite e na mensagem.
- Depois que a pessoa abrir, deixa ir no ritmo dela — o convite já guia o resto.
- Quem tem o link (incluindo `#c=`) vê o conteúdo: trate como semi-público.

## Stack

- HTML + CSS + JavaScript (arquivo único: `index.html`)
- GitHub Pages
- Config compartilhável: JSON compacto → Base64URL no hash `#c=`

## Desenvolvimento

```bash
# Local
python -m http.server 8080
# Abrir http://localhost:8080
# Editor: http://localhost:8080/#editor
```

## Metodologia

Este projeto usa **Helder Method v1.2** + **Superpowers Cursor Playbook**.

- Guia do agente: [`AGENTS.md`](AGENTS.md)
- Plano editável: [`.cursor/plans/plan-2026-07-23-convite-editavel.md`](.cursor/plans/plan-2026-07-23-convite-editavel.md)
- Regras: [`.cursor/rules/`](.cursor/rules/)

## Repositório

https://github.com/HelderAbud/Jantar

## Licença

Distribuído sob a licença [MIT](LICENSE). Copyright (c) 2026 Helder Abud.
