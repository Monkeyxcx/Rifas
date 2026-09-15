---
type: integracion
status: deprecated
area: integraciones
tags: [rifascenter, pagos, mercadopago, legado]
updated: 2026-09-02
---

# Legado Mercado Pago

## Qué es

Código y docs del repo que asumen Mercado Pago como pasarela. **No es objetivo de producto** — no implementar ni extender.

Incluye: `lib/mercadopago.ts`, `POST /api/mercadopago/create-preference`, `POST /api/mercadopago/webhook`, vars `MERCADO_PAGO_*`, headers/cron orientados a MP en `vercel.json`, columnas `mercado_pago_*` en [[Entidad Pago]].

## Estado

`deprecated` en el vault. Existe en el código. Limpieza = deuda técnica ([[Brechas Conocidas]], [[Roadmap Escalabilidad]]).

## Conexiones

- [[ADR 0003 Pagos sin Mercado Pago]] · [[Estrategia de Pagos]] · [[Capa de Pagos]] · [[APIs]]

## Archivos

- `lib/mercadopago.ts`
- `app/api/mercadopago/create-preference/route.ts`
- `app/api/mercadopago/webhook/route.ts`
- `docs/arquitectura-tecnica.md` (asume MP)

## Ver también

- [[Pagos Presenciales]] · [[Flujo Checkout Pasarela]]
