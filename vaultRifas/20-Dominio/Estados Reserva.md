---
type: entidad
status: implemented
area: dominio
tags: [rifascenter, estados, reserva]
updated: 2026-09-02
---

# Estados Reserva

## Qué es

| Estado | Significado |
|--------|-------------|
| `reserved` | Hold activo (cuenta regresiva) |
| `paid` | Confirmado pagado |
| `cancelled` | Cancelado por usuario/sistema |
| `expired` | Venció el hold |
| `refunded` | Reembolsado |

## Estado

Tipos + schema listos. Paso `reserved` → `paid` debe resolverse con [[Flujo Confirmacion Pago Manual]] (objetivo) o [[Flujo Checkout Pasarela]] (futuro).

## Conexiones

- [[Entidad Reserva]] · [[Estados Pago]] · [[Flujo Reservar Numeros]]

## Archivos

- `lib/types.ts` → `ReservaStatus`
- `app/api/reservar/route.ts`

## Ver también

- [[MOC Dominio]] · [[Estrategia de Pagos]]
