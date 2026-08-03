# Spec: Ranuras de capacidad (`database`/`ui`/`infra`/`auth`) + proveedor de persistencia

---

## Contexto de negocio

El wizard «Generar aplicación» debe ofrecer decisiones de **elige-uno-entre-varios**: infra
(azure/aws/gcp/lowcost), auth (single-tenant/multi-tenant), además de las que ya existen
(postgres/mongo, spartan/material). El sistema de plugins actual solo sabe **sumar** capacidades
(checkboxes `auth,email,observability`), así que las decisiones excluyentes se han colado como
opciones planas (`--database`, `--ui`) enhebradas a mano por todo el pipeline — incluidos hardcodes
de TypeORM en `app.ts` que se mezclan con el modo mongo (lo feo detectado por Alfonso). Además las
listas de opciones están **triplicadas**: generador (`schema.json`/`registry.ts`), validación del
studio-api (`generator-args.ts`) y formulario del wizard (`wizard-command.ts`).

Esta spec introduce las **ranuras de capacidad** (slots): decisiones excluyentes con proveedores
registrados por manifiesto (mismo estilo que `definePlugin`: carpeta de assets + manifiesto tipado,
sin decoradores). Migra a ranuras lo que ya existe (`database`, `ui`), declara las ranuras `infra`
y `auth` para las specs siguientes, hace al proveedor de persistencia **dueño de su emisión**, y
deriva las opciones del estudio de un manifiesto único (`slots.json`).

Decisiones cerradas en brainstorming (2026-08-03):

- **Orden**: primero el modelo de ranuras + persistencia (A+B); infra azure/lowcost/aws/gcp y auth
  multi-tenant son specs posteriores que rellenan las ranuras.
- **Alcance de migración**: `database` y `ui` pasan a ranuras; `infra` nace con solo `none`; `auth`
  pasa de plugin aditivo a ranura con proveedores `none`/`single-tenant`. `email` y `observability`
  siguen aditivos hasta la spec de infra (que los absorberá).
- **Fuente única para el estudio**: manifiesto `slots.json` generado desde el registro (target nx +
  test de paridad); studio-api lo sirve y valida contra él; el wizard se dibuja desde el endpoint.
  Sin imports en runtime del workspace del acelerador.
- **Profundidad**: el proveedor de persistencia es el dueño — árboles de plantillas, deps,
  compose, parche de config local y wiring de test-repositories se declaran en su manifiesto;
  `kernel.ts`/`resource.ts`/`app.ts` consultan el proveedor y dejan de nombrar motores.
- **Spec 06 (mongo)**: se re-encaja, no se absorbe. Lo ya emitido de mongo migra al proveedor;
  las TASK-06..12 pendientes se retoman después SOBRE el modelo nuevo.
- **Flags CLI**: no se renombran (`--database`, `--ui`); se añade `--auth` (default `none`).
  `--plugins=auth` se acepta con warning de deprecación y se mapea a `--auth=single-tenant`.

## User stories (formato EARS)

- **WHEN** genero una app con las opciones por defecto **THEN** la salida es byte a byte idéntica a
  la baseline actual (golden diff postgres vacío — esto es un refactor)
- **WHEN** genero con `--database=mongo` **THEN** lo hoy emitido en modo mongo sale igual, pero sin
  restos TypeORM: ni import de `TypeOrmXxxRepository` en test-repositories ni parche de config
  `typeorm` (hardcodes actuales de `app.ts`)
- **WHEN** añado un proveedor nuevo a una ranura (solo registro + assets) **THEN** aparece en
  `slots.json`, en el formulario del wizard y en la validación del studio-api sin tocar el estudio
- **IF** paso un valor no registrado a una ranura (`--database=oracle`) **THEN** el generador falla
  con error claro listando los proveedores disponibles (mecanismo genérico, no función a medida)
- **IF** una combinación viola una restricción declarada (`database=mongo` + `auth=single-tenant`)
  **THEN** el generador falla antes de emitir nada Y el wizard deshabilita la opción en vivo
- **WHEN** uso `--plugins=auth` (forma antigua) **THEN** funciona con warning de deprecación y
  equivale a `--auth=single-tenant`
- **WHEN** ejecuto el target de manifiesto **THEN** `slots.json` refleja el registro (ranuras,
  proveedores, etiquetas, defaults, restricciones, plugins aditivos) y un test falla si el
  commiteado difiere del regenerado
- **WHEN** abro el wizard del estudio **THEN** los grupos de radios (una por ranura) y los
  checkboxes (plugins aditivos) se pintan desde `GET /studio/slots`, no desde listas hardcodeadas
- **WHEN** el wizard construye el comando **THEN** emite un flag por ranura
  (`--database=… --ui=… --auth=…`) más `--plugins=…` para los aditivos

## Criterios de aceptación

- [ ] `/golden-diff` de la fixture postgres queda **vacío** tras todo el refactor
- [ ] `grep -r "typeorm" libs/generators/src/generators/app/app.ts` no devuelve nada (el proveedor
      es el dueño); ídem sin literales `'postgres'`/`'mongo'` fuera de los manifiestos de proveedor
- [ ] `SLOTS` registra `database`, `ui`, `infra` (solo `none`) y `auth` (`none`/`single-tenant`);
      `PLUGINS` queda con `email` y `observability`
- [ ] El guard `requiresDatabase` ad-hoc se sustituye por restricciones declarativas entre ranuras
      (mismo error para `mongo`+`single-tenant`, con test)
- [ ] `slots.json` generado + test de paridad en la suite
- [ ] `generator-args.ts` y `wizard-command.ts` sin listas hardcodeadas de opciones
- [ ] Smoke Playwright: el wizard pinta las ranuras desde el endpoint y una combinación inválida
      aparece deshabilitada
- [ ] Suite completa del workspace verde

## Referencias (proyecto de referencia y diseño)

- Mecanismo actual de plugins: `libs/generators/src/generators/app/plugins/{plugin.ts,registry.ts}`
- Hardcodes a eliminar: `libs/generators/src/generators/app/app.ts` (import TypeOrm en
  test-repositories y parche de config `typeorm`)
- Espejos a derivar: `apps/studio/.../generate/{generator-args.ts,wizard-command.ts}`
- ROADMAP obs. 1 (adapter Azure siempre emitido): NO se arregla aquí — pertenece a la spec de infra

## Reglas de negocio aplicables

- Regla 7 (CLAUDE.md): generar, no interpretar — el wizard ofrece exactamente las opciones del
  generador, derivadas, nunca inventadas
- Regla de los dos (ADR-004): el mecanismo de ranuras se valida con dos casos reales existentes
  (`database`, `ui`) antes de que infra/auth lo usen
- Golden diff como gate de refactor: plantillas/generator.ts tocados ⇒ diff vacío antes de commit

## Fuera de scope (deliberado)

- Proveedores de infra reales (azure/lowcost/aws/gcp) — specs C1–C4; aquí `infra` solo declara `none`
- Auth multi-tenant — spec D (dominio nuevo)
- Terminar la persistencia mongo (schemas por recurso, repo, tests integración, compose, golden,
  demo) — TASK-06..12 de la spec 06, re-encajadas sobre el proveedor
- Absorción de `email`/`observability` por el proveedor de infra — spec C1
- Arreglo del adapter Azure Blob siempre-emitido (ROADMAP obs. 1) — spec C1, exige re-baseline con OK

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `DESIGN.md` hasta aprobación explícita del usuario.
