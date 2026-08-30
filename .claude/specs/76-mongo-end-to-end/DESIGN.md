# Diseño técnico: database=mongo de punta a punta

## Pieza 1 — Fix del borrado hardcodeado a typeorm (`resource.ts:220-231`)

**Hecho verificado**: en ambos motores el fichero del repositorio se llama
`${persistenceDir}-${fileName}.repository.ts` dentro de
`backend/infrastructure/persistence/${persistenceDir}/` (typeorm: `typeorm-x.repository.ts`;
mongoose: `mongoose-x.repository.ts`). Y ambas plantillas de repositorio envuelven su cuerpo
en `<%_ if (aggregate.emitAggregate) { _%>`, así que sin agregado emiten un fichero vacío
que hay que borrar.

**Cambio** (sin campo nuevo en el manifiesto):

```ts
// resource.ts, rama !substitutions.aggregate.emitAggregate
tree.delete(
  path.join(
    outputDir,
    'backend/infrastructure/persistence',
    persistence.persistenceDir,
    `${persistence.persistenceDir}-${substitutions.fileName}.repository.ts`
  )
)
```

- Schema/mapper mongoose se quedan sin tocar: es simétrico con typeorm, donde entity/mapper
  también sobreviven a `!emitAggregate`.
- **Test primero** (TDD): caso en `resource-persistence.spec.ts` (o spec nuevo) — modelo sin
  VOs con `database=mongo` ⇒ no existe `mongoose-x.repository.ts`; el caso typeorm existente
  sigue verde.
- Si la fixture `app-mongo` contiene hoy el fichero vacío, el fix rompe el golden ⇒
  re-baseline justificado en el mismo commit. Si no lo contiene (los 3 modelos del gate
  tienen VOs), golden queda vacío sin más.

## Pieza 2 — Cobertura del gate: app de oro `golden-mongo`

El comando actual (`--models=customer,contract,license --dashboard --infra=none`) no ejercita
KPIs de las specs 70-73, aggregate agrupado, flujos ni el brief. En vez de acumular flags
planos, se declara un **app-schema registrado** `golden-mongo` en
`libs/generators/src/generators/app/apps/` (patrón de `golden.app.ts`, spec 22):

- **Modelos**: `customer` (composición embebida + opcional con índice parcial), `contract`
  (transiciones/kanban/period/measures), `license` (softDelete). Sin `project`: lleva
  adjuntos, que mongo rechaza antes de emitir (correcto y a propósito).
- **Dashboard**: espejo de los bloques de `golden` reapuntados a estos modelos — `kpi-row`
  mixta (spec 73), `count-by` con `measure` (spec 72), `kpi` con modificadores y target
  (spec 70), `top-n`, `series` mensual (bucket agrupado), `table`. Es exactamente el conjunto
  que hoy no vigila el gate mongo.
- **Flujo**: uno pequeño con paso `transition` sobre `contract` (`terminate`), para congelar
  el camino transición+proceso con mongo.
- **Brief**: sí (congela el CLAUDE.md emitido, como en la fixture postgres).
- **Páginas de recurso**: contract (con kanban), customer, license.

Cambio en `tools/golden-diff.sh`:

```sh
gate_app "app-mongo" "app-mongo-golden" "app-mongo" --app=golden-mongo --database=mongo --infra=none
```

Re-baseline **deliberado y revisado** de `tools/golden-fixtures/app-mongo` (la fixture crecerá:
KPIs frontend, kpi-math/kpi-window/aggregate-groups, flujo, kanban). `--infra=none` se mantiene:
este gate vigila mongo, no la infra.

## Pieza 3 — Demo end-to-end contra Mongo real

Como las demos veterinaria/taller pero por el camino mongo:

1. Generar por el mismo camino que usa el estudio (POST `studio/generate` con
   `database: 'mongo'`, o CLI con los args exactos que emite `buildGeneratorArgs`) una app
   demo bajo `apps/` (nombre propuesto: la que salga del diseño del estudio que se use;
   diseño nuevo pequeño o `golden-mongo` vía CLI si el estudio no hace falta para el tramo).
2. `make local-setup` (docker-compose.local con replSet) → arranque → readiness
   `database: up` → seeds visibles por HTTP.
3. Suite emitida completa: unit + `test:integration` (compose de test, puerto 27018) +
   typecheck + `web:build` (gate contra errores NG/TS que vitest no caza).
4. **Cierre del fleco spec 38 TASK-07**: por HTTP, borrar un `customer` (padre con `contacts`
   embebidos no aplica al arrastre; el arrastre real es entre agregados relacionados —
   verificar con el par que declare `draggedBy` en los modelos de la demo) y comprobar que
   las relacionadas quedan marcadas (`deletedAt`/`deletedOp`) y fuera del listado, en la
   misma transacción del replSet. Anotar el cierre en
   `.claude/specs/38-borrado-suave-canonico/TASKS.md`.
5. Todo defecto encontrado ⇒ test rojo en el generador + fix + golden, nunca parche en la
   app generada. La demo no se commitea (o se commitea como las otras demos, según convenga
   — decidir en la tarea; las demos previas viven en `apps/`).

## Pieza 4 — Documentación

- `ROADMAP.md:47`: spec 06 → cerrada (12/12, 2026-08-04), puntero a esta spec.
- `ROADMAP.md:211`: tabla de ranuras — quitar «falta golden mongo + suite integración»,
  dejar los huecos reales (auth/adjuntos/código/IaC como degradaciones declaradas).
- Idea 38 del backlog → resuelta con puntero a spec 76.
- Nota en `mongo.provider.ts`: el JSDoc dice «huecos… tareas TASK-07..10 de la spec 06»,
  ya caducado — actualizar a la realidad.

## Decisiones técnicas

- **Borrado por `persistenceDir`, sin campo nuevo en el manifiesto**: la convención de
  nombre ya es idéntica en ambos motores; un campo `repositoryFileName` sería abstracción
  especulativa (regla de los dos).
- **App-schema registrado en vez de más flags planos**: mismo movimiento que la spec 22 para
  postgres; congela brief+flujo+bloques con una sola etiqueta y el gate queda legible.
- **No portar auth/adjuntos/código/IaC**: fuera de scope (REQUIREMENTS); las degradaciones
  con aviso/error son comportamiento correcto y ya testeado (`auth-slot.spec.ts`,
  `attachments-engine.spec.ts`).

## Riesgos identificados

- **Re-baseline grande de `app-mongo`**: revisar el diff del baseline con ojo en los ficheros
  nuevos (KPIs frontend) — es donde puede aparecer código typeorm colado. Mitigación: leer el
  diff de baseline entero antes de congelar, no en diagonal.
- **Sesión concurrente en el mismo worktree** (memoria): golden-diff usa tmp compartido y el
  re-baseline hace adds amplios — hacer el re-baseline en ventana sin otra sesión o en
  worktree propio.
- **mongod nativo en 27017** puede ganar el loopback al contenedor (aviso spec 06): verificar
  con `docker compose ps` + un ping a la base del contenedor antes de dar por buena la demo.
- **El flujo de `golden-mongo` con transición**: si algún fichero de proceso emitido asume
  typeorm (no debería: `files-transition` habla con el port), aparecerá en el baseline — es
  justo lo que queremos cazar.
