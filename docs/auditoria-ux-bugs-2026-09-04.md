# 🐛 Reporte de Auditoría UX/Visual — RifasCenter

> Fecha: 2026-09-04 · Auditoría estática sobre el código fuente
> Roles de prueba proporcionados: Creador, Participante, Solidario (todos con contraseña `Prueba123*`)

---

## 📊 Resumen ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| 🔴 CRÍTICO (rompe flujo / no usable) | 5 |
| 🟡 MEDIO (UX pobre / funcionalidad limitada) | 9 |
| 🟢 BAJO (cosmético / mejora) | 6 |
| **Total** | **20** |

---

## 🔴 Bugs Críticos

### 1. Página /rifas — Filtros de búsqueda NO FUNCIONAN (solo son decorativos)
**Ubicación:** [rifas/page.tsx](file:///c:/Github/Rifas/app/(app)/rifas/page.tsx#L166-L262)
**Detalle:** El input de búsqueda (`name="q"`), los Tabs (Todas/Solidarias/Grandes premios), los botones de ordenar (Tendencia/Cierran pronto/Nuevas/Económicas) y el range slider de precio máximo están renderizados como HTML pero **no existe ningún Client Component que implemente la lógica de filtrado/client-side**. El atributo `data-server-prefill` con el JSON inline en la línea 105 no es consumido por ningún componente. **Resultado: el usuario ve los filtros, hace clic y no pasa NADA.**
**Impacto:** Los usuarios no pueden buscar, ordenar ni filtrar rifas. Pérdida total de la funcionalidad de descubrimiento.

---

### 2. Página /rifas/[id] — Layout roto: panel de pago NO se ve al lado del grid de números
**Ubicación:** [rifas/[id]/page.tsx](file:///c:/Github/Rifas/app/(app)/rifas/%5Bid%5D/page.tsx#L137-L521) + [RifaDetailActions.tsx](file:///c:/Github/Rifas/components/rifas/RifaDetailActions.tsx#L105-L267)
**Detalle:** El grid padre es `lg:grid-cols-5` y el TabsContent ocupa `lg:col-span-3`. Dentro del TabsContent "numeros" se renderiza `RifaDetailActions`, que internamente devuelve `<>NumberGrid + <aside className="lg:col-span-2">`. El problema es que **el `<aside>` con `col-span-2` está dentro de un contenedor de 3 columnas**, NO del grid de 5 columnas padre.
**Impacto:** En desktop, la tarjeta de pago "Participa ahora / Tu carrito" se apila **debajo** del grid de números en vez de aparecer a la derecha. El layout de 5 columnas nunca se cumple.

---

### 3. Mobile — No hay menú de navegación ni login (Navbar truncado)
**Ubicación:** [Navbar.tsx](file:///c:/Github/Rifas/components/layout/Navbar.tsx#L30-L41) + [AuthMenu.tsx](file:///c:/Github/Rifas/components/layout/AuthMenu.tsx#L39-L44)
**Detalle:** 
- Nav links: `hidden md:flex` → no visibles < 768px
- Botón AuthMenu (Ingresar / perfil): `hidden sm:inline-flex` → no visible < 640px
- **No existe ningún Sheet/Drawer móvil (menú hamburguesa)**
- El único elemento visible en mobile es el logo + botón "Crear rifa"

**Impacto:** CRÍTICO. En móviles el usuario **no puede iniciar sesión, no puede ver sus rifas y no accede a su menú de usuario**. El flujo completo está roto en responsive.

---

### 4. Mobile — Mis Rifas Creadas: Botones Editar/Preview/Compartir INVISIBLES
**Ubicación:** [mis-rifas/creadas/page.tsx](file:///c:/Github/Rifas/app/(app)/mis-rifas/creadas/page.tsx#L342-L373)
**Detalle:** Las acciones de cada tarjeta están condicionadas a `group-hover:opacity-100 translate-y-0`. En pantallas táctiles (mobile/tablet) **no existe el estado `hover`**, por lo que los botones **nunca aparecen** y el creador no puede editar/compartir su rifa desde esta vista.

---

### 5. Mis Rifas Participando — Link "Continuar pago" roto
**Ubicación:** [mis-rifas/participando/page.tsx](file:///c:/Github/Rifas/app/(app)/mis-rifas/participando/page.tsx#L529-L534)
**Detalle:** El link usa `p.id` que es un ID sintético generado en `loadParticipaciones()`:
```ts
id: `PART-${row.id.slice(0, 8).toUpperCase()}`
```
Pero `/checkout/[reservaId]` valida (o debería validar) que `reservaId` corresponda al ID real de reserva. Además se envía por query string `rifa_id` y `numbers`, pero el `reservaId` incorrecto hará que la validación de `reservas` en el checkout falle y redirija a error.

---

## 🟡 Bugs Medios

### 6. CreatorForm — Editar rifa no conectado al query param
**Ubicación:** [rifas/crear/page.tsx](file:///c:/Github/Rifas/app/(app)/rifas/crear/page.tsx) y [CreatorForm.tsx](file:///c:/Github/Rifas/components/rifas/CreatorForm.tsx#L73)
**Detalle:** `Mis-rifas/creadas` genera links `/rifas/crear?editar=${rifa.id}`, pero la página `crear/page.tsx` es un Server Component que **no lee `searchParams`** y por tanto nunca le pasa `editingId` a `<CreatorForm />`. El componente CreatorForm espera `editingId` por props para cargar los datos, pero siempre es `undefined`.

---

### 7. Footer — 11 enlaces rotos (páginas 404)
**Ubicación:** [Footer.tsx](file:///c:/Github/Rifas/components/layout/Footer.tsx#L8-L29)
**Detalle:** Enlaces que apuntan a rutas no implementadas:
- `/como-funciona`, `/ganadores`
- `/tarifas`, `/soporte`, `/developers`
- `/terminos`, `/privacidad`, `/reembolsos`, `/reglamento`
- `/rifas?solidarias=true` (la URL existe pero el filtro no se aplica, ver bug #1)

**Impacto:** Cualquier usuario que haga clic recibe 404. Mala percepción de producto.

---

### 8. Auth Page — Links a Términos y Privacidad 404 + Banner "ad" tapa contenido
**Ubicación:** [auth/page.tsx](file:///c:/Github/Rifas/app/auth/page.tsx#L282-L297) + [marketing/layout.tsx](file:///c:/Github/Rifas/app/(marketing)/layout.tsx#L17-L28)
**Detalle:** La página `/auth` NO está en ningún route group especial, pero el link del Navbar lleva ahí. Términos apunta a `/legal/terminos` y `/legal/privacidad` que no existen. Además si el layout aplica el banner ad fijo abajo del marketing layout, puede solapar botones.

---

### 9. RifaDetailActions — Usa `alert()` nativo en vez de Sonner toast
**Ubicación:** [RifaDetailActions.tsx](file:///c:/Github/Rifas/components/rifas/RifaDetailActions.tsx#L53-L54) (línea 54, 84-87, 99)
**Detalle:** Tres casos usan la función `alert()` nativa del navegador. El proyecto ya importa y usa `toast` de Sonner en CreatorForm y en otros lugares. Usar `alert()` rompe completamente la identidad visual y es mala UX.
- Línea 54: "Selecciona al menos un número"
- Línea 84-87: Error al reservar 
- Línea 99: Error de conexión

---

### 10. CreatorForm — Sin validación de que sorteo ≥ cierre
**Ubicación:** [CreatorForm.tsx](file:///c:/Github/Rifas/components/rifas/CreatorForm.tsx#L189-L209) (`canContinue` case "fechas")
**Detalle:** La validación `canContinue()` para el step "fechas" solo comprueba que ambas fechas existan y que `draw_instructions` ≥10 chars. **No comprueba que `draw_date_date ≥ ends_at_date`**. El creador puede establecer el sorteo ANTES del cierre de ventas, lo cual no tiene sentido lógico.

---

### 11. CreatorForm — Toggle solidaria sin accesibilidad
**Ubicación:** [CreatorForm.tsx](file:///c:/Github/Rifas/components/rifas/CreatorForm.tsx#L402-L418)
**Detalle:** El switch/toggle de "Rifa solidaria" es un `<button>` custom que no usa `role="switch"`, ni `aria-checked`, ni `aria-label`. Usuarios de screen reader no saben su estado.

---

### 12. Perfil /perfil — Toda la data es HARDCODED (no lee Supabase)
**Ubicación:** [perfil/page.tsx](file:///c:/Github/Rifas/app/(app)/perfil/page.tsx#L43-L68)
**Detalle:** El Server Component define `perfilDemo`, `statsCreador`, `statsParticipante` con valores ficticios. **Nunca consulta `supabase.auth.getUser()` ni la tabla `profiles`**. Por más que el usuario ingrese con `creador@test.com` verá "Usuario Demo RifasCenter", saldo $45.200 fake, bio fake, etc. El botón "Guardar cambios" no tiene handler.

---

### 13. Checkout — Non-null assertion sin guard en fecha
**Ubicación:** [checkout/[reservaId]/page.tsx](file:///c:/Github/Rifas/app/(app)/checkout/%5BreservaId%5D/page.tsx#L378-L382)
**Detalle:** 
```ts
{rifa.ends_at ? endsDate!.toLocaleDateString("es-CO") : "—"}
```
El operador `endsDate!` asume que `endsDate` existe (ya que `rifa.ends_at` existe), pero la variable `endsDate` es `rifa.ends_at ? new Date(rifa.ends_at) : null`. El chequeo es correcto en este caso, pero en la línea 488 `prettyRifaEnds` se usa incondicionalmente y en otros lugares hay riesgo. Si por algún motivo `rifa.ends_at` es string inválido, revienta.

---

### 14. Navbar — Link "Buscar" redundante
**Ubicación:** [Navbar.tsx](file:///c:/Github/Rifas/components/layout/Navbar.tsx#L9)
**Detalle:** El link "Buscar" apunta a `/rifas` exactamente igual que "Rifas activas". No hace focus automático en el input de búsqueda ni tiene comportamiento diferenciado. Es ruido visual.

---

## 🟢 Bugs Bajos / Mejoras visuales

### 15. NumberGrid — Estado "Mine" permite toggle sin feedback
**Ubicación:** [NumberGrid.tsx](file:///c:/Github/Rifas/components/rifas/NumberGrid.tsx#L54-L65)
**Detalle:** Los números marcados como "tuyos" (borde cian) no tienen `disabled`, así que el usuario puede darles clic y cambiar su estado visualmente (se quitan/ponen del badge de "Seleccionados") pero al momento de reservar no tienen efecto (ya están vendidos). Deberían ser `disabled` igual que los "sold", o al menos dar feedback toast.

---

### 16. Página /rifas — Atributo `data-server-prefill` sin uso
**Ubicación:** [rifas/page.tsx](file:///c:/Github/Rifas/app/(app)/rifas/page.tsx#L105)
**Detalle:** Quedó código muerto de un approach anterior. El atributo con JSON stringify inline ocupa bytes en el HTML y no es consumido por nada. Debe eliminarse o implementarse.

---

### 17. Marketing Home — Steps "Cómo funciona" flechas ArrowRight mal ubicadas en breakpoint < lg
**Ubicación:** [(marketing)/page.tsx](file:///c:/Github/Rifas/app/(marketing)/page.tsx#L211-L237)
**Detalle:** La flecha `ArrowRight` con `hidden lg:block` se ve bien en ≥lg pero ya que el grid pasa a 2 cols en md, entre el paso 02 y 03 (que son cols arriba-abajo) la conexión visual desaparece. Es cosmético pero la narrativa 4-pasos sugiere continuidad.

---

### 18. Perfil — Zona peligrosa botón "Cerrar sesión" sin handler
**Ubicación:** [perfil/page.tsx](file:///c:/Github/Rifas/app/(app)/perfil/page.tsx#L266-L269)
**Detalle:** El botón `Cerrar sesión` en el sidebar card "Rápidos" es `<Button variant="ghost">` sin `onClick`. No hace nada. Debería llamar a `signOut()` de `useAuthSession` como en AuthMenu.

---

### 19. CreatorForm — Imagen premio: `<img>` sin `next/image`
**Ubicación:** [CreatorForm.tsx](file:///c:/Github/Rifas/components/rifas/CreatorForm.tsx#L456-L463) y [RifaCard.tsx](file:///c:/Github/Rifas/components/rifas/RifaCard.tsx#L76-L83)
**Detalle:** Usan `<img>` nativo con eslint-disable `@next/next/no-img-element`. Para imágenes externas es aceptable, pero pierden optimización (lazy OK), tamaño adaptable. No bloqueante pero sí una mejora de rendimiento/CLS.

---

### 20. Checkout — ReservaId no validado como UUID
**Ubicación:** [checkout/[reservaId]/page.tsx](file:///c:/Github/Rifas/app/(app)/checkout/%5BreservaId%5D/page.tsx#L86-L87)
**Detalle:** Hay `UUID_RE` y `NUM_RE` pero solo se valida `rifa_id` con UUID_RE. El parámetro `reservaId` de la URL (que debería ser el UUID real de la reserva) no se valida contra la regex, ni se comprueba que pertenece al usuario actual ANTES de buscar rifas por `rifa_id`. Riesgo bajo ya que luego se valida que reservas coincidan.

---

## 🎯 Priorización sugerida (orden de reparación)

1. **#3 Mobile Navbar + Auth** — Sin esto el producto no es usable en mobile en absoluto. Implementar Sheet/Drawer hamburguesa.
2. **#1 Filtros /rifas** — Convertir a Client Component o añadir wrapper que maneje `useSearchParams` + filtrado local.
3. **#2 Layout RifaDetail** — Mover el `<aside>` fuera del TabsContent para que sea hermano directo del grid 5-cols.
4. **#4 Mobile actions overlay** — Quitar dependencia de hover, mostrar siempre los 3 dots o botón fijo en tarjeta móvil.
5. **#7 Footer 404s** — Implementar páginas placeholder o eliminar links inexistentes.
6. **#6 Editar rifa / #5 Continuar pago** — Flujos rotos creador/participante.
7. **#12 Perfil hardcodeado** — Lo primero que ve el usuario tras login debe ser correcto.
8. **#9 RifaDetail alerts → toast** — Identidad visual consistente.
9. Resto medio/bajo.

---

## 🔍 Notas sobre accesibilidad (a11y) adicionales

- **Falta alt text** en muchos emojis usados como íconos decorativos (usar `aria-hidden="true"`).
- **Foco visible**: el `:focus-visible` está definido en globals.css pero inputs/buttons deben mantener el anillo.
- **Contraste**: los badges de "Rifas solidarias" en background gradiente deben tener suficiente contraste texto/fondo.
- **CountdownTimer, CheckoutPaymentButton y AdBannerPlaceholder** no fueron auditados en profundidad (dado que son UI de apoyo).
