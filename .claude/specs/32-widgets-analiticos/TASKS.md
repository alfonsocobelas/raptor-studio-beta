# Tareas atómicas: Widgets analíticos

> Cada tarea = un commit. TDD + gate de oro incremental. DESIGN: ver REQUIREMENTS (la
> decisión estructural — componer conteos, sin backend nuevo — está allí).

---

- [x] TASK-01 — app-schema: `CountByWidget`, `KpiCountWidget`, `SeriesWidget` + validación
      en `defineApp` (campo existe, tipo correcto, `filterable`)
- [x] TASK-02 — composición: los widgets viajan por `composeApp`/`shellSubstitutions`
      hasta el dashboard emitido (labels de valores desde badgeMap/options del modelo)
- [x] TASK-03 — dashboard.service emitido: conteos filtrados compuestos (count-by, kpi-count,
      series 12 meses)
- [x] TASK-04 — dashboard.component emitido: barras horizontales, tarjeta KPI, mini serie
      vertical — sin librerías, tokens del tema
- [x] TASK-05 — la app de oro declara los tres widgets + re-baseline deliberado
- [x] TASK-06 — gates: golden 6/6 · typecheck 0 · e2e con captura del dashboard

---

## Cierre (2026-08-08)

- Gates: golden 6/6 (la app de oro pasa a 745 ficheros) · typecheck 0 en las DOS composiciones
  (plana y --app=golden, que estrena la medición) · suite del plugin 486 · e2e con captura
  (`apps/studio/e2e-20-dashboard-widgets.png`): barras por tipo con etiquetas del modelo,
  KPI condicionado y serie mensual con las altas de ene/feb.
- Hallazgos arreglados de camino, destapados por el typecheck del corte de oro:
  `kpiModels` duplicaba tarjetas (empujaba una por widget) y un corte que referencia a un
  modelo fuera NO lo incluía — ahora el padre entra como dependencia sin página (customers
  se unió a la app de oro por eso).
- Deuda anotada: los widgets aún no se declaran desde el estudio (tramo de diseño visual).
