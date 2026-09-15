---
type: producto
status: planned
area: producto
tags: [rifascenter, monetizacion, ads]
updated: 2026-09-02
---

# Monetizacion

## Qué es

Ingresos previstos:

1. **Anuncios** no intrusivos (banner / native) — [[AdSense]]
2. **Comisiones** futuras por transacción (cuando exista pasarela)

Los cobros de números de rifa **no** están acoplados a una pasarela fija — ver [[Capa de Pagos]] y [[Estrategia de Pagos]].

## Estado

- Placeholders de ads en UI.
- Comisiones: no implementadas.
- Docs legado hablan de MP desde día 1 — **obsoleto** respecto a [[ADR 0003 Pagos sin Mercado Pago]].

## Conexiones

- [[AdSense]] · [[Estrategia de Pagos]] · [[Entidad Pago]]

## Archivos

- `components/ads/AdBannerPlaceholder.tsx`
- `.env.example` (`NEXT_PUBLIC_ADSENSE_*`)

## Ver también

- [[MOC Producto]] · [[Roadmap Escalabilidad]]
