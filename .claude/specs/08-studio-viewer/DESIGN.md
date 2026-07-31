# Diseño técnico: studio-viewer

## Arquitectura

```
apps/studio/                        (workspace generado; luego editado a mano, como
  apps/frontend-app                  cualquier app de cliente del acelerador)
    src/app.routes.ts               + ruta /studio (lazy)
  libs/frontend/src/domains/studio/  ← código a mano de esta spec
    preview/
      studio-preview.component.ts   shell del visor: nav de páginas + slot de página
      page-preview.component.ts     switch por page.kind (dashboard | resource)
      sample-data.ts                filas/totales de muestra deterministas desde el schema
      active-app.ts                 composición activa (demo) — fuente única del visor
  libs/ui                            componentes Spartan reales (materializados al scaffold)
```

Dependencias del estudio (package.json del workspace studio):

- `@acc/schema` → `file:` al dist local (tipos + `defineApp`/`defineResource`).
- Los datos canónicos (modelos de oro + app demo) y `composeApp` se importan del dist de
  `@acc/generators` por subpath (módulos puros, browser-safe). Deuda consciente: cuando la
  fase C necesite mutar schemas se extraerá un `@acc/catalog`; hoy sería una lib especulativa.

## Flujo de datos

```
APPS.demo + MODELS ──composeApp──> AppComposition (congelada)
                                        │
                                        ▼
                            StudioPreviewComponent
                             ├─ nav: composition.pages (labels resueltos)
                             ├─ signal<página activa>
                             └─ PagePreviewComponent(page)
                                  ├─ dashboard → KPI cards (sampleTotal por widget)
                                  └─ resource  → tabla con columnas de fields.table
                                                 y filas sampleRows(model, n)
```

`sample-data.ts` (puro, testeable):

- `sampleRows(model, count)`: valores por tipo (`string` → '«label» 1..n', `number/integer` →
  secuencia determinista, `boolean` → alterna, `date/timestamptz` → fechas fijas ancladas a
  2026-01-01+n). Sin aleatoriedad: misma entrada → mismas filas.
- `sampleTotal(resource)`: determinista (posición en la composición, mismo espíritu que
  `dashboardSubstitutions`).
- `visibleColumns(model)`: campos con `table.show`, ordenados por `table.order` y con label.

## Decisiones técnicas

- **Dogfooding del scaffold**: `nx g @acc/generators:app studio --app=demo` — valida la fase A
  sobre un caso real y da Angular+Spartan+vitest gratis. La baseline se commitea sin tocar.
- **El visor vive en `domains/studio`** dentro del layout canónico emitido (una feature más),
  no en un árbol paralelo.
- **Vista previa con los componentes reales de `libs/ui`** del workspace studio (hlm-card, tabla),
  no una réplica: es la promesa WYSIWYG de la visión.
- **Sin red**: fase B es 100 % cliente. El backend generado queda en el workspace (lo usarán
  las fases E/F para invocar al generador), pero el visor no lo llama.
- **Node/npm**: mismo flujo que las demos de la spec 05 (npm install + materialización Spartan
  en el postinstall del generador).

## Riesgos identificados

- Deep imports del dist de `@acc/generators` (subpaths no contractuales) → aceptado como deuda
  de fase B; se rompe en build del estudio si cambia la estructura, no en runtime silencioso.
- Deriva del workspace studio respecto al canon emitido cuando se edite a mano → asumido: es
  exactamente el modelo de uso del acelerador (generar + editar).
