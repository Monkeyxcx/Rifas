---
type: integracion
status: partial
area: integraciones
tags: [rifascenter, vercel, cron]
updated: 2026-09-02
---

# Vercel Cron

## Qué es

Jobs programados vía `vercel.json` → rutas `/api/cron/*` protegidas con `CRON_SECRET` (previsto).

## Estado

Solo `limpiar-reservas` existe (placeholder). Otras rutas faltan — [[Deploy y Cron]], [[Brechas Conocidas]].

## Conexiones

- [[Entidad Reserva]] · [[Estados Rifa]] · [[APIs]]

## Archivos

- `vercel.json`
- `app/api/cron/limpiar-reservas/route.ts`

## Ver también

- [[MOC Arquitectura]]
