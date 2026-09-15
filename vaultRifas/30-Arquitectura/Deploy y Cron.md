---
type: arquitectura
status: partial
area: arquitectura
tags: [rifascenter, vercel, cron]
updated: 2026-09-02
---

# Deploy y Cron

## Qué es

Deploy en Vercel (`vercel.json`). Crons declarados:

| Path | Schedule | Implementación |
|------|----------|----------------|
| `/api/cron/limpiar-reservas` | `*/5 * * * *` | Placeholder |
| `/api/cron/cerrar-rifas-vencidas` | `0 3 * * *` | **Sin route** |
| `/api/cron/revisar-pagos-pendientes` | `0 * * * *` | **Sin route** (pensado para MP) |

Headers de seguridad + maxDuration en reservar/webhook MP (legado).

## Estado

Parcial. Revisar pagos pendientes debe reinterpretarse para flujo manual/pasarela futura, no MP.

## Conexiones

- [[Vercel Cron]] · [[Entidad Reserva]] · [[Brechas Conocidas]] · [[APIs]]

## Archivos

- `vercel.json`
- `app/api/cron/limpiar-reservas/route.ts`

## Ver también

- [[MOC Arquitectura]] · [[Stack Tecnologico]]
