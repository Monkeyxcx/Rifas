---
type: arquitectura
status: implemented
area: arquitectura
tags: [rifascenter, carpetas]
updated: 2026-09-02
---

# Mapa de Carpetas

## Qué es

| Path | Rol |
|------|-----|
| `app/` | Rutas App Router + API |
| `components/` | UI (rifas, layout, checkout, ads, ui) |
| `lib/` | Tipos, utils, supabase, **mercadopago (legado)** |
| `hooks/` | `useAuthSession` |
| `types/` | Stub `Database` Supabase |
| `supabase/` | Migraciones, seed, config |
| `docs/` | Docs legado (MD del repo) |
| `vaultRifas/` | Este vault Obsidian |
| `public/` | Estáticos |

## Estado

Estructura estable. Marcar como legado: `lib/mercadopago.ts`, `app/api/mercadopago/*`.

## Conexiones

- [[APIs]] · [[Componentes Clave]] · [[Clientes Supabase]] · [[Legado Mercado Pago]]

## Archivos

- Raíz del repo `project-rifas`

## Ver también

- [[MOC Arquitectura]] · [[Stack Tecnologico]]
