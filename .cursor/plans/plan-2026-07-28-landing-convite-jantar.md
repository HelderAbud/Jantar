# Plan — Landing Convite Jantar (`/site/`)

Data: 2026-07-28  
Projeto: Aléxia / Jantar (GitHub Pages)  
Status: **Fase 6 implementada** (polish mobile) — PR aberto; Pages no ar após merge em `Main`  
Trilha: Normal  

## Objetivo

Site de **venda e apresentação** chamativo (tom Apple + Linear + Stripe), que conte a história do produto e leve o visitante a experimentar — sem parecer “só um README bonito”.

## Decisões aprovadas

| Item | Escolha |
|------|---------|
| Abordagem | **C em fatias dentro de A**: mesmo repo; landing leve + demo real; React só se a Fase 4 exigir |
| Marca na landing | **Convite Jantar** |
| Pasta / URL | `site/` → `https://helderabud.github.io/Jantar/site/` |
| Stack MVP | HTML + CSS + JS + GSAP + Lenis (CDN) |
| Assets base | `docs/linkedin/*.png` + `POST-LINKEDIN.md` |
| App real (inalterado no MVP) | `/` demo · `/?modo=editor` · `/?modo=venda` |
| Depoimentos | **Não** inventar avaliações |
| Templates multi-evento | Roadmap (não MVP da home) |
| R3F / iPhone 3D pesado | Fora do MVP (mock CSS / arte LinkedIn) |

## CTAs canónicos

| CTA | Destino |
|-----|---------|
| Criar convite | https://helderabud.github.io/Jantar/?modo=editor |
| Ver demonstração | `#demo` na landing **ou** https://helderabud.github.io/Jantar/ |
| White-label / Pro (secundário) | https://helderabud.github.io/Jantar/?modo=venda |
| Local | http://127.0.0.1:5177/site/ (quando existir) · app em `:5177` |

## Mapa de secções (Fase 1 — aprovado)

1. **Hero** — headline + sub + CTAs; visual capa/mock (leve)  
2. **Como funciona** — timeline animada no scroll  
3. **Demonstração** (`#demo`) — celular + telas do fluxo (scroll-synced ou iframe do app)  
4. **Como usar** — passos práticos + links  
5. **Recursos** — cards de features  
6. **FAQ**  
7. **Rodapé** — GitHub, LinkedIn, contacto, docs, roadmap  

### Conteúdo mínimo “Como usar”

1. Abrir editor  
2. Nomes + 2 WhatsApps  
3. Ver prévia  
4. Pagar Pro (se for enviar) / ou fluxo Free só ver  
5. Enviar link no WhatsApp (1 licença por pagamento, quando Pro)  
6. Convidada abre, desbloqueia, responde  

(Ajustar copy Free vs Pro conforme produto atual — sem prometer o que o Free não faz.)

## Fases de execução (HITL entre cada uma)

| Fase | Entrega | Gate |
|------|---------|------|
| **0** | Decisões (marca, stack, URL) | ✅ feito |
| **1** | Mapa de secções + CTAs | ✅ aprovado 2026-07-28 |
| **2** | Spec visual (híbrido C) | ✅ aprovado 2026-07-28 |
| **3** | Hero + Como funciona + CTAs | ✅ implementado 2026-07-28 |
| **4** | Demo scroll / iframe + assets LinkedIn | ✅ implementado 2026-07-28 |
| **5** | Como usar + FAQ + rodapé | ✅ implementado 2026-07-28 |
| **6** | Polish mobile + publish Pages `/site/` | ✅ polish feito 2026-07-28 — publish via PR |

## Spec visual (Fase 2 — aprovado)

- **Direção C (híbrido):** hero cinematográfico escuro (artes `docs/linkedin/`); secções seguintes mais sóbrias estilo produto (Linear/Stripe).
- **Motion MVP:** Lenis + scroll reveal + cursor glow leve; sem React Three Fiber no início.
- **Tipografia / tokens:** a fechar na fatia de implementação (evitar Inter/Roboto; par display + texto).
- **Acento:** um único destaque (ex. rosa do app no hero; acento mais sóbrio nas secções claras/escuras limpas).

## Critérios de qualidade

- Visual no nível das artes LinkedIn (não “landing genérica”)  
- Tipografia expressiva (não Inter/Roboto default)  
- Fundo com atmosfera (gradiente/partículas leves) — performance mobile  
- Responsivo impecável  
- Visitante consegue **experimentar** (demo ou link para o app) antes de criar  
- Sem backend novo; sem secrets no Pages  

## Fora de escopo (até nova decisão)

- Rebrand completo do mini-app para outro nome  
- SaaS multi-template (cinema, café, etc.)  
- Métricas inventadas / fake social proof  
- Domínio próprio (pode entrar depois)  

## Próximo passo

Merge do PR da landing → confirmar https://helderabud.github.io/Jantar/site/ (`Pages` status `built`).  
Landing MVP fechada (fases 0–6).
