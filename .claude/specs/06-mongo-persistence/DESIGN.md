# Diseño técnico: Persistencia MongoDB/Mongoose

> Diseño aprobado en brainstorming 2026-07-31 (enfoque A: opción `database` + plantillas paralelas).

---

## Contrato del generador

- `app/schema.json` gana `database: 'postgres' | 'mongo'` (default `'postgres'`, con `x-prompt`).
- `app.ts` propaga la opción a los generadores `kernel` y `resource` (opción tipada en sus schemas).
- El resource-schema NO cambia: el motor es decisión de app, no de modelo.
- Postgres es el camino por defecto y debe quedar **byte a byte intacto** (regresión = golden actual).

```
app --database=mongo
 ├─> kernel   (emite shared/infrastructure/persistence/mongoose/ en vez de typeorm/)
 ├─> resource (emite infrastructure/persistence/mongoose/ por módulo)
 └─> skeleton (compose mongo, jest.setup mongoose, deps, sin plugin migrations)
```

## Kernel — infra compartida Mongoose

Nuevo árbol `kernel/files-persistence-mongoose/` (paralelo al typeorm existente), emitido en
`contexts/shared/infrastructure/persistence/mongoose/`:

- `shared-persistence.module.ts` — `MongooseModule.forRootAsync` leyendo la URI del bloque `database`
  de config. Exporta transaction manager y converter.
- `mongoose-criteria-converter.ts` — Criteria → `{ filter, sort, skip, limit }`. Mismo contrato
  semántico que `TypeOrmCriteriaConverter` (operadores, orden, paginación offset).
- `mongoose-transaction-manager.ts` + `mongoose-transaction-context.ts` — boundary transaccional
  sobre `ClientSession` (requiere replica set; en local/test, single-node `rs0`).
- `mongoose.repository.ts` — base abstracta con `searchByCriteria` / `countByCriteria` / `matching`.

Config emitida:

- `environments/*.json`: bloque `database` con `uri` mongo (sin host/puerto/schemas Postgres).
- `config-validation.ts` y `config-types.ts`: shape según motor (plantillas paralelas o sustitución
  calculada en `generator.ts`; nunca condicional EJS de motor).

## Resource — persistencia por módulo

Nuevo árbol `resource/files/backend/infrastructure/persistence/mongoose/`:

- `__fileName__.schema.ts` — Schema Mongoose:
  - `_id: string` (UUIDv7), sin ObjectId; `versionKey: false`.
  - Índices únicos por campo único; `partialFilterExpression` cuando el campo es opcional
    (paridad con el partial unique index de Postgres).
- `__fileName__.mapper.ts` — dominio ↔ documento (primitives), espejo del mapper TypeORM.
- `mongoose-__fileName__.repository.ts` — implementa el port `XxxRepository` del dominio:
  `register`, `get`, `matching`, `searchByCriteria`, `delete`, unique finders.
  - **Composición**: hijos como subdocumentos embebidos en el padre; `save` = `replaceOne`
    atómico (desaparece el diff upsert/soft-delete del repo TypeORM).
- `files-tests-integration/mongoose-__fileName__.repository.test.ts` — espejo del test TypeORM
  (mothers, unique finders, criteria, ifPresent en opcionales únicos).

`resource.ts` elige el directorio de plantillas según `database`. Dominio, aplicación, entrypoints
y frontend no se tocan.

## App skeleton y plugins

- `docker-compose.{test,local}.yml`: servicio `mongo:7` con `--replSet rs0`, init del replica set y
  healthcheck (plantillas paralelas de compose, no condicionales).
- `jest.setup.integration.ts` variante Mongoose + `mongoose-environment-arranger.ts` (conecta,
  limpia colecciones entre tests, cierra conexión).
- `package.json` emitido: `mongoose` + `@nestjs/mongoose`; fuera `typeorm`/`pg`.
- Makefile: targets `migrate*` no se emiten con mongo.
- Bootstrap: `syncIndexes()` al arrancar materializa los índices (sustituye a migraciones).
- Migraciones de fábrica: omitidas cuando `database=mongo`.
- Guard de plugins: `selectPlugins` (o `app.ts`) falla con error claro si `database=mongo` se
  combina con un plugin que emite persistencia TypeORM (v1: `auth`).

## Gate de oro y verificación

- Nueva fixture en `tools/golden-fixtures` generada con `--database=mongo` (mismos modelos que la
  fixture Postgres). Flujo: TDD sobre helpers de `generator.ts` → revisión manual del emitido →
  suite completa de la app emitida en verde contra mongo docker → congelar baseline →
  `tools/golden-diff.sh` la incorpora.
- La fixture Postgres actual es el test de regresión: su diff debe quedar vacío en todos los commits.

## Manejo de errores

- Violación de índice único (E11000) → mapeada en el repositorio al mismo error de dominio que hoy
  produce la violación de constraint en Postgres (paridad de contrato observable en los e2e).
- URI mongo inválida/ausente → falla `config-validation` al arrancar, igual que hoy con Postgres.

## Testing

- Unit del generador: specs de `app`/`kernel`/`resource` parametrizados por motor (Tree en memoria).
- Integración emitida: repos contra mongo docker (replica set) con transacciones reales.
- E2E emitido: sin cambios de contrato — los mismos tests e2e deben pasar con cualquiera de los dos motores.
