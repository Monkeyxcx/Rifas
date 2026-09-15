---
type: entidad
status: partial
area: dominio
tags: [rifascenter, entidad, perfil]
updated: 2026-09-02
---

# Entidad Perfil

## Qué es

Perfil de usuario (`profiles`), 1:1 con `auth.users`. Campos: `display_name`, `full_name`, `avatar_url`, `phone`, `country`, `bio`, `wallet_balance`, `is_verified`.

## Estado

- Schema + RLS en migraciones.
- UI de [[Ruta Perfil]] aún con datos demo.
- Hook [[Auth y Middleware]] carga perfil vía `useAuthSession`.

## Conexiones

- Crea → [[Entidad Rifa]]
- Hace → [[Entidad Reserva]] · [[Entidad Pago]]
- Puede ser → [[Entidad Ganador]]
- Recibe → [[Entidad Notificacion]]
- [[Usuarios y Roles]] · [[Flujo Auth]]

## Archivos

- `lib/types.ts` → `Perfil`
- `supabase/migrations/0001_init_schema.sql` (tabla `profiles`)
- `hooks/useAuthSession.ts`

## Ver también

- [[MOC Dominio]] · [[Modelo de Datos]]
