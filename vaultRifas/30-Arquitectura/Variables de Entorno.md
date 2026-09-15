---
type: arquitectura
status: partial
area: arquitectura
tags: [rifascenter, env]
updated: 2026-09-02
---

# Variables de Entorno

## Qué es

Plantilla en `.env.example` → copiar a `.env.local`.

| Grupo | Vars | Notas |
|-------|------|-------|
| App | `NEXT_PUBLIC_SITE_URL`, `APP_NAME`, `APP_ENV` | OK |
| Supabase | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Requerido para auth real |
| MP | `NEXT_PUBLIC_MERCADO_PAGO_*`, `MERCADO_PAGO_*` | **No usar / a retirar** — [[Legado Mercado Pago]] |
| Ads | `NEXT_PUBLIC_ADSENSE_*` | Opcional |
| Mail | `RESEND_API_KEY` | Opcional |
| Cron | `CRON_SECRET` | Proteger crons |

URL/key con `placeholder` activan mock en algunas APIs ([[ADR 0001 Mock Mode]]).

## Estado

Dev posible con placeholders mínimos; login real necesita proyecto Supabase.

## Conexiones

- [[Auth y Middleware]] · [[Deploy y Cron]] · [[Estrategia de Pagos]]

## Archivos

- `.env.example`
- `.env.local` (local, no commit)

## Ver también

- [[MOC Arquitectura]] · [[Brechas Conocidas]]
