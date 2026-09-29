---
type: entidad
status: implemented
area: dominio
tags: [rifascenter, estados, rifa]
updated: 2026-09-02
---

# Estados Rifa

## Qué es

Union TypeScript / columna `status` de `rifas`:

| Estado | Significado |
|--------|-------------|
| `draft` | Borrador, no pública |
| `active` | Abierta a reservas |
| `closed` | Cerrada (sin más ventas) |
| `finished` | Sorteo hecho |
| `cancelled` | Anulada |

## Estado

Definido en tipos y schema. Transiciones automáticas (cron cerrar vencidas) declaradas pero route incompleta — [[Deploy y Cron]].

## Conexiones

- [[Entidad Rifa]] · [[Flujo Crear Rifa]] · [[Entidad Ganador]]

## Archivos

- `lib/types.ts` → `RifaStatus`

## Ver también

- [[MOC Dominio]] · [[Estados Reserva]]
