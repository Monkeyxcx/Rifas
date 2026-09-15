---
type: adr
status: implemented
area: decisiones
tags: [rifascenter, adr, limites]
updated: 2026-09-02
---

# ADR 0002 Limite 10-100 numeros

## Contexto

Rifas deben ser “pequeñas” (producto: sorteos manejables, no loterías masivas).

## Decisión

Cada rifa configura entre **10 y 100** números (representación `"00"`…`"99"` según total).

## Consecuencias

- UX de grilla simple ([[Componentes Clave]] NumberGrid).
- Validaciones en crear/reservar.
- Escala futura a más números requeriría nuevo ADR.

## Conexiones

- [[Entidad Rifa]] · [[Flujo Crear Rifa]] · [[Vision RifasCenter]]

## Archivos

- `docs/arquitectura-tecnica.md`
- `components/rifas/CreatorForm.tsx` / tipos `total_numbers`

## Ver también

- [[MOC Estado Actual]] · [[Plantilla ADR]]
