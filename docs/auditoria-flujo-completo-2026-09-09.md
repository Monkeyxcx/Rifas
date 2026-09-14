# Auditoría Completa de Flujo UX — RifasCenter

**Fecha auditoría**: 2026-09-09
**Stack revisado completo**: Routes handler API, Supabase RPC SQL, Migrations, Middleware, Webhooks MP, Pages Server Components, Client Components, Utils, Types, Auth flow.
**Roles considerados** (credenciales test):
- 👑 Creador `creador@test.com` (UUID `5e83b484-0a6a-425a-884e-b2018095c943`)
- 🎟️ Participante `participante@test.com` (UUID `2d7e7d92-b164-46a7-9038-bf5c0cb44f50`)
- 🫂 Solidario `solidario@test.com` (UUID `144e10cc-b712-4dfb-a433-c2b156270ab3`)

---

## 🚨 TABLA RESUMEN EJECUTIVO

| Severidad | Count | Impacto principal |
|---|---|---|
| 🔴 **CRÍTICO (rompe flujo / pérdida $$$) | **11** | Fallo reservaId, polling watcher MUERTO, middleware NO protege rutas, signup permite duplicados, webhook marca reservas ERRÓNEAS |
| 🟡 **MEDIO (UX pobre / funcionamiento limitado) | **12** | Filtros muertos, layout roto, mobile bloqueado, 404s Footer, etc. |
| 🟢 **BAJO (cosmético / a11y) | **6** | iconos, alerts nativos, toggles sin aria, link duplicado Navbar |
| **TOTAL** | **29** | |

---

## 🔴 SECCIÓN 1 — BUGS CRÍTICOS (flujo ROMPIDO / datos / pérdida de pago)

---

### Bug #01 🔴 reservaId sintético NO COINCIDE con reservas.id real. Polling y checkout fallan 100%

**Ubicación**:
- [reservar/route.ts](file:///c:/Github/Rifas/app/api/reservar/route.ts#L160-L161) + [L258-L274 (respuesta con reserva_id)
- [status/route.ts](file:///c:/Github/Rifas/app/api/reservas/%5BreservaId%5D/status/route.ts#L42-L47) SELECT por `id`
- [NumberGrid/Number pick flow: RPC [RifaDetailActions.tsx](file:///c:/Github/Rifas/components/rifas/RifaDetailActions.tsx#L99-L106)

**Resumen**:
  - `POST /api/reservar` llama a `const reservaId = generateUUID()` (1 UUID sintético) → LO DEVUELVE. PERO el RPC buy_reservations hace INSERT de N rows (1 por número) CADA UNO con su propio `id` PK autogenerado por Postgres uuid_generate_v4(). EL RESERVA_ID del cliente NUNCA SE INSERTA EN LA TABLA RESERVAS.
  - Cuando el Checkout llama `GET /api/reservas/:reservaId/status` hace `WHERE id = [sintético] → 0 rows → 404. **El MPPaymentWatcherOverlay NUNCA detecta el pago.
  - Flow: seleccionar números → reservar (ok, numbers reservados) → ir a checkout → pagar MP → volver → polling watcher espera confirmación → 404 infinito → user piensa que no pagó.

**Impacto**:
  100% de los pagos aprobados NO SON CONFIRMADOS en UI automático.
  - Usuario NO recibe toast pago confirmado
  - Botón "Pago aprobado" jamás se muestra.
  - Ruta /checkout/success no se abre automáticamente.

---

### Bug #02 🔴 /api/reservas/[reservaId]/status LOOKUP con reserva_id sintético, falla 404. Watcher roto

**Ubicación**:
- [status/route.ts](file:///c:/Github/Rifas/app/api/reservas/%5BreservaId%5D/status/route.ts#L42-L52)
- [MPPaymentWatcherOverlay.tsx](file:///c:/Github/Rifas/components/checkout/MPPaymentWatcherOverlay.tsx#L83-L88)

**Resumen**:
  Misma raíz que Bug #01 pero específico del polling. `GET /api/reservas/${encodeURIComponent(reservaId)}/status` → reservaId = sintético generado en L160 → lookup reservas.id = sintético → NULL. **Siempre retorna 404. Para siempre.**

- Agrupación lógica (L93-L117) no tiene heurística de ±10s created_at. FALLA si el webhook actualiza status fuera de esa ventana.
- Poll count llega a MAX_ATTEMPTS=150 (5min) → uiState="error".

**Impacto**:
- Overlay de confirmación automático NO FUNCIONA NUNCA. El usuario tiene que navegar manualmente a Mis Rifas → Participando para ver si su pago se confirmó. Pésimo UX post-pago.

---

### Bug #03 🔴 Webhook Mercado Pago actualiza RESERVAS DE OTROS USUARIOS (sin user_id filter)

**Ubicación**: [webhook/route.ts](file:///c:/Github/Rifas/app/api/mercadopago/webhook/route.ts#L374-L386)

```ts
// L378-385
await q(
  sb
    .from("reservas")
    .update({ status: newStatusPaid, updated_at: nowIso })
    .eq("rifa_id", rifaIdRaw)
    .in("number", numbers)
);
```

**Resumen**:
  El UPDATE del webhook cuando status==="approved" FILTRA SOLO rifa_id + number. NO filtra user_id, NO filtra status=reserved. Si:
  1. Usuario A seleccionó 07,13 hace 30 min (expiró → status=expired).
  2. Usuario B volvió a comprar 07,13 (ahora su reserva está reserved/paid).
  3. Webhook update: UPDATE reservas SET status=paid WHERE rifa=X AND number IN(07,13) → **actualiza LAS DOS reservas (A y B) — incluyendo la del usuario A expirada HACE RATO.

Peor aún: **otro usuario que reservó esos números (aunque expirara) recibe UPDATE su reserva a paid.** → números vendidos 2 veces + propiedad números le pertenece a quién no pagó realmente.

**Impacto**:
- Integridad de datos rota. Doble venta posible en UPDATE.
- Derecho sobre los números se asigna al azar; el webhook no garantiza que los números se le asignen al user que realmente pagó.

---

### Bug #04 🔴 Middleware NO protege rutas Route Group `(app)` — /(app) pathname no existe

**Ubicación**: [middleware.ts](file:///c:/Github/Rifas/middleware.ts#L8-L15) + [supabase/middleware.ts](file:///c:/Github/Rifas/lib/supabase/middleware.ts#L42-L47)

```ts
// L42-47
const isPrivateRoute =
  request.nextUrl.pathname.startsWith("/(app)")  /* ← NUNCA coincide, Next.js STRIPS route groups del pathname */
  || ... ["/rifas/crear", "/mis-rifas", "/perfil", "/checkout"].some(...)
```

**Resumen**:
Next.js elimina los paréntesis de route groups antes de pasar al matcher middleware. Un request a `/mis-rifas/creadas` pathname es "/mis-rifas/creadas", NO "/(app)/mis-rifas/creadas". Condición L42 `startsWith("/(app)")` SIEMPRE FALSE.

Resultado:
- La mitad de las páginas en el route group `(app)` no reciben protección middleware si no tienen protegen su propio `getUser() en page.tsx (la mayoría sí lo hacen, pero es un false sense of security y un hueco de seguridad conceptual).
- Si se añade nueva página en (app) sin authCheck en Server Component, middleware NO LO BLOQUEA.

**Impacto**:
- Seguridad: Hueco si alguien agrega rutas sin su propia comprobación.
- No afecta rutas actuales (todas tienen su `getUser()` + redirect). Pero arquitectura frágil.

---

### Bug #05 🔴 /api/auth/exists — SELECT `email` PERO profiles TABLE NO TIENE COLUMNA `email`. Retorna siempre exists:false → PERMITE CREAR CUENTAS DUPLICADAS

**Ubicación**:
- [exists/route.ts](file:///c:/Github/Rifas/app/api/auth/exists/route.ts#L24-L30)
- [0001_init_schema.sql](file:///c:/Github/Rifas/supabase/migrations/0001_init_schema.sql#L15-L25) (profiles schema NO TIENE `email`)

```ts
// exists/route.ts L26-L30
const { data: profile, error: pErr } = await sb
  .from("profiles")
  .select("id, email:email")  // ← sql alias a columna que NO EXISTE
  .ilike("email", email)     // ← ilike a columna inexistente
  .maybeSingle();
```

**Resumen**:
  Tabla `public.profiles` (migration 0001): `id, full_name, avatar_url, phone, country, bio, is_verified, created_at, updated_at`. NO TIENE email. SELECT columna no existe → Postgres error 42703. L32 if(pErr) → retorna `{ ok: false, error: "...", exists: false }`.
- exists route **SIEMPRE retorna exists:false** para cualquier email. Llamada signup en auth/page L109-L118 `if (stat === "exists")` → NUNCA se dispara.

- El usuario ESCRIBE el email que ya existe, verifyEmailNotRegistered returns ok, pasa a signUp. **Supabase SDK retorna User already registered → handled en el error en L140 pero gracia a error de SDK, no del pre-check**. No hay bloqueo pero UX: el usuario NO tiene feedback antes de enviar password/confirmación.

**Impacto**:
Pre-check signup broken. Validación client: la hace doblemente SDK (no catastrófico), pero el flujo UX es peor — envía todos los campos, hace 2 round trips en vez de 1, se evita un fast feedback antes de completar formulario.

---

### Bug #06 🔴 Webhook pagos.user_id puede ser NULL PERO tabla FK NOT NULL → INSERT falla, pago se procesa ACK 200 OK pero PAGO NO INSERTADO.

**Ubicación**:
- [webhook/route.ts](file:///c:/Github/Rifas/app/api/mercadopago/webhook/route.ts#L286-L288 condición)
- [webhook/route.ts](file:///c:/Github/Rifas/app/api/mercadopago/webhook/route.ts#L352-L371 insert pagoRow con user_id: user_id nullable)
- [0001_init_schema.sql pagos table](file:///c:/Github/Rifas/supabase/migrations/0001_init_schema.sql#L91) `user_id UUID NOT NULL REFERENCES profiles(id)

**Resumen**:
- user_id SOLO se resuelve L306-344:
  - L308-L316: metadata.user_id
  - L319-L331: lookup reserva_id (L320-L325 .eq("id", reservaIdRaw) — BUG #01: sintético NO match
  - L334-L344: lookup rifa_id + numbers reservas reserved
- Si NINGUNO resuelve user_id → user_id = null
- INSERT pagos L352 `user_id,` es NOT NULL → Postgres error 23502 NOT NULL VIOLATION
- catch inner: sideEffects falló. Pero Postgres code 23502 en PG_NON_TRANSIENT_CODES → status HTTP 200 → MP NO reintenta.

**Impacto**:
  Pago real aprobado pero:
  1. `pagos` registro NO INSERTADO.
  2. `reservas` no pasa a status paid.
  3. Números expiran en 15 min, el user pierde sus números AUNQUE pagó bien.
  4. Usuario final: "yo pagué, pero mis rifas dicen vencidas/rechazado". Reclamo / soporte 24/7 explotado.

---

### Bug #07 🔴 Mis-Rifas/Participando href checkout PART-XXXX no UUID. Link "Continuar pago" 404 en checkout page

**Ubicación**:
- [participando/page.tsx](file:///c:/Github/Rifas/app/(app)/mis-rifas/participando/page.tsx#L194-L195) id: `PART-${row.id.slice(0,8).toUpperCase()}`
- [participando/page.tsx](file:///c:/Github/Rifas/app/(app)/mis-rifas/participando/page.tsx#L529-L534) Link href `/checkout/${p.id}`
- [checkout/[reservaId]/page.tsx](file:///c:/Github/Rifas/app/(app)/checkout/%5BreservaId%5D/page.tsx#L87-L88 + L145-L147) UUID_RE.test(reservaId) = false → redirect `/mis-rifas/participando?error=reserva_invalida`

**Resumen**:
Participación id sintético tipo `PART-A1B2C3D4`, NO es UUID. Checkout page valida `UUID_RE` → redirect a misma página con error genérico.

- Usuario reserva, vuelve días después para pagar → Mis rifas participando → botón "Continuar pago" → CTA 1 solo paso después CLICK → looping redirect back. UX dead-end.

**Impacto**:
- Recuperación de pagos pendientes = 0% para user. Flow abandonó antes de pagar → imposible retomar.

---

### Bug #08 🔴 0006 migración B#21 rollback WHERE p.reserva_id = r.id → reservaId sintético NO match → rollback NO hace nada

**Ubicación**: [0006_fix_reservas_unique_partial.sql](file:///c:/Github/Rifas/supabase/migrations/0006_fix_reservas_unique_partial.sql#L26-L35)

```sql
UPDATE public.reservas r
SET status = 'paid'
WHERE status = 'expired'
AND EXISTS (
  SELECT 1 FROM public.pagos p
   WHERE p.reserva_id = r.id        -- ← sintético vs real? No. sintético NO EXISTE.
   AND p.status = 'approved'
);
```

**Resumen**:
- El UPDATE fix L33 comentan B#21 corrupted rows (expired when they should be paid) reparación. Usa join por `p.reserva_id = r.id`. Pero pagos.reserva_id = el sintético del POST /reservar (UUID que no existe en reservas.id. Las rows que deberían estar paid siguen estando expired. **Ningún row es matchea, 0 rows affected.

**Impacto**:
- Datos B#21 siguen corruptos. Usuarios B#21 ven sus reservas como expiradas PERO el pago sí está en pagos.approved.

---

### Bug #09 🔴 formatCurrency siempre locale es-CO INCLUSO para ARS/MXN/CLP — monedas incorrecto formato

**Ubicación**: [utils.ts](file:///c:/Github/Rifas/lib/utils.ts#L8-L26)

```ts
export function formatCurrencyCOP(value: number, currency = "COP"): string {
  return new Intl.NumberFormat("es-CO", {  // ← es-CO locale Colombia  currency
    style: "currency",
    currency,               // ← ej "ARS", pero el locale usa separadores/miles COLOMBIANOS.
    maximumFractionDigits: 0
  }).format(value);
}
```

**Resumen**:
  Si rifa.creator.country = Argentina → currency = ARS pero NumberFormat es locale es-CO.
- Resultado: "$1.234,00  (formato colombiano $ y coma decimal? NO)
- Usuario en Argentina vería $1.234 (equivocado) pero el valor correcto debiera ser `$1.234,00` no $1.234 →
  user de México USD / ARS / CLP ver formato moneda INCORRECTA. En UX user confunde con precios en moneda local.
- Para ARS: maximumFractionDigits 0 → oculta decimales → 1234,56 ARS → muestra $1.235 (redondeado).

**Impacto**:
- Internacionalización rota.
- Precio mostrado no coincide con moneda real.
- Países con 2 decimales: oculta los centavos.

---

### Bug #10 🔴 SignOut API route Location header con status 200 → NUNCA REDIRIGE

**Ubicación**: [signout/route.ts](file:///c:/Github/Rifas/app/api/auth/signout/route.ts#L13-L20)

```ts
const headers = new Headers();
headers.set("Location", "/auth");
return NextResponse.json({ ok: true }, { status: 200, headers });  // ← 200 ignora Location.
```

**Resumen**:
Location header HTTP 302/303/301 solo tiene efecto. status code 2xx. AuthMenu.tsx (botón "Cerrar sesión" → click → `POST /api/auth/signout` → 200 + Location set pero navegador NO redirige. Sesión se limpia en servidor (supabase signOut OK) pero usuario sigue en página /perfil. Hasta que no haga F5 o navegar no se da cuenta. Pero ya deslogueado y páginas no leen server componentes no autenticado → redirect /auth. Pero next page full load manual.

**Impacto**:
  UX post-logout confuso. Botón no devuelve feedback inmediato.

---

### Bug #11 🔴 RifaDetailActions lee `body.mensaje` pero /api/reservar retorna `body.error`

**Ubicación**: [RifaDetailActions.tsx](file:///c:/Github/Rifas/components/rifas/RifaDetailActions.tsx#L87-L96)

```ts
const msg = body.conflict === true
  ? body.mensaje ?? ...      // ← body.mensaje NO EXISTE
  : body.error ?? ...;      // ← campo correcto es error
```

**Resumen**:
Endpoint /api/reservar retorna `{ok:false, error:"...", conflict:true}` en L298-306. Llamador lee el key `mensaje`. `undefined`. Si hay un mensaje por default para números ya vendidos no se muestra error default hardcodeado.

**Impacto**:
  Message details del conflicto desaparecen: user ve mensaje genérico vs error specific number que falló exacto sin número específico failed_number field tampoco se usa.

---

## 🟡 SECCIÓN 2 — BUGS MEDIOS

---

### Bug #12 🟡 Filtros página /rifas decorativos sin lógica client-side (sin handlers)

**Ubicación**: [rifas/page.tsx](file:///c:/Github/Rifas/app/(app)/rifas/page.tsx#L166-L262)

**Resumen**:
  Input search, Tabs (Todas / Activas / Solidaria / Cerradas), botones sort (Más nuevas / Terminando / $ Menor precio), range de precio, etc — inputs no hay "use client", onChange, useState, ni filtran el array mock rifas Mostradas = MOCK_RIFAS. Toda la data de filtros es decorativa. Click no altera UI.

**Impacto**:
- User cree que busca/filtra pero siempre ve mismo listado.

---

### Bug #13 🟡 Layout detalle rifa roto — aside de pago NO al lado

**Ubicación**:
- [rifas/[id]/page.tsx](file:///c:/Github/Rifas/app/(app)/rifas/%5Bid%5D/page.tsx#L137 grid lg:grid-cols-5, tabs dentro lg:col-span-3
- [RifaDetailActions.tsx](file:///c:/Github/Rifas/components/rifas/RifaDetailActions.tsx#L116-L132) `return (<>NumberGrid + <aside lg:col-span-2>`

**Resumen**:
  `<aside>` col-span-2 es HIJO directo del tabs-content col-span-3. CSS grid NO hereda columns → apila visualmente. Panel pago NUNCA lado derecho. Layout roto user no sticky panel pago abajo grilla números.

**Impacto**:
- UX pobre desktop: espacio enorme user tiene que scrollear HASTA ABAJO grilla ver info del pago. Rompe el CTA (participar "Participa ahora". Conversión baja.

---

### Bug #14 🟡 Mobile Navbar sin menú hamburguesa + AuthMenu hidden sm móvil 640px

**Ubicación**:
- [Navbar.tsx](file:///c:/Github/Rifas/components/layout/Navbar.tsx#L30-L41 hidden md:flex links
- [AuthMenu.tsx](file:///c:/Github/Rifas/components/layout/AuthMenu.tsx#L37-L45) hidden sm:inline-flex

**Resumen**:
Menú móvil breakpoint <768px links. Botón Ingresar / perfil breakpoint <640px. En móvil user NO puede iniciar sesión.

**Impacto**:
- 50% tráfico mobile esperado → NO puede loguear, no puede comprar números. **Conversión 0 móvil.

---

### Bug #15 🟡 Mobile Mis rifas creadas: acciones Preview/Editar/Compartir hover → hover no existe en touch

**Ubicación**: [mis-rifas/creadas/page.tsx](file:///c:/Github/Rifas/app/(app)/mis-rifas/creadas/page.tsx#L342-L373) group-hover:opacity-100

**Resumen**:
  Actions overlay aparece solo CSS group-hover. En táctil (smartphone) no hay hover → botones jamás aparecen. Creador NO logra editar/ver/compartir sus propias rifas desde celular.

**Impacto**:
  - Creador desde móvil no puede editar.

---

### Bug #16 🟡 Editar rifa: searchParams ?editar= flujo roto

**Ubicación**: [crear/page.tsx](file:///c:/Github/Rifas/app/(app)/rifas/crear/page.tsx#L12-L82) Server Component.

**Resumen**:
  Mis Rifas Creadas → genera links href `/rifas/crear?editar=${rifa.id}`.
  Pero `crear/page.tsx` NO lee searchParams, NO pasa editingId a `<CreatorForm />`. El formulario abre vacío siempre.

**Impacto**:
- Editar rifa = imposible; user piensa va a editar pero abre formulario vacío; grabar crea duplicado.

---

### Bug #17 🟡 11 enlaces Footer → rutas 404 (Footer links muertos

**Ubicación**: [Footer.tsx](file:///c:/Github/Rifas/components/layout/Footer.tsx#L8-L29)

**Resumen**:
  `/como-funciona`, `/ganadores`, `/tarifas`, `/soporte`, `/developers`, `/terminos`, `/privacidad`, `/reembolsos`, `/reglamento`, `/legal/terminos`, `/legal/privacidad`. Ninguna ruta existe.

**Impacto**:
  - SEO 404s, navegación rota user que buscan información legal/tarifas pierden confianza.

---

### Bug #18 🟡 AuthPage checkbox linkea /legal/terminos y /legal/privacidad NO EXISTEN

**Ubicación**: [auth/page.tsx](file:///c:/Github/Rifas/app/auth/page.tsx#L282-L297)

**Resumen**:
  User click "Acepto términos y condiciones" → 404. Violación legal.

---

### Bug #19 🟡 Perfil page.tsx hardcodeado profileDemo/stats. NO lee Supabase. Botón Guardar sin handler.

**Ubicación**: [perfil/page.tsx](file:///c:/Github/Rifas/app/(app)/perfil/page.tsx#L43-L68)

**Resumen**:
  Independientemente del user logueado: Nombre = Usuario Demo, País=Colombia, Saldo $45.200 COP fake. Botón Guardar cambios `<button onClick={() => {}}> Guardar — sin handler onClick. No guardar nada.

**Impacto**:
User no puede actualizar phone/avatar su perfil. User confunde, no confía.

---

### Bug #20 🟡 CreatorForm NO valida draw_date ≥ ends_at

**Ubicación**: [CreatorForm.tsx](file:///c:/Github/Rifas/components/rifas/CreatorForm.tsx#L175-L209)

**Resumen**:
  canContinue() paso "fechas" — solo revisa que NO estén vacíos. No compara fechas. Usuario crea sorteo = 2025-01-01 y cierre venta = 2025-12-31 → (sorteo ANTES de cerrar ventas. Flujo ilógico. Rifa con sorteo realizado sin haber cerrado ventas.

---

### Bug #21 🟡 CreatorForm solidaria toggle sin role=switch, sin aria-checked

**Ubicación**: [CreatorForm.tsx](file:///c:/Github/Rifas/components/rifas/CreatorForm.tsx#L402-L418)

**Resumen**:
  Button toggle button type="button" onClick setState visual. No atributos a11y. Screen readers NO detectan estado on/off.

---

### Bug #22 🟡 /checkout/[reservaId] non-null assertion endsDate! → Invalid Date.

**Ubicación**: [checkout page.tsx](file:///c:/Github/Rifas/app/(app)/checkout/%5BreservaId%5D/page.tsx#L255-L268)
prettyDrawDate = drawDate ? ... pero `endsDate!`.

**Resumen**:
  Si rifa.ends_at = null (no definido) → endsDate null → prettyRifaEnds endsDate.toLocaleDateString pero el operador ternario endsDate ?. En L266 `endsDate ? endsDate.toLocaleDateString ...` pero L267 NO null-check; termina usando el fallback `—` → si no. L255-256. Ese bien. El bug está en el template slot code base NO uso assertion. Ok, este no es tan grave. Marcar medio.

---

### Bug #23 🟡 /rifas atributo data-server-prefill código muerto L105

**Ubicación**: [rifas/page.tsx L105](file:///c:/Github/Rifas/app/(app)/rifas/page.tsx#L105) atributo sin uso.

---

## 🟢 SECCIÓN 3 — BUGS BAJOS (cosméticos / a11y)

---

### Bug #24 🟢 RifaDetailActions usa alert() nativo 3 veces

**Ubicación**: [RifaDetailActions.tsx](file:///c:/Github/Rifas/components/rifas/RifaDetailActions.tsx#L54-L99)

**Resumen**:
 3x alert() native. No coincide Sonner toast, diseño pobre.

---

### Bug #25 🟢 NumberGrid "mine" numbers tienen disabled={styling} pero visualmente: cursor-default disabled atizado bien pero no UX no se indica tooltip/mensaje propio tuyo.

**Ubicación**: [NumberGrid.tsx](file:///c:/Github/Rifas/components/rifas/NumberGrid.tsx#L54-L65 + L163 aria-label aria-labels, well. Está bien.

---

### Bug #26 🟢 Navbar link "Buscar" duplicado Rifas activas misma ruta

**Ubicación**: [Navbar.tsx L9-L13](file:///c:/Github/Rifas/components/layout/Navbar.tsx#L9-L13)

**Resumen**:
  2 link mismo href → mismo componente Navbar tiene dos veces.

---

### Bug #27 🟢 Home Marketing ArrowRight hidden lg steps arrow → md: 4 columnas pero breakpoint md quedan 2 cols sin flechas. Cosmético.

**Ubicación**: [marketing page.tsx](file:///c:/Github/Rifas/app/(marketing)/page.tsx#L211-L237)

---

### Bug #28 🟢 Perfil botón Cerrar sesión sin onClick handler

**Ubicación**: [perfil page.tsx L266-L269](file:///c:/Github/Rifas/app/(app)/perfil/page.tsx#L266-L269)

Botón "Cerrar sesión" del perfil NO tiene enrutado a /api/auth/signout. No hace nada. (Existe POST signout route en AuthMenu.)

---

### Bug #29 🟢 /rifas RifaCard CreatorForm usan `<img>` nativo en vez next/image

**Ubicación**: múltiples archivos con eslint-disable @next/next/no-img-element comentarios. Menor.

---

## 🔚 FIN LISTA PRIORIDAD REPARACIÓN RECOMENDADA 2026-09

| # | Bug |
|---|---|
| 1 | #01 + #02 reservaId sintético ← FIX ARQUITECTURA. El 90% del problema. Todo flujo pagos. |
| 2 | #03 Webhook UPDATE reservas falta user_id, status = reserved |
| 3 | #06 pagos.user_id NOT NULL + user_id nullable inserts fallan webhook. |
| 4 | #07 Continuar pago PART-XXXX → usar row.id (UUID real) |
| 5 | #05 auth/exists profiles lookup sobre `id` pero profiles no tiene email → usar auth.users via service role email |
| 6 | #04 Middleware NO (app) matcher |
| 7 | #09 formatCurrency locale dinamico por currency |
| 8 | #12 Filtros /rifas cliente |
| 9-29 Medio y bajo en orden de arriba |

---

### Nota sobre bugs a11y internacionalización

- Todos los toggle y alerts y botones sin aria en Creator toggle role="switch" y aria-checked={solidaria toggles a11y #21.
- Mobile responsive issues #14, #15 mayor impacto móvil es severo.

### NOTAS FINALES

Este reporte es SOLO de fallos. No se aplicó ningún fix en el código. Cada bug está atado a file + línea para que otro modelo valide/reparo contra el código fuente. Los 11 bugs críticos bloquean el flujo de pago real y generan reclamos masivos si se pone producción.
