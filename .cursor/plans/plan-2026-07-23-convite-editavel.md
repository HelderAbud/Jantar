# Plano: Convite Aléxia editável (link na URL)

**Status:** aprovado e em execução  
**Trilha:** Normal (Helder Method v1.2)  
**Data:** 2026-07-23

## Decisões

1. Formulário no site → link com config no hash (`#c=`) → WhatsApp. Sem backend.
2. Dentro do repo Aléxia/Jantar; default sem hash = Helder → Alexia.

## Contrato mínimo

Ver `AGENTS.md` (modos Convite / Personalizado / Editor + campos MVP).

## Fatias

| Fatia | Valor | Status |
|-------|-------|--------|
| 0 | Contrato AGENTS + este plano | conclu |
| 1 | CONFIG + apply | conclu |
| 2 | Ler `#c=` | concluída |
| 3 | Editor + copiar link | concluída |
| 4 | Limites URL, WhatsApp template, README | concluída |

## Encoding

JSON mínimo → Base64URL no hash `#c=...`. Limite prático ~2000 chars; editor avisa se passar.
