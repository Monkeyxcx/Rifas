---
type: adr
status: implemented
area: decisiones
tags: [rifascenter, adr, mock]
updated: 2026-09-02
---

# ADR 0001 Mock Mode

## Contexto

Equipo necesita ver UI y probar APIs sin proyecto Supabase/pasarela listos.

## Decisión

Si `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` faltan o contienen `placeholder`, APIs como `/api/reservar` caen a **mock mode** (demo user, respuestas fake). UI usa `MOCK_RIFAS`.

## Consecuencias

- Dev frontend desbloqueado.
- Riesgo de confundir mock con producción; middleware aún exige vars presentes.
- Ver [[Variables de Entorno]] · [[Brechas Conocidas]].

## Conexiones

- [[Estado Actual]] · [[Flujo Reservar Numeros]] · [[APIs]]

## Archivos

- `app/api/reservar/route.ts` → `isMockMode()`
- `components/rifas/MOCK_RIFAS.ts`

## Ver también

- [[MOC Estado Actual]] · [[Plantilla ADR]]
