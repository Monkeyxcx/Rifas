---
type: entidad
status: partial
area: dominio
tags: [rifascenter, entidad, pago]
updated: 2026-09-02
---

# Entidad Pago

## Qué es

Registro de cobro asociado a rifa/usuario/reserva. Estados: [[Estados Pago]]. Abstracción de dominio **independiente** de la pasarela ([[Capa de Pagos]]).

## Estado

- Tabla y tipos TS existen.
- Campos actuales acoplados a MP (`mercado_pago_payment_id`, `mercado_pago_preference_id`, `mercado_pago_raw`) = **legado** — no reflejan la estrategia de producto.
- Objetivo: pago manual / otras pasarelas sin redefinir el concepto de Pago.

## Conexiones

- [[Entidad Reserva]] · [[Entidad Rifa]] · [[Entidad Perfil]]
- [[Estrategia de Pagos]] · [[Flujo Confirmacion Pago Manual]] · [[Flujo Checkout Pasarela]]
- [[Legado Mercado Pago]] · [[ADR 0003 Pagos sin Mercado Pago]]

## Archivos

- `lib/types.ts` → `Pago`
- `supabase/migrations/0001_init_schema.sql` (tabla `pagos`)

## Ver también

- [[MOC Dominio]] · [[Modelo de Datos]]
