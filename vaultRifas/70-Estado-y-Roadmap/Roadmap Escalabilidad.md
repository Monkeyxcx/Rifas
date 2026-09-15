---
type: estado
status: planned
area: estado
tags: [rifascenter, roadmap]
updated: 2026-09-02
---

# Roadmap Escalabilidad

## Qué es

Orden sugerido para crecer sin romper el dominio:

1. Conectar [[Supabase]] real + cablear listados/crear a DB.
2. Implementar [[Flujo Confirmacion Pago Manual]] / [[Pagos Presenciales]].
3. Expiración de reservas vía [[Vercel Cron]] real.
4. Elegir pasarela ([[Candidato ePayco]] / [[Candidato Wompi]] / [[Candidato Stripe]]) + [[Capa de Pagos]].
5. Limpiar [[Legado Mercado Pago]] (código + schema columns + docs).
6. Sorteo / [[Entidad Ganador]] + [[Notificaciones]].
7. [[AdSense]] + comisiones ([[Monetizacion]]).
8. Multi-país, Storage imágenes, edge functions, observabilidad.

## Estado

Roadmap de vault — no es backlog Linear/GitHub automático.

## Conexiones

- [[Estado Actual]] · [[Brechas Conocidas]] · [[Estrategia de Pagos]] · [[ADR 0003 Pagos sin Mercado Pago]]

## Archivos

- Este vault

## Ver también

- [[MOC Estado Actual]] · [[Como Actualizar este Vault]]
