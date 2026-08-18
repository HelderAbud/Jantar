# Trabalhar no Instagram sem expor senha

## Regra de ouro

**A IA não deve receber nem ler a senha do Instagram.**  
Se o arquivo com senha for aberto no chat, a senha entra no histórico da conversa — deixa de ser “sem expor”.

Fase 1 do plano (A+B) **não precisa** de login da IA: você opera a conta; a IA prepara kit, textos, checklist e código (botão share, modo venda).

## Arquivos

| Arquivo | Versionar? | Uso |
|---------|------------|-----|
| `.env.instagram.example` | Sim | Modelo vazio (seguro) |
| `.env.instagram` | **Não** (gitignore) | Seu lembrete local de @ e links — **sem pedir para a IA ler** |
| `docs/instagram/*.local.md` | **Não** | Notas privadas suas |
| `docs/instagram/` (kit, legendas) | Sim | Conteúdo de trabalho conjunto |

## Como colaborar com segurança

1. Preencha `.env.instagram` **só no seu PC** (opcional: só o `@` e links; senha melhor só no gerenciador do celular/navegador).
2. No chat, diga só o que for público, ex.: `handle é @fulano` e “bio ainda não atualizei”.
3. Peça à IA: legendas, checklist de rebrand, ordem dos highlights, textos do link-in-bio.
4. **Você** cola no Instagram (app oficial). A IA não entra na sua conta.

## O que nunca fazer

- Colar senha no chat
- `@` ou anexar `.env.instagram` para a IA “acessar a conta”
- Commitar `.env.instagram`
- Usar a mesma senha do Instagram em outros lugares / em arquivos que vão para Git

## Se a conta tiver 2FA

Mantenha 2FA ligado. Não compartilhe códigos OTP com a IA.
