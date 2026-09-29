---
type: entidad
status: partial
area: dominio
tags: [rifascenter, entidad, rifa]
updated: 2026-09-02
---

# Entidad Rifa

## Qué es

Sorteo digital: premio comercial o causa solidaria (`is_solidarity`). Incluye precio por número, total/disponibles, fechas, instrucciones de sorteo. Estados: [[Estados Rifa]].

Límite de producto: **10–100** números ([[ADR 0002 Limite 10-100 numeros]]).

## Estado

- Schema SQL listo.
- Listado/detalle/crear en UI con [[Componentes Clave]] / `MOCK_RIFAS` (mock).
- Persistencia real pendiente de cablear a [[Supabase]].

## Conexiones

- Creator → [[Entidad Perfil]]
- Tiene → [[Entidad Reserva]] · [[Entidad Pago]] · [[Entidad Ganador]]
- [[Flujo Crear Rifa]] · [[Ruta Rifas]] · [[Ruta Rifa Detalle]]

## Archivos

- `lib/types.ts` → `Rifa`, `RifaStats`
- `components/rifas/MOCK_RIFAS.ts`
- `supabase/migrations/0001_init_schema.sql`

## Ver también

- [[MOC Dominio]] · [[Modelo de Datos]]
