# Tareas atómicas: app-page-schema

> Cada tarea = un commit. TDD estricto: test rojo → código → verde.
> Las tareas que tocan el generador de app pasan golden-diff antes del commit.

- [ ] TASK-01: `libs/schema` — `app-types.ts` + `defineApp` con validación agregada
      (kebab name, pages≥1, ≤1 dashboard, widgets no vacíos y sin duplicados, sin
      páginas de recurso repetidas) + export en index. TDD sobre `define-app.spec.ts`.
- [ ] TASK-02: plugin — `app/composition.ts` con `composeApp` (valida referencias contra
      el registro de modelos) y `composeFlat` (reproduce la composición actual). TDD puro,
      sin Tree.
- [ ] TASK-03: plugin — registro `app/apps/registry.ts` (`APPS`, `selectApp`) con la app
      `demo` equivalente al comportamiento plano canónico. TDD.
- [ ] TASK-04: `appGenerator` consume `AppComposition` como único camino de render
      (nav/rutas/defaultRoute/dashboard); opción `app` en `schema.json`; error por
      conflicto `--app`×(`models`|`dashboard`); test de equivalencia árbol plano ≡ árbol
      con `--app=demo`. Golden-diff + suite verde antes del commit.
- [ ] TASK-05: actualizar ROADMAP (fase A → hecha) y `docs/vision-editor-visual-schema.md`
      (estado fase A) — commit docs.
