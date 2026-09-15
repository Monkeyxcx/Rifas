---
type: arquitectura
status: partial
area: arquitectura
tags: [rifascenter, stack]
updated: 2026-09-02
---

# Stack Tecnologico

## Qué es

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 App Router, React 19, TypeScript |
| UI | Tailwind CSS 3, shadcn/ui, Lucide |
| Backend/DB | Supabase (Postgres, Auth, RLS, Storage previsto) |
| Deploy | Vercel |
| Cron | Vercel Cron |
| Ads | AdSense (planned) + placeholders |

**No** forma parte del stack objetivo: Mercado Pago ([[Legado Mercado Pago]]).

## Estado

Stack base en uso. Pagos: ver [[Capa de Pagos]].

## Conexiones

- [[Mapa de Carpetas]] · [[Supabase]] · [[Deploy y Cron]] · [[AdSense]]

## Archivos

- `package.json`
- `next.config.mjs`
- `vercel.json`

## Ver también

- [[MOC Arquitectura]] · [[Estrategia de Pagos]]
