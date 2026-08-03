# Tareas atómicas: Ranuras de capacidad + proveedor de persistencia

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.
> Gate transversal: toda tarea que toque `generator.ts`/plantillas termina con `/golden-diff` vacío.

---

## Mecanismo de ranuras (generador)

- [x] **TASK-01**: Tests + tipos `Slot`/`SlotProvider` y registro `SLOTS` con `database` y `ui`
      (proveedores actuales, defaults, sin emisión aún) + `selectProvider` con error genérico listando disponibles
- [x] **TASK-02**: Tests + `validateCombination` (restricciones `requires` entre ranuras); migrar el
      guard `requiresDatabase` de `selectPlugins` a `requires: { database: 'postgres' }` del proveedor auth
- [x] **TASK-03**: Tests + ranura `auth` (`none`/`single-tenant`, reutilizando el manifiesto del plugin
      actual) y ranura `infra` (solo `none`); compat `--plugins=auth` → warning + `auth=single-tenant`
- [ ] **TASK-04**: `--auth` en `app/schema.json` (x-prompt list, default `none`); `selectDatabase`
      eliminado en favor de `selectProvider`
      · nota: el cableado de `auth` en `app.ts` se adelantó a TASK-03 — sacar auth de `PLUGINS` sin
        cablear la ranura habría dejado el commit rojo (la fixture golden usa `--plugins=auth`)

## Proveedor de persistencia dueño de la emisión

- [ ] **TASK-05**: Tests + manifiestos `postgresProvider`/`mongooseProvider` (kernelFiles, dependencies,
      composeService, patchLocalConfig, testRepositoryImport) — datos movidos, aún sin consumidores
- [ ] **TASK-06**: `kernel.ts` consume el proveedor (árbol `files-<engine>` desde el manifiesto);
      golden postgres vacío
- [ ] **TASK-07**: `resource.ts` consume el proveedor (selección typeorm/mongoose en un punto único);
      golden postgres vacío
- [ ] **TASK-08**: `app.ts` consume el proveedor: deps, compose, parche de config local y wiring de
      test-repositories desde el manifiesto — desaparecen los literales typeorm de `app.ts`
      (líneas 201 y 307 actuales); golden postgres vacío + salida mongo sin restos TypeORM

## Manifiesto slots.json

- [ ] **TASK-09**: Tests + emisor del manifiesto (`SLOTS`+`PLUGINS` → JSON serializable) + target nx
      para regenerarlo + `tools/slots.json` commiteado
- [ ] **TASK-10**: Test de paridad en la suite: regenerado ≠ commiteado ⇒ rojo con instrucción

## Estudio (studio-api + wizard)

- [ ] **TASK-11**: Tests + `GET /studio/slots` en studio-api (lee el manifiesto desde ACELERADOR_ROOT)
      y validación de `POST /studio/generate` contra él; fuera `UI_VALUES`/`DATABASE_VALUES`/`PLUGIN_VALUES`
- [ ] **TASK-12**: Tests + `wizard-command.ts` genérico (`slots: Record<string,string>`, flag por ranura);
      fuera las listas hardcodeadas
- [ ] **TASK-13**: Wizard dibujado desde el endpoint: radios por ranura (ocultas las de un solo
      proveedor), checkboxes de aditivos, combinaciones inválidas deshabilitadas en vivo
- [ ] **TASK-14**: Smoke Playwright: ranuras pintadas desde el endpoint + `mongo`+`single-tenant`
      deshabilitado; suite completa del workspace verde

## Cierre

- [ ] **TASK-15**: Re-encajar la spec 06: reformular TASK-06..12 sobre `mongooseProvider` y anotar el
      ROADMAP (spec 22 hecha, specs C1–C4/D como huecos de las ranuras)
