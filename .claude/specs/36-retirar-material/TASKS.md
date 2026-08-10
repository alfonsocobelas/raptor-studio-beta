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
- [ ] **TASK-03**: Retirar la «aproximación material» del lienzo del estudio SI queda algo tras
      la spec 37 (el toggle ya se sustituyó por el selector de preset visual — verificar que no
      quede CSS ni tipo `PreviewSkin` huérfano).
- [ ] **TASK-04**: Gates (suite + 6 golden + typecheck:emitted), ROADMAP («material congelada» →
      «material retirada en 103f24d»), memoria y cierre.
