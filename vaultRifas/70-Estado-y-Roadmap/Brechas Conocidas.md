---
type: estado
status: partial
area: estado
tags: [rifascenter, brechas, deuda]
updated: 2026-09-02
---

# Brechas Conocidas

## Qué es

1. **Env / middleware** — sin `NEXT_PUBLIC_SUPABASE_*` válidos el middleware puede fallar; placeholders limitan auth.
2. **UI sin datos reales** — casi todas las pantallas app usan mock.
3. **Falta [[Flujo Confirmacion Pago Manual]]** — no hay forma de marcar pagado presencialmente.
4. **Deuda [[Legado Mercado Pago]]** — APIs, lib, env, columnas schema, docs legado, headers vercel.
5. **Crons incompletos** — rutas faltantes; “revisar pagos” pensado para MP.
6. **Docs repo vs vault** — `docs/arquitectura-tecnica.md` aún asume MP.

## Conexiones

- [[Estado Actual]] · [[Variables de Entorno]] · [[Deploy y Cron]] · [[Auth y Middleware]]

## Archivos

- `lib/supabase/middleware.ts`
- `vercel.json`
- `docs/arquitectura-tecnica.md`

## Ver también

- [[MOC Estado Actual]] · [[Roadmap Escalabilidad]]
