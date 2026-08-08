# Tareas atómicas: Widgets analíticos

> Cada tarea = un commit. TDD + gate de oro incremental. DESIGN: ver REQUIREMENTS (la
> decisión estructural — componer conteos, sin backend nuevo — está allí).

---

- [ ] TASK-01 — app-schema: `CountByWidget`, `KpiCountWidget`, `SeriesWidget` + validación
      en `defineApp` (campo existe, tipo correcto, `filterable`)
- [ ] TASK-02 — composición: los widgets viajan por `composeApp`/`shellSubstitutions`
      hasta el dashboard emitido (labels de valores desde badgeMap/options del modelo)
- [ ] TASK-03 — dashboard.service emitido: conteos filtrados compuestos (count-by, kpi-count,
      series 12 meses)
- [ ] TASK-04 — dashboard.component emitido: barras horizontales, tarjeta KPI, mini serie
      vertical — sin librerías, tokens del tema
- [ ] TASK-05 — la app de oro declara los tres widgets + re-baseline deliberado
- [ ] TASK-06 — gates: golden 6/6 · typecheck 0 · e2e con captura del dashboard
