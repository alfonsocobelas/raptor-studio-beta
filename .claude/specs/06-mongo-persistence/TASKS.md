# Tareas atómicas: Persistencia MongoDB/Mongoose

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.
> Gate permanente: en TODOS los commits el golden Postgres actual queda con diff vacío.

> ⚠️ **RE-ENCAJE (spec 23, 2026-08-04)**: el motor ya no se enhebra como parámetro. Cada motor tiene
> un **manifiesto** en `libs/generators/src/generators/app/persistence/` que declara qué emite
> (`kernelFiles`, `resourceFiles`, `compositionFiles`, `integrationTestFiles`, `alignEnvironment`,
> `testRepository`) y kernel/resource/app solo lo consultan. Las tareas de abajo se implementan
> **rellenando `mongo.provider.ts`**, no añadiendo `if`s: cada campo que hoy falta en ese manifiesto
> es exactamente uno de estos huecos. El generador ya **avisa por consola** de que mongo no emite
> persistencia por recurso, así que el estado incompleto es visible en vez de silencioso.
>
> Huecos adicionales detectados al hacer el refactor (una app `--database=mongo` HOY no compila):
>
> - `customers.module.ts` bindea `useClass: TypeOrmXxxRepository`: **el binding de DI está hardcodeado
>   en la plantilla del módulo** (`files-module`). Debe salir del manifiesto (añadir a TASK-07).
> - `typeorm-environment-arranger.ts` + `jest.setup.integration.ts`: el arranque de la suite de
>   integración es específico de motor y se emite siempre (TASK-09).
> - `health.controller.ts` comprueba salud vía TypeORM siempre (nuevo, ver TASK-09b).
> - `package.json` emitido lleva `typeorm`/`pg` y ningún contenedor de mongo en el compose (TASK-09/10):
>   esos datos NO se declararon en el manifiesto a propósito, porque hoy viven en el esqueleto
>   copiado verbatim y habría que inventarse el lado mongo.

---

## Contrato y guard

- [x] **TASK-01**: Opción `database: 'postgres' | 'mongo'` en `app/schema.json` (default postgres,
      x-prompt) + propagación tipada a `kernel` y `resource`. Test: sin opción, la salida no cambia.
      · spec 23: la validación es ahora del registro de ranuras (`selectEngine`), no de `selectDatabase`
- [x] **TASK-02**: Guard de plugins incompatibles: `database=mongo` + `auth` → error claro (con test).
      · spec 23: reimplementado como restricción declarativa `requires: { database: 'postgres' }` del
      proveedor `auth=single-tenant`, aplicada por `validateCombination`

## Kernel — infra compartida

- [x] **TASK-03**: Config mongo emitida: bloque `database.uri` en `environments/*.json` +
      `config-types`/`config-validation` según motor (TDD en `kernel.spec.ts`).
- [x] **TASK-04**: Plantillas `persistence/mongoose/`: `shared-persistence.module` +
      `mongoose.repository` base + `mongoose-transaction-manager`/`-context` (TDD kernel).
- [x] **TASK-05**: `mongoose-criteria-converter` (Criteria → filter/sort/skip/limit), paridad de
      operadores con el converter TypeORM (TDD kernel).

## Resource — persistencia por módulo

- [x] **TASK-06**: Plantillas `__fileName__.schema.ts` (UUIDv7, índices únicos + partialFilterExpression
      en opcionales) y `__fileName__.mapper.ts` en un árbol propio (`files-persistence-mongoose/`)
      declarado como `resourceFiles` del manifiesto mongo; ídem `compositionFiles` para los hijos
      embebidos. `renderMongo` (su spec ya existe en rojo: `build-mongo.spec.ts` sin `build-mongo.ts`).
- [x] **TASK-07**: Plantilla `mongoose-__fileName__.repository.ts` (port completo del dominio,
      composición como subdocumentos embebidos, mapeo E11000 → error de dominio) **+ el binding de DI
      del módulo emitido**: hoy `files-module` hardcodea `useClass: TypeOrmXxxRepository`, así que el
      manifiesto debe declarar clase e import del repositorio que registra el módulo del recurso.
- [x] **TASK-08**: Plantilla de test de integración `mongoose-__fileName__.repository.test.ts`
      (espejo del de TypeORM: register/get, unique finders, criteria, ifPresent), declarada como
      `integrationTestFiles` del manifiesto mongo.
      · el caso **ifPresent** (dos documentos con el único opcional vacío que NO deben chocar,
      gracias al `partialFilterExpression`) queda pendiente para TASK-12: es factible con
      `Builder.withProps({ campo: '' })`, pero exige un Mongo real para saber si el VO acepta
      el valor vacío — emitir un test que no se puede ejecutar es peor que no emitirlo

## App skeleton — arrange

- [x] **TASK-09**: Compose mongo (`mongo:7` single-node replSet + healthcheck) en
      `docker-compose.{test,local}.yml` emitidos + variante mongoose de `jest.setup.integration` y
      arranger (hoy `typeorm-environment-arranger.ts` se emite siempre). El compose y el arranger
      salen del esqueleto verbatim ⇒ hay que declararlos en el manifiesto (`composeService`,
      `integrationArrangerFiles`) y que el ensamblador los pida, como ya hace con lo demás.
- [x] **TASK-09b**: Health check por motor: `health.controller.ts` comprueba TypeORM siempre
      (detectado en el refactor de la spec 23).
- [x] **TASK-10**: Ensamblaje app mongo: deps (`mongoose`, `@nestjs/mongoose`), fuera `typeorm`/`pg`
      — declaradas en el manifiesto (`dependencies`/`removeDependencies`), no con `if`s en `app.ts` —,
      Makefile sin targets de migración, migraciones de fábrica omitidas, `syncIndexes()` en bootstrap.

## Gate y verificación end-to-end

- [x] **TASK-11**: Fixture golden `--database=mongo` en `tools/golden-fixtures/app-mongo`
      (`--models=customer,contract,project --database=mongo --dashboard`, 594 ficheros).
      **Hecha 2026-08-04 con OK de Alfonso.**
      · `customer` entra porque es el ÚNICO modelo con composición: sin él la fixture no cubriría
      los subdocumentos embebidos, que es la parte más novedosa de las plantillas mongo. Aporta
      además el único opcional (`taxId` → índice parcial) y las fechas nullable; `project`, softDelete
      · sin plugins: `auth` exige postgres y `email` depende de `auth`
      · `golden-diff.sh` refactorizado: el gate de app es ahora una función y hay **un gate por motor**
      · el gate gana la comprobación INVERSA que no tenía: una fixture con un fichero que el
      generador ya no emite también es regresión (antes un borrado de plantilla pasaba inadvertido)
      · `tools/golden-fixtures` va a `.nxignore`: las fixtures traen `libs/ui` vendorizado y Nx
      inferría sus proyectos, con nombres duplicados entre las dos fixtures de app (rompía TODO nx)
      · verificado que el gate nuevo puede fallar: se alteró la fixture a mano y se puso rojo
- [x] **TASK-12**: Demo generada con `--database=mongo`: suite completa verde (unit + integración
      contra mongo docker + e2e) y arranque real verificado. **Hecha 2026-08-04** con `--app=boutique`:
      · typecheck de la app emitida: **0 errores** (y 0 también en su equivalente postgres)
      · suites de la app emitida: **26 integración** (contra `mongo:7` del compose emitido) +
      **163 unit** + **42 front** = 231 en verde. No hay proyecto `e2e` en la app emitida
      (el `jest.config` emitido solo define `unit` e `integration`), así que esa parte no aplica
      · arranque real: la API levanta contra el contenedor, `readiness` da `database: up` por el
      `MongooseHealthIndicator`, y POST+GET de un recurso funciona end-to-end
      · dentro del contenedor: `_id` es UUIDv7 string (no ObjectId), `createdAt`/`updatedAt` de
      `timestamps: true`, y los índices materializados por `MongooseIndexSync` al arrancar
      · caso **ifPresent** cerrado: `taxId` de supplier lleva `partialFilterExpression { $gt: '' }`
      verificado en la base; dos documentos con el campo vacío coexisten y con valor chocan (409)
      · ⚠️ ojo al verificar a mano: hay un **mongod nativo** en la máquina escuchando en
      127.0.0.1:27017 que gana el loopback al contenedor local — la primera verificación fue
      contra él sin darme cuenta. Se repitió apuntando al contenedor (27018)
      · ⚠️ `tools/golden-diff.sh` empieza con `rm -rf tmp/generated`: **borra cualquier app en
      pruebas** que viva ahí (con su `node_modules`). Para verificar a mano, genera fuera de
      `tmp/generated` o no corras el gate hasta acabar.
      · el typecheck de la app emitida ya está verificado (boutique mongo y postgres: 0 errores,
      2026-08-04); lo que falta aquí es la suite de integración contra el Mongo del compose
      · al cerrarla, añadir el caso **ifPresent** que quedó pendiente en TASK-08
