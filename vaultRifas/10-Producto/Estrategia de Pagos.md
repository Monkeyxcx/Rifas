---
type: producto
status: planned
area: producto
tags: [rifascenter, pagos, estrategia]
updated: 2026-09-02
---

# Estrategia de Pagos

## Qué es

Cómo se confirma el pago de números reservados.

| Horizonte | Enfoque | Status |
|-----------|---------|--------|
| Corto plazo | [[Pagos Presenciales]] / confirmación manual por organizador | planned (objetivo) |
| Medio plazo | Pasarela: [[Candidato ePayco]], [[Candidato Wompi]] o [[Candidato Stripe]] | planned (sin elección) |
| No objetivo | Mercado Pago | deprecated — [[Legado Mercado Pago]] |

El dominio ([[Entidad Reserva]], [[Entidad Pago]]) debe permanecer **agnóstico** a la pasarela.

## Estado

- Código MP existe en repo pero **no es roadmap** ([[ADR 0003 Pagos sin Mercado Pago]]).
- Falta UI/API de “marcar como pagado” para flujo presencial.

## Conexiones

- [[Capa de Pagos]] · [[Flujo Confirmacion Pago Manual]] · [[Flujo Checkout Pasarela]]
- [[Flujo Reservar Numeros]] · [[Estados Pago]]

## Archivos

- (objetivo) API futura de confirmación manual
- (legado) `lib/mercadopago.ts`, `app/api/mercadopago/*`

## Ver también

- [[MOC Producto]] · [[MOC Estado Actual]]
