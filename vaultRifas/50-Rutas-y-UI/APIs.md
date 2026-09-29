---
type: ruta
status: partial
area: ui
tags: [rifascenter, apis]
updated: 2026-09-02
---

# APIs

## Qué es

| Método / Path | Rol | Status |
|---------------|-----|--------|
| `GET /api/auth/callback` | OAuth/session | partial |
| `POST /api/reservar` | Hold números | partial + mock |
| `GET /api/cron/limpiar-reservas` | Expirar holds | placeholder |
| `POST /api/mercadopago/create-preference` | Preference MP | **deprecated** |
| `POST /api/mercadopago/webhook` | Webhook MP | **deprecated** |
| `/api/cron/cerrar-rifas-vencidas` | Cerrar rifas | missing |
| `/api/cron/revisar-pagos-pendientes` | Revisar pagos | missing (era MP) |
| (futuro) confirmar pago manual | Organizador | planned |

## Estado

Activas útiles: auth callback, reservar. MP = [[Legado Mercado Pago]].

## Conexiones

- [[Flujo Reservar Numeros]] · [[Deploy y Cron]] · [[Flujo Confirmacion Pago Manual]]

## Archivos

- `app/api/**/route.ts`

## Ver también

- [[MOC Flujos]] · [[MOC Arquitectura]]
