---
type: adr
status: implemented
area: decisiones
tags: [rifascenter, adr, pagos]
updated: 2026-09-02
---

# ADR 0003 Pagos sin Mercado Pago

## Contexto

El repo y `docs/arquitectura-tecnica.md` asumen Mercado Pago. El producto **no** implementará MP. Las compras serán primero **presenciales/manuales**; luego se evaluará ePayco, Wompi o Stripe.

## Decisión

1. MP = **fuera de roadmap** ([[Legado Mercado Pago]]).
2. Corto plazo: [[Pagos Presenciales]] + [[Flujo Confirmacion Pago Manual]].
3. Medio plazo: elegir una de [[Candidato ePayco]] / [[Candidato Wompi]] / [[Candidato Stripe]] detrás de [[Capa de Pagos]].
4. Dominio [[Entidad Pago]] / [[Entidad Reserva]] permanece agnóstico.

## Consecuencias

- Docs legado quedan desalineados (anotar en [[Brechas Conocidas]]).
- Deuda técnica de limpiar código/env/schema MP.
- Checkout UI debe reorientarse.

## Conexiones

- [[Estrategia de Pagos]] · [[Estado Actual]] · [[Roadmap Escalabilidad]]

## Archivos

- (legado) `lib/mercadopago.ts`, `app/api/mercadopago/*`
- (producto) este ADR + vault

## Ver también

- [[MOC Estado Actual]] · [[Plantilla ADR]]
