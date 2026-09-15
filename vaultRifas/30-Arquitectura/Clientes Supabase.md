---
type: arquitectura
status: implemented
area: arquitectura
tags: [rifascenter, supabase, clients]
updated: 2026-09-02
---

# Clientes Supabase

## Qué es

Tres clients SSR:

| Módulo | Uso |
|--------|-----|
| `lib/supabase/client.ts` | Browser |
| `lib/supabase/server.ts` | Server Components / Route Handlers |
| `lib/supabase/middleware.ts` | Edge middleware cookies |

Todos leen `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Estado

Implementados. Tipado `Database` en `types/supabase.ts` (stub).

## Conexiones

- [[Supabase]] · [[Auth y Middleware]] · [[Variables de Entorno]] · [[Modelo de Datos]]

## Archivos

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `types/supabase.ts`

## Ver también

- [[MOC Arquitectura]]
