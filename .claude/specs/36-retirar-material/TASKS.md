# Tareas atómicas: Retirar la piel material

> Anotar ANTES de empezar el hash del último commit con material vivo (para recuperarla si
> un cliente la exige). No ejecutar hasta que Alfonso confirme el orden frente a la spec de
> presets de diseño (las maquetas mandan).

- [ ] **TASK-01**: Test rojo: `--ui=material` rechazado con mensaje claro; retirar el proveedor
      de la ranura `ui` (slots.ts) + `npm run slots`; el wizard del estudio deja de ofrecerlo.
- [ ] **TASK-02**: Borrar `files-ui/material`, `files-theme/material` y overrides material del
      esqueleto; limpiar deps (`@angular/material`, `@fontsource/roboto`) de la rama material
      del package emitido; adaptar los tests que recorrían las dos pieles (boolean-column, etc.).
- [ ] **TASK-03**: Retirar la «aproximación material» del lienzo del estudio (toggle
      `preview-skin` + CSS `[data-skin='material']`).
- [ ] **TASK-04**: Gates (suite + 6 golden + typecheck:emitted), ROADMAP («material congelada» →
      «material retirada en <hash>»), memoria y cierre.
