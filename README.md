# Convite Jantar ✨ (editável)

Convite interativo estilo iPhone — mini app HTML. Use o exemplo Bruno → Lara **ou** crie o seu e compartilhe um link.

**Landing (apresentação do produto):** [helderabud.github.io/Jantar/site/](https://helderabud.github.io/Jantar/site/)

![Convite Jantar — capa](docs/linkedin/linkedin-capa-convite-jantar.png)

## Links

| Uso | URL |
|-----|-----|
| **Landing / site** | https://helderabud.github.io/Jantar/site/ |
| Demo (exemplo Bruno → Lara) | https://helderabud.github.io/Jantar/ |
| Editor (criar o seu) | https://helderabud.github.io/Jantar/?modo=editor |
| Venda / white-label | https://helderabud.github.io/Jantar/?modo=venda |
| Pro (demo) | acrescente `?pro=JL-PRO-DEMO` na URL |
| Local | http://localhost:5177/ · `/site/` · `?modo=editor` · `?modo=venda` |

Kit Instagram (Jantar Link): [`docs/instagram/`](docs/instagram/).
Kit LinkedIn: [`docs/linkedin/`](docs/linkedin/).

## O que é

Experiência mobile com telas: bloqueio → IA → resultado → missão → escolha do jantar → promessas → calendário + WhatsApp.

Qualquer pessoa pode preencher nomes e textos no **editor**, gerar um link (`#c=...`) e enviar no WhatsApp. **Sem cadastro e sem backend próprio** — a configuração vai no próprio link (opcionalmente encurtado via serviço externo ao copiar/enviar).

Sem `#c=` na URL, o site continua com o convite-exemplo Bruno → Lara.

## Como criar o seu (rápido)

1. Abra [/?modo=editor](https://helderabud.github.io/Jantar/?modo=editor) (ou o botão **Criar o seu convite** na tela de bloqueio).
2. Preencha **seu nome** (quem convida) e o **nome de quem você convida**.
3. Informe os **dois WhatsApps** (obrigatórios, só números com DDI):
   - da pessoa convidada (recebe o link);
   - o seu (recebe a resposta no fim do convite).
4. Ajuste textos se quiser (se deixar o modelo padrão, o link fica bem mais curto).
5. Use **Ver convite** para pré-visualizar, **Copiar link curto** ou **Enviar link no WhatsApp**.

Opções de comida no editor: uma por linha no formato `emoji|nome` (ex.: `🍕|Pizza`). Use `|chef` na última coluna se quiser o estilo “chef decide”.

Placeholders da mensagem WhatsApp final: `{from}` `{to}` `{food}` `{date}`.

### Dicas de link

- Só nomes + WhatsApps (textos padrão) → link curto no `#c=`.
- **Copiar link curto** / **Enviar** tentam encurtar (CleanURI; se falhar, usam o link completo do Pages).
- Limite prático ~2000 caracteres; o editor avisa se passar.
- Quem tem o link (incluindo `#c=`) vê o conteúdo: trate como semi-público.

## Mensagem para enviar (exemplo Bruno/Lara)

Texto pronto em [`mensagem-whatsapp.txt`](mensagem-whatsapp.txt) — copie e cole no WhatsApp antes do link do exemplo.

### Dicas rápidas

- Manda em um momento tranquilo (não de madrugada).
- Tom discreto com 😊 em todo o convite e na mensagem.
- Depois que a pessoa abrir, deixa ir no ritmo dela — o convite já guia o resto.

## Stack

- HTML + CSS + JavaScript (arquivo único: `index.html`)
- GitHub Pages (`Main`)
- Config compartilhável: JSON compacto (delta) → Base64URL no hash `#c=`
- Encurtador opcional no cliente (sem servidor próprio)

## Desenvolvimento

```bash
# Na raiz do repositório
python -m http.server 5177
# Convite:  http://localhost:5177/
# Landing:  http://localhost:5177/site/
# Editor:   http://localhost:5177/?modo=editor
```

Porta canônica do portfólio: **5177** (evita colisão com outros projetos locais na 8080).

Alias ainda aceito: `/#editor` (preferir `/?modo=editor`).

## Metodologia

Este projeto usa **Helder Method v1.2** + **Superpowers Cursor Playbook**.

- Guia do agente: [`AGENTS.md`](AGENTS.md)
- Plano editável: [`.cursor/plans/plan-2026-07-23-convite-editavel.md`](.cursor/plans/plan-2026-07-23-convite-editavel.md)
- Regras: [`.cursor/rules/`](.cursor/rules/)

## Repositório

https://github.com/HelderAbud/Jantar

## Licença

Distribuído sob a licença [MIT](LICENSE). Copyright (c) 2026 Helder Abud.
