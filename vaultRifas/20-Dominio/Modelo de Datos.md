---
type: entidad
status: partial
area: dominio
tags: [rifascenter, modelo, erd]
updated: 2026-09-02
---

# Modelo de Datos

## Qué es

Modelo relacional Postgres (Supabase) detrás del dominio.

```mermaid
erDiagram
  Perfil ||--o{ Rifa : crea
  Perfil ||--o{ Reserva : hace
  Perfil ||--o{ Pago : paga
  Rifa ||--o{ Reserva : tiene
  Rifa ||--o{ Pago : referencia
  Reserva ||--o| Pago : confirma
  Rifa ||--o| Ganador : sortea
  Perfil ||--o| Ganador : gana
  Perfil ||--o{ Notificacion : recibe
```

## Estado

Migraciones `0001`–`0003` + seed. UI aún mock. Campos MP en `pagos` = deuda respecto a [[Estrategia de Pagos]].

## Conexiones

- [[Entidad Perfil]] · [[Entidad Rifa]] · [[Entidad Reserva]]
- [[Entidad Pago]] · [[Entidad Ganador]] · [[Entidad Notificacion]]
- [[Supabase]] · [[Clientes Supabase]]

## Archivos

- `lib/types.ts`
- `types/supabase.ts`
- `supabase/migrations/*.sql`
- `supabase/seed.sql`

## Ver también

- [[MOC Dominio]] · [[Home]]
