---
type: entidad
status: implemented
area: dominio
tags: [rifascenter, estados, pago]
updated: 2026-09-02
---

# Estados Pago

## Qué es

| Estado | Significado |
|--------|-------------|
| `pending` | Iniciado / esperando confirmación |
| `in_process` | En proceso |
| `approved` | Aprobado |
| `rejected` | Rechazado |
| `cancelled` | Cancelado |
| `refunded` | Reembolsado |

## Estado

Tipos presentes. Semántica válida para **manual** (organizador aprueba) y para pasarela futura. Webhook MP = legado.

## Conexiones

- [[Entidad Pago]] · [[Estados Reserva]] · [[Capa de Pagos]]

## Archivos

- `lib/types.ts` → `PagoStatus`

## Ver también

- [[MOC Dominio]] · [[ADR 0003 Pagos sin Mercado Pago]]
