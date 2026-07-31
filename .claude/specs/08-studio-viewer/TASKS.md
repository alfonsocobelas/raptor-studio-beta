# Tareas atómicas: studio-viewer

> Cada tarea = un commit. TDD donde hay lógica (sample-data, view-model).

- [ ] TASK-01: scaffold `apps/studio` con `nx g @acc/generators:app studio --app=demo`
      (baseline generada, commit tal cual, sin edición manual).
- [ ] TASK-02: dependencias del contrato en el workspace studio (`@acc/schema` por file:dist,
      subpath del dist de generators para modelos/app/composición) + `active-app.ts` con la
      composición congelada. Smoke: build del estudio verde.
- [ ] TASK-03: `sample-data.ts` (filas, totales y columnas visibles deterministas) — TDD puro.
- [ ] TASK-04: componentes del visor (`studio-preview`, `page-preview`) + ruta `/studio` +
      tests de render básicos. Build + tests del estudio verdes.
- [ ] TASK-05: cerrar spec — ROADMAP y visión (fase B hecha), commit docs.
