---
type: entidad
status: planned
area: dominio
tags: [rifascenter, entidad, notificacion]
updated: 2026-09-02
---

# Entidad Notificacion

## Qué es

Aviso in-app (y futuro email) a un usuario, opcionalmente ligado a una rifa: `type`, `title`, `message`, `action_url`, `read_at`.

## Estado

- Tabla en schema.
- Integración UI / envío: [[Notificaciones]] planned.
- `RESEND_API_KEY` en env example (opcional).

## Conexiones

- [[Entidad Perfil]] · [[Entidad Rifa]]
- [[Notificaciones]] · [[Deploy y Cron]]

## Archivos

- `lib/types.ts` → `Notificacion`
- `supabase/migrations/0001_init_schema.sql`

## Ver también

- [[MOC Dominio]] · [[MOC Arquitectura]]
