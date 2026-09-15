---
type: entidad
status: partial
area: dominio
tags: [rifascenter, entidad, reserva]
updated: 2026-09-02
---

# Entidad Reserva

## Qué es

Hold temporal de un número (`"00"`…`"99"`) en una rifa. Grace típico ~**15 min**. Estados: [[Estados Reserva]]. Índice parcial único sobre número activo por rifa (migración 0003).

## Estado

- API `POST /api/reservar` con modo mock si env placeholder ([[ADR 0001 Mock Mode]]).
- UI checkout asume reserva; confirmación de pago real pendiente ([[Flujo Confirmacion Pago Manual]]).

## Conexiones

- Pertenece a → [[Entidad Rifa]] · [[Entidad Perfil]]
- Puede generar → [[Entidad Pago]]
- [[Flujo Reservar Numeros]] · [[Ruta Checkout]] · [[Deploy y Cron]] (limpiar expiradas)

## Archivos

- `lib/types.ts` → `Reserva`
- `app/api/reservar/route.ts`
- `supabase/migrations/0003_mercado_pago_helpers.sql` (helpers de números; nombre histórico)

## Ver también

- [[MOC Dominio]] · [[Capa de Pagos]]
