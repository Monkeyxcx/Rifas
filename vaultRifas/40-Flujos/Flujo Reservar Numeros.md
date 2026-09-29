---
type: flujo
status: partial
area: flujos
tags: [rifascenter, flujo, reserva]
updated: 2026-09-02
---

# Flujo Reservar Numeros

## Qué es

1. Usuario elige números en [[Ruta Rifa Detalle]] (`NumberGrid`).
2. `POST /api/reservar` — valida límites, crea hold ~15 min.
3. Si Supabase placeholder / sin user → **mock mode** ([[ADR 0001 Mock Mode]]).
4. Redirect / navegación a [[Ruta Checkout]].

## Estado

API con fallback mock. UI con `MOCK_RIFAS`. Persistencia real cuando env + RPC/tablas conectadas.

## Conexiones

- [[Entidad Reserva]] · [[Estados Reserva]] · [[Flujo Confirmacion Pago Manual]] · [[APIs]]

## Archivos

- `app/api/reservar/route.ts`
- `components/rifas/NumberGrid.tsx`
- `app/(app)/rifas/[id]/page.tsx`

## Ver también

- [[MOC Flujos]] · [[Estrategia de Pagos]]
