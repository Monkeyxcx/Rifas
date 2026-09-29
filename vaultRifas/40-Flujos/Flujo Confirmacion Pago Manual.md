---
type: flujo
status: planned
area: flujos
tags: [rifascenter, flujo, pago-manual]
updated: 2026-09-02
---

# Flujo Confirmacion Pago Manual

## Qué es

Objetivo corto plazo:

1. Tras [[Flujo Reservar Numeros]], participante paga fuera de la app ([[Pagos Presenciales]]).
2. Organizador ve reservas pendientes en mis-rifas / panel.
3. Acción “Confirmar pago” → `reserva.status = paid`, crea/actualiza [[Entidad Pago]] `approved`, método `manual` / `presencial`.
4. Número queda vendido; countdown deja de aplicar.

## Estado

`planned` — no hay API/UI de confirmación aún. Sustituye conceptualmente el webhook MP.

## Conexiones

- [[Pagos Presenciales]] · [[Capa de Pagos]] · [[Estados Reserva]] · [[Estados Pago]]
- [[Ruta Mis Rifas Creadas]] · [[ADR 0003 Pagos sin Mercado Pago]]

## Archivos

- (futuro) `app/api/.../confirmar-pago` o Server Action

## Ver también

- [[MOC Flujos]] · [[Estrategia de Pagos]]
