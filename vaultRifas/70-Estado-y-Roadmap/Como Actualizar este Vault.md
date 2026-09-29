---
type: estado
status: implemented
area: estado
tags: [rifascenter, meta, vault]
updated: 2026-09-02
---

# Como Actualizar este Vault

## Qué es

Reglas para mantener el grafo Obsidian útil:

1. **Cambio de dominio** (tabla/tipo) → actualizar [[Entidad X]] + [[Modelo de Datos]] + `updated`.
2. **Nuevo flujo** → nota en `40-Flujos/` + link desde [[MOC Flujos]].
3. **Nueva ruta/API** → `50-Rutas-y-UI/` + [[APIs]].
4. **Decisión de producto** → ADR en `80-Decisiones/` con plantilla.
5. **Status** en frontmatter: `implemented | partial | mock | planned | deprecated`.
6. Siempre wikilink de vuelta al MOC (`## Ver también`).
7. No duplicar código: citar paths del repo.
8. Si `docs/` del repo contradice el vault (ej. MP), priorizar ADRs del vault y anotar en [[Brechas Conocidas]].

## Conexiones

- [[Home]] · [[MOC Estado Actual]] · [[Plantilla ADR]] · [[Plantilla Entidad]]

## Archivos

- `vaultRifas/90-Plantillas/*`

## Ver también

- [[Estado Actual]] · [[Roadmap Escalabilidad]]
