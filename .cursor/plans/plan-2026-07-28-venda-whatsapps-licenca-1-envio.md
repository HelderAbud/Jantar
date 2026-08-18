# Plan / Spec — Venda: WhatsApps + licença 1 envio

Data: 2026-07-28  
Projeto: Aléxia / Jantar Link  
Status: **em implementação** (fatias A–C no código; ping resposta da convidada = depois)  
Trilha: Normal  

## Objetivo

Na tela `?modo=venda`, coletar nomes **e** os 2 WhatsApps antes do pagamento; após Pro, abrir o **editor** preenchido; cada pagamento libera **uma** ação de saída (WhatsApp convidada **ou** Instagram **ou** copiar/gerar link). Novo envio exige novo pagamento.

## Decisões fechadas

| Tema | Escolha |
|------|---------|
| Onde coletar WAs | Tela de venda (com nomes), antes de Pagar |
| Obrigatoriedade | Pagar bloqueado sem 2 nomes + 2 WAs |
| Envio | Só com Pro (pagamento aprovado) |
| Pós-pagamento | Fluxo B → `modo=editor` preenchido |
| Persistência | Caminho 1 → `configPayload` no checkout |
| Consumo Pro | 1ª ação de saída **ou** ciclo completo (link enviado + resposta dada) |

## Contrato de campos (já existente)

- `whatsappInvitePhone` — convidada; destino do “Enviar link / convite”  
- `whatsappPhone` — criador; vai no `#c=` (`w`); botão final `wa.me` da convidada (resposta)

## Preview Free (regra dura)

- Preview / “Ver convite” **nunca** libera envio, copiar link de saída nem Instagram **sem pagamento Pro**.  
- Mesmo com WAs preenchidos na venda: preview = só visualizar.  
- Qualquer botão de saída no preview permanece bloqueado / oculto até Pro ativo e licença não consumida.

## UI — `?modo=venda`

Ordem sugerida:

1. Quem convida (nome)  
2. Seu WhatsApp (receber a resposta) → `whatsappPhone`  
3. Quem é convidada(o) (nome)  
4. WhatsApp dela/dele (enviar o convite) → `whatsappInvitePhone`  

- Preview Free: nomes (+ WAs só para montar payload depois); **zero envio**.  
- Pagar Pro: valida 4 campos (normalizar dígitos E.164-ish, DDI 55 se aplicável ao padrão atual do editor).  
- Não zerar telefones ao montar `configPayload` do checkout (corrigir o comportamento atual do preview/checkout que limpa WAs).

## Checkout / retorno

1. `POST /api/checkout` com `fromName`, `toName`, `configPayload` (delta/`#c=` incluindo `w` + invite phone conforme encoding atual).  
2. Após `paid`, `proUrl` deve abrir editor Pro, ex.:  
   `?pro=<token>&modo=editor#c=<payload>`  
   (ajustar `fulfill` / front `handleVendaPaymentReturn` conforme necessário).  
3. Editor: campos e WAs preenchidos; Copiar / Gerar / Enviar liberados **enquanto** a licença não foi consumida.

## Licença Pro — quando queima

### Consome (gasta o Pro deste pagamento)

**A — 1ª ação de saída do criador (já decidido):**
- Enviar WhatsApp para a convidada, **ou**  
- Copiar para Instagram, **ou**  
- Copiar / gerar link compartilhável  

**B — Ciclo completo (novo):**  
Quando o **link já foi enviado** e a **convidada deu a resposta** (`wa.me` final para o criador), o Pro **também é queimado** (licença encerrada).  
Se A já tiver queimado antes, B é no-op. Se por algum caminho o envio ocorreu e a resposta fecha o ciclo, B garante o fim da licença.

### Não consome (ainda)

- Ver preview / Ver convite (só visualizar)  
- Editar textos no editor (sem sair)  
- Percorrer telas 1–7 **sem** disparar saída do criador e **sem** concluir resposta (enquanto licença ativa)

### Nota técnica (importante)

A resposta da convidada roda **no telemóvel dela** (abre o `#c=`). O Pro do criador está noutro browser.  
Para B ser fiável no MVP: o clique da resposta deve avisar o Worker (`orderId` no payload/URL ou ping) para marcar `consumed` — senão só A é enforceável no browser do criador. Documentar: fatia 1 = A + preview gate; fatia 2 = ping de resposta → `consumed`.

### Após consumir

- `isProUnlocked = false` (ou flag `sendConsumed`)  
- Limpar `?pro=` / `sessionStorage` de Pro  
- Worker: marcar pedido `consumed` / `send_used` (amarrado a `orderId`)  
- UI: botões de saída bloqueados + CTA “Pagar de novo para enviar outra vez” → `?modo=venda`

### Limitação conhecida

Token estático `JL-PRO-DEMO` sozinho não garante “uma vez” (URL pode ser reutilizada). MVP sério: token/pedido **único por pagamento** + `consumed` no Worker. Sandbox pode documentar o limite.

## Fora de escopo desta fatia

- Preço / Pix sandbox / TLS Node  
- Kit Instagram F1.1  
- Novo layout da lock (já feito à parte)  
- Persistência durável (DB) além da memória do Worker local  

## Critérios de aceite

1. Venda exige 2 nomes + 2 WAs para Pagar.  
2. Após pagamento aprovado (ou Pro de teste com payload), editor abre com nomes e WAs.  
3. **Preview Free: zero envio** (sem WA/IG/copiar link de saída sem pagamento).  
4. Primeira ação de saída do criador (WA **ou** IG **ou** copiar/gerar) gasta a licença.  
5. Ciclo completo (link enviado + resposta da convidada) **também** queima o Pro (Worker/`consumed` quando fiável).  
6. Novo envio exige novo pagamento.  
7. Sem commit de `.dev.vars` / tokens / telefones reais no Git.

## Próximo passo

Após revisão deste arquivo: plano de implementação em fatias (`to-issues` / execução) — **só com pedido explícito para implementar**.
