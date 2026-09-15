---
type: producto
status: partial
area: producto
tags: [rifascenter, roles, auth]
updated: 2026-09-02
---

# Usuarios y Roles

## Qué es

No hay roles globales rígidos: cualquier usuario autenticado puede **crear** rifas y/o **participar**. El rol es dinámico por rifa (`creator_id` vs comprador en [[Entidad Reserva]]).

## Estado

- Auth UI + sesión vía [[Supabase]] / [[Auth y Middleware]].
- Perfil en tabla `profiles` ([[Entidad Perfil]]); trigger `handle_new_user` en migraciones.
- Rutas privadas redirigen a `/auth` sin sesión.

## Conexiones

- [[Entidad Perfil]] · [[Flujo Auth]] · [[Ruta Perfil]]
- [[Ruta Mis Rifas Creadas]] · [[Ruta Mis Rifas Participando]]

## Archivos

- `hooks/useAuthSession.ts`
- `app/auth/page.tsx`
- `supabase/migrations/0001_init_schema.sql`

## Ver también

- [[MOC Producto]] · [[Vision RifasCenter]]
