# LinkedIn — Convite Jantar (kit de publicação)

Arquivos de imagem em `docs/linkedin/`:

| Ordem | Arquivo | Uso |
|-------|---------|-----|
| Capa | `linkedin-capa-convite-jantar.png` | Post único (16:9) ou capa |
| 1 | `linkedin-slide-1-ideia.png` | Carrossel |
| 2 | `linkedin-slide-2-fluxo.png` | Carrossel |
| 3 | `linkedin-slide-3-editor.png` | Carrossel |
| 4 | `linkedin-slide-4-cta.png` | Carrossel (CTA) |

Links (canónicos):

- Demo: https://helderabud.github.io/Jantar/
- Editor: https://helderabud.github.io/Jantar/?modo=editor
- Local: http://localhost:8080/ e http://localhost:8080/?modo=editor
- No convite padrão: botão **Criar o seu convite** na tela de bloqueio

---

## Texto principal (post LinkedIn)

Copie e cole:

---

E se o convite para jantar não fosse só uma mensagem… e fosse uma experiência?

Criei o **Convite Jantar**: um mini-app no celular (estilo iPhone) em que a pessoa desbloqueia a tela, “passa por uma IA”, aceita a missão, escolhe a comida e agenda o dia — tudo com tom leve e divertido.

Agora qualquer pessoa pode **personalizar** nomes e textos num formulário simples, **gerar um link** e mandar no WhatsApp.

Sem cadastro. Sem backend próprio. Sem app store.  
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
- Criar o seu: https://helderabud.github.io/Jantar/?modo=editor  

Se fizer um para alguém especial, me marca nos comentários — quero ver a criatividade de vocês.

#HTML #JavaScript #ProdutoDigital #UX #Frontend #GitHubPages #HelderMethod #Inovacao

---

## Versão curta (alternativa)

Convite de jantar virou mini-app.  
Você personaliza → gera um link → manda no WhatsApp.  
Sem backend próprio, sem cadastro.

Teste: https://helderabud.github.io/Jantar/?modo=editor

---

## Como publicar no LinkedIn

1. Novo post → **Adicionar documento/imagem** ou carrossel.  
2. Suba os 4 slides na ordem 1→4 (ou só a capa 16:9).  
3. Cole o **texto principal**.  
4. Links públicos já estão no ar (Pages em `Main`).

## Checklist de testes

### 2026-07-25 (smoke pós PR #7) — OK

- [x] Pages `built` com editor, 2 WhatsApps, link curto, delta `#c=`
- [x] Local `:8080` / `/?modo=editor`
- [x] Ver convite com nomes novos (não volta ao form)
- [x] Copiar link curto → mesmos nomes
- [x] Enviar link WA → chat da convidada
- [x] Fim do fluxo → WA do criador
- [x] Voltar ao formulário na última tela
- [x] Calendário: passado bloqueado; hoje+ e quartas ok

### Privacidade no post

Não publique no LinkedIn prints com telefone real, nomes íntimos ou o link `#c=` com dados pessoais de terceiros.
