---
type: arquitectura
status: partial
area: arquitectura
tags: [rifascenter, auth, middleware]
updated: 2026-09-02
---

# Auth y Middleware

## Qué es

`middleware.ts` delega en `updateSession` (Supabase SSR): refresca sesión y redirige a `/auth` rutas privadas aproximadas: `/rifas/crear`, `/mis-rifas`, `/perfil`, `/checkout`.

Auth UI en `/auth` (email + Google previsto). Callback: `/api/auth/callback`.

## Estado

Funcional si hay credenciales Supabase válidas. Sin env / placeholders: riesgo de fallos en middleware ([[Brechas Conocidas]], [[ADR 0001 Mock Mode]]).

## Conexiones

- [[Clientes Supabase]] · [[Flujo Auth]] · [[Usuarios y Roles]] · [[Variables de Entorno]]

## Archivos

- `middleware.ts`
- `lib/supabase/middleware.ts`
- `app/auth/page.tsx`
- `app/api/auth/callback/route.ts`
- `hooks/useAuthSession.ts`

## Ver también

- [[MOC Arquitectura]] · [[Ruta Auth]]
