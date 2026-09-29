---
type: estado
status: partial
area: estado
tags: [rifascenter, estado]
updated: 2026-09-02
---

# Estado Actual

## Qué es

Snapshot del producto (2026-09-02).

| Área | Status | Notas |
|------|--------|-------|
| UI marketing | implemented | `/` |
| Listado/detalle/crear rifas | mock | `MOCK_RIFAS` / CreatorForm |
| Perfil / mis-rifas / checkout UI | mock | datos demo |
| Auth UI + middleware | partial | necesita Supabase real |
| Schema SQL + RLS | implemented | migraciones 0001–0003 |
| API reservar | partial | mock si placeholder |
| Confirmación pago manual | planned | objetivo corto plazo |
| Pasarela online | planned | ePayco / Wompi / Stripe |
| Mercado Pago | deprecated | código presente, no objetivo |
| Crons | partial | 1 placeholder, 2 missing |
| Ads / notificaciones | planned | placeholders / tabla |

## Conexiones

- [[Brechas Conocidas]] · [[Roadmap Escalabilidad]] · [[Estrategia de Pagos]]
- [[ADR 0001 Mock Mode]] · [[ADR 0003 Pagos sin Mercado Pago]]

## Archivos

- Repo completo; vault `vaultRifas/`

## Ver también

- [[MOC Estado Actual]] · [[Home]]
