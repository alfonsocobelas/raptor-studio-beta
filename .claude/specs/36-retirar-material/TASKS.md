# Tareas atómicas: Retirar la piel material

> Último commit con material viva: **103f24d** (recuperable de git si un cliente la exige).

- [x] **TASK-01**: Test rojo: `--ui=material` rechazado con mensaje claro; retirar el proveedor
      de la ranura `ui` (slots.ts) + `npm run slots`. Limpiado también: `@angular/material` y
      `@fontsource/roboto` fuera del `package.json` siempre emitido (`@angular/cdk` se conserva,
      lo usan las primitivas headless de spartan); `schema.json` deja de exponer `ui` al no
      tener nada que elegir. El toggle del wizard ya no lo ofrece (sale de `tools/slots.json`,
      regenerado). Suite 525 ✅ · 6 golden vacíos ✅. Commits `047fe8b` + `708b566`.
- [x] **TASK-02**: Borrados `files-ui/material`, `files-theme/material` y el override vacío de
      `files-skeleton-ui/material`. `frontend-kernel`'s `ui` narrows to `'spartan'`. Adaptados
      `skeleton-ui.spec.ts`, `data-table-suite.spec.ts` y `boolean-column.spec.ts`, que aún
      recorrían las dos pieles. Suite 524 ✅ · 6 golden vacíos ✅. Commit `ad13d97`.
- [x] **TASK-03**: Verificado que no queda nada del toggle de piel en el lienzo del estudio (lo
      sustituyó el selector de preset visual en la spec 37: sin CSS `[data-skin]` ni tipo
      `PreviewSkin` huérfanos). Limpiados también los fixtures de mock que en dos tests del
      estudio seguían usando `material` como valor de ejemplo de un slot (`wizard-command.spec.ts`,
      `generator-args.test.ts`) → renombrados a un valor neutro (`alt`) para no insinuar que el
      proveedor sigue existiendo. Suite estudio: front 216 ✅ · back 265 ✅.
- [x] **TASK-04**: Gates finales — suite generators 524 ✅, 6 golden vacíos ✅,
      `npm run typecheck:emitted` → **0 errores**. ROADMAP actualizado: la tabla de ranuras
      («material congelada» → «material retirada, spec 36»), el punto 8 de observaciones
      abiertas (resuelto por retirada, no por fidelidad) y fila propia en la fase 6.

## Cierre

Spec 36 completada 2026-08-10. Piel material retirada en 4 commits atómicos
(`047fe8b`, `708b566`, `22a27b5` + el de TASK-03). Recuperable de `103f24d` si algún cliente
la exige. La ranura `ui` y los contratos UI neutrales (`shared/components/ui/*`) se conservan
como punto de re-entrada. La variedad visual la lleva ahora la ranura `design` (spec 37).
