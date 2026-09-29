---
type: flujo
status: mock
area: flujos
tags: [rifascenter, flujo, crear-rifa]
updated: 2026-09-02
---

# Flujo Crear Rifa

## Qué es

1. Auth requerida (`/rifas/crear`).
2. [[Componentes Clave]] `CreatorForm` multi-step (premio vs solidaria).
3. Hoy: guarda en modo borrador **mock** (toast); no persiste en Supabase.
4. Objetivo: insert en `rifas` status `draft`/`active`.

## Estado

`mock` en UI. Schema listo.

## Conexiones

- [[Entidad Rifa]] · [[Estados Rifa]] · [[Ruta Crear Rifa]] · [[ADR 0002 Limite 10-100 numeros]]

## Archivos

- `app/(app)/rifas/crear/page.tsx`
- `components/rifas/CreatorForm.tsx`

## Ver también

- [[MOC Flujos]]
