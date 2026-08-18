# Entrega HITL — Jantar Link Pro (F1.5)

Fluxo manual após preview em `/?modo=venda`.

## O que o Pro inclui (A+C)

- Remove marca “Feito com Jantar Link” (watermark Free)
- Badge **Jantar Link Pro**
- Pacote white-label: cliente usa o editor com o nome dela/dele
- Suporte HITL (combine prazo no WhatsApp)
- Editor básico **continua gratuito** (com marca)

## Token Pro (F2)

No site público, `?pro=JL-PRO-DEMO` **não** libera o editor. O Worker gera um token **por pedido** depois do pagamento (`?pro=jl_…`).

Demo local:

```text
http://localhost:5177/?pro=JL-PRO-DEMO
```

Links HITL antigos com `JL-PRO-DEMO` no Pages deixam de funcionar. Entregue de novo pelo fluxo de pagamento (ou um `proUrl` novo do Worker).

## Pagamento no site (F2)

Depois do Worker na Cloudflare (`docs/venda/DEPLOY-CLOUDFLARE.md`), o cliente paga em `/?modo=venda` e volta ao editor Pro no Pages. Este playbook HITL (PIX manual) continua como fallback se o Worker cair.

1. Cliente abre `/?modo=venda`, digita nomes, vê **preview Free** (com marca).
2. Cliente pede white-label no WhatsApp (ou você recebe DM/IG).
3. Você envia **valor + chave PIX** (dados só no seu WhatsApp — não versionar no Git).
4. Confirma comprovante.
5. No editor (`/?modo=editor`), monta o convite com os nomes do cliente → **Copiar link curto**.
6. Prefixa o link com o `?pro=` do `proUrl` do pedido pago (não uses `JL-PRO-DEMO` no Pages).
7. Envia o link Pro no WhatsApp + 2 linhas de suporte (“abra, personalize se quiser, mande à pessoa”).
8. Opcional: peça um print do Pro sem watermark para portfólio (com autorização).

## Configurar WhatsApp de vendas no site

Em `index.html` → `BRAND.salesWhatsappE164` (só dígitos com DDI, ex. `5561999999999`).  
Vazio = botão da página de venda avisa para usar este playbook.

## Preço

Defina e anote **fora do Git** (nota local / planilha). No site, `BRAND.priceLabel` pode ficar genérico: “combine o valor no WhatsApp”.

## Ensaio (você sozinho)

1. `/?modo=venda` → nomes teste → preview  
2. Simular PIX OK  
3. Abrir o `proUrl` devolvido pelo Worker após pagar → watermark some  
4. Sem `?pro=` válido → marca volta (aba anónima / sem sessionStorage)

## Fora do F1

Checkout automático, licença anti-vazamento (F2/F3), API Instagram (F4).
