---
type: entidad
status: planned
area: dominio
tags: [rifascenter, entidad, ganador]
updated: 2026-09-02
---

# Entidad Ganador

## Qué es

Resultado del sorteo: número ganador, método, prueba (`draw_proof`), entrega del premio.

## Estado

- Schema presente.
- UI/flujo de sorteo y publicación de ganador: **planificado / no cableado** en la app activa.

## Conexiones

- [[Entidad Rifa]] · [[Entidad Perfil]]
- [[Estados Rifa]] (`finished`)

## Archivos

- `lib/types.ts` → `Ganador`
- `supabase/migrations/0001_init_schema.sql`

## Ver también

- [[MOC Dominio]] · [[Roadmap Escalabilidad]]
