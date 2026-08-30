# Tareas atómicas: database=mongo de punta a punta

> Cada tarea = un commit. Implementar UNA, commit en develop, esperar revisión.
> Toda tarea que toque plantillas o generator.ts pasa el gate de oro antes del commit.

## Pieza 1 — Bug del repositorio vacío

- [ ] TASK-01: Test rojo (modelo sin VOs + `database=mongo` ⇒ no existe
      `mongoose-x.repository.ts`; el caso typeorm sigue verde) + fix en `resource.ts`:
      borrado vía `persistence.persistenceDir`. Gate de oro (re-baseline solo si la
      fixture contenía el fichero vacío).

## Pieza 2 — Gate con cobertura real

- [ ] TASK-02: App-schema `golden-mongo` en `app/apps/` (customer+contract+license, dashboard
      espejo de `golden` con kpi-row/count-by+measure/kpi/top-n/series/table, flujo con
      transición `terminate`, brief) + registro en `registry.ts` + test del registro.
- [ ] TASK-03: `golden-diff.sh`: el gate mongo pasa a `--app=golden-mongo --database=mongo
      --infra=none`. Re-baseline deliberado de `tools/golden-fixtures/app-mongo`
      **leyendo el diff entero** (ojo: código typeorm colado en ficheros nuevos).
      Sin sesión concurrente en el worktree.

## Pieza 3 — Demo end-to-end contra Mongo real

- [ ] TASK-04: Generar la app demo por el camino del estudio (POST `studio/generate` con
      `database: 'mongo'` o CLI con los args de `buildGeneratorArgs`); `make local-setup`
      → arranque → readiness `database: up` → seeds por HTTP. Verificar que responde el
      Mongo del contenedor, no un mongod nativo en 27017.
- [ ] TASK-05: Suite emitida completa verde: unit + `test:integration` (compose test, 27018)
      + typecheck + `web:build`. Defectos ⇒ test rojo en el generador + fix + golden
      (cada fix, su propio commit).
- [ ] TASK-06: Arrastre de borrado suave por HTTP contra la demo (padre con relacionadas
      `draggedBy` ⇒ marcadas y fuera del listado, misma transacción). Anotar el cierre del
      fleco TASK-07 en `.claude/specs/38-borrado-suave-canonico/TASKS.md`.

## Pieza 4 — Documentación

- [ ] TASK-07: ROADMAP (línea 47 spec 06 cerrada, línea 211 tabla de ranuras, idea 38
      resuelta → spec 76) + JSDoc caducado de `mongo.provider.ts`.

---

## Regla del juego

Implementar **UNA** tarea, commit atómico en develop, esperar aprobación antes de seguir.
