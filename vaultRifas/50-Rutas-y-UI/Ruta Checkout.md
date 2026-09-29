---
type: ruta
status: mock
area: ui
tags: [rifascenter, ruta, checkout]
updated: 2026-09-02
---

# Ruta Checkout

## Qué es

`/checkout/[reservaId]` — countdown de reserva + CTA de pago. Privada vía middleware.

## Estado

UI mock/demo. CTA histórica hacia MP → reorientar a instrucciones de [[Pagos Presenciales]] o [[Flujo Checkout Pasarela]].

## Conexiones

- [[Flujo Reservar Numeros]] · [[Flujo Confirmacion Pago Manual]] · [[Entidad Reserva]]
- [[Componentes Clave]] (`CountdownTimer`)

## Archivos

- `app/(app)/checkout/[reservaId]/page.tsx`
- `components/checkout/CountdownTimer.tsx`

## Ver también

- [[MOC Flujos]] · [[Estrategia de Pagos]]
