---
name: Minimal UI
description: Detecta y elimina información repetida dentro de una misma pantalla (mismo dato en 2+ lugares). Úsala al crear o revisar vistas del front.
---

# Minimal UI — una pantalla, un dato, una vez

Regla: si el mismo dato aparece 2+ veces en la misma pantalla, deja UNA
ocurrencia canónica y elimina o fusiona las demás.

## Workflow

1. **Inventario**: lista cada dato visible en la pantalla y en qué
   archivo:línea aparece (título, montos, conteos, listas, fechas, usuario).
2. **Clasifica cada repetición**:
   - `conteo-vs-lista` (ej: "3 Nº" + chips 01 02 03) → deja la lista, el
     conteo solo si aporta contexto en otra sección.
   - `subtotal-vs-total` (iguales) → deja solo Total.
   - `badge-vs-sección` (mismo estado en badge + título + tabs) → deja el
     badge, quita el texto redundante.
   - `padre-vs-hijo` (prop que repite lo ya visible arriba) → quita del hijo.
   - `texto-vs-barra` (mismo % en número y Progress) → deja la barra con el
     número al lado, una sola vez.
3. **Edita**: elimina el bloque redundante, NO lo comentes. Si dos textos
   dicen lo mismo con distintas palabras, fusiona en una frase.
4. **No toques**: navegación (breadcrumbs), acciones (botones), ni datos que
   solo parecen iguales pero son distintos (premio vs monto pagado).
5. **Verifica**: `npx tsc --noEmit`. Revisa la pantalla en el navegador.

## Prohibido

- Dejar código comentado o props que ya nadie usa (elimina la prop del
  padre y del hijo a la vez).
- Agregar resúmenes/cards nuevas "por si acaso".
- Cambiar lógica de negocio o validaciones; solo presentación.
