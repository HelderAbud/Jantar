# LinkedIn — Convite Jantar (kit de publicação)

Arquivos de imagem em `docs/linkedin/`:

| Ordem | Arquivo | Uso |
|-------|---------|-----|
| Capa | `linkedin-capa-convite-jantar.png` | Post único (16:9) ou capa |
| 1 | `linkedin-slide-1-ideia.png` | Carrossel |
| 2 | `linkedin-slide-2-fluxo.png` | Carrossel |
| 3 | `linkedin-slide-3-editor.png` | Carrossel |
| 4 | `linkedin-slide-4-cta.png` | Carrossel (CTA) |

Links:

- Demo: https://helderabud.github.io/Jantar/ *(após merge/deploy da branch)*
- Editor: https://helderabud.github.io/Jantar/#editor
- Local: http://127.0.0.1:8765/ e http://127.0.0.1:8765/#editor

---

## Texto principal (post LinkedIn)

Copie e cole:

---

E se o convite para jantar não fosse só uma mensagem… e fosse uma experiência?

Criei o **Convite Jantar**: um mini-app no celular (estilo iPhone) em que a pessoa desbloqueia a tela, “passa por uma IA”, aceita a missão, escolhe a comida e agenda o dia — tudo com tom leve e divertido.

Agora qualquer pessoa pode **personalizar** nomes e textos num formulário simples, **gerar um link** e mandar no WhatsApp.

Sem cadastro. Sem backend. Sem app store.  
A configuração viaja no próprio link (`#c=`).

O que você vê no fluxo:
1. Notificação na tela de bloqueio  
2. Análise divertida  
3. Resultado + missão (com o botão que foge)  
4. Escolha do jantar + calendário  
5. Resumo pronto para WhatsApp  

Tecnologias: HTML + CSS + JavaScript vanilla, GitHub Pages.  
Processo: **Helder Method** (contrato claro, fatias pequenas, validação antes de publicar).

Quer testar?
- Abrir o exemplo: https://helderabud.github.io/Jantar/  
- Criar o seu: https://helderabud.github.io/Jantar/#editor  

Se fizer um para alguém especial, me marca nos comentários — quero ver a criatividade de vocês.

#HTML #JavaScript #ProdutoDigital #UX #Frontend #GitHubPages #HelderMethod #Inovacao

---

## Versão curta (alternativa)

Convite de jantar virou mini-app.  
Você personaliza → gera um link → manda no WhatsApp.  
Sem backend, sem cadastro.

Teste: https://helderabud.github.io/Jantar/#editor

---

## Como publicar no LinkedIn

1. Novo post → **Adicionar documento/imagem** ou carrossel.  
2. Suba os 4 slides na ordem 1→4 (ou só a capa 16:9).  
3. Cole o **texto principal**.  
4. Se o deploy do editor ainda não estiver no ar, diga no post que o link público sobe após o merge — ou use o local só para demo em vídeo.

## Checklist de testes (2026-07-23)

- [x] Servidor local responde em :8765  
- [x] Default sem telefone pessoal no código  
- [x] Editor (`#editor`) + scroll  
- [x] Encode/decode `#c=` (roundtrip)  
- [x] Limite ~2000 chars, placeholders WhatsApp  
- [ ] Validação manual no celular (você): deslize, botão que foge, copiar link, abrir `#c=`  
- [ ] Deploy Pages após PR/merge  

## Nota de privacidade

Não publique no LinkedIn prints com telefone real, nomes íntimos ou o link `#c=` com dados pessoais de terceiros.
