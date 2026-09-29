---
type: flujo
status: partial
area: flujos
tags: [rifascenter, flujo, auth]
updated: 2026-09-02
---

# Flujo Auth

## Qué es

1. Usuario llega a `/auth` (opcional `redirectTo`, `mode`).
2. Supabase Auth UI (email / OAuth).
3. Callback `/api/auth/callback` establece sesión.
4. Middleware mantiene cookies; rutas privadas sin user → redirect auth.
5. `useAuthSession` carga perfil.

## Estado

Parcial: UI lista; requiere [[Supabase]] real. Mock env no autentica de verdad.

## Conexiones

- [[Auth y Middleware]] · [[Ruta Auth]] · [[Entidad Perfil]] · [[Usuarios y Roles]]

## Archivos

- `app/auth/page.tsx`
- `app/api/auth/callback/route.ts`
- `hooks/useAuthSession.ts`

## Ver también

- [[MOC Flujos]]
