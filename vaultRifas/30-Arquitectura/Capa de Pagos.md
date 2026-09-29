---
type: arquitectura
status: planned
area: arquitectura
tags: [rifascenter, pagos, abstraccion]
updated: 2026-09-02
---

# Capa de Pagos

## Qué es

Abstracción deseada entre [[Entidad Reserva]] / [[Entidad Pago]] y el medio de cobro:

1. **Manual / presencial** — organizador confirma → `reserva.paid` + `pago.approved` ([[Pagos Presenciales]])
2. **Pasarela** — provider pluggable (ePayco / Wompi / Stripe) vía [[Flujo Checkout Pasarela]]
3. **Legado MP** — no extender ([[Legado Mercado Pago]])

## Estado

Concepto de producto + ADR. Sin interfaz TypeScript unificada aún. Schema `pagos` aún con columnas MP.

## Conexiones

- [[Estrategia de Pagos]] · [[Flujo Confirmacion Pago Manual]] · [[Flujo Checkout Pasarela]]
- [[Candidato ePayco]] · [[Candidato Wompi]] · [[Candidato Stripe]]
- [[ADR 0003 Pagos sin Mercado Pago]]

## Archivos

- (futuro) módulo `lib/payments/` sugerido
- (legado) `lib/mercadopago.ts`

## Ver también

- [[MOC Arquitectura]] · [[MOC Dominio]]
