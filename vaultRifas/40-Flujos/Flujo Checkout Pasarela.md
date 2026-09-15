---
type: flujo
status: planned
area: flujos
tags: [rifascenter, flujo, pasarela]
updated: 2026-09-02
---

# Flujo Checkout Pasarela

## Qué es

Flujo genérico futuro (sin proveedor elegido):

1. Reserva activa.
2. Crear intención de pago en provider ([[Candidato ePayco]] / [[Candidato Wompi]] / [[Candidato Stripe]]).
3. Redirect / widget checkout.
4. Webhook o return URL → actualizar [[Entidad Pago]] + [[Entidad Reserva]].

Implementar detrás de [[Capa de Pagos]], no acoplar UI al SDK de un vendor.

## Estado

`planned`. UI checkout actual aún orientada a CTA de pago online / mock MP — reinterpretar.

## Conexiones

- [[Estrategia de Pagos]] · [[Ruta Checkout]] · [[Legado Mercado Pago]] (no usar)

## Archivos

- (futuro) adapter por provider
- (legado) `app/api/mercadopago/*`

## Ver también

- [[MOC Flujos]] · [[Flujo Confirmacion Pago Manual]]
