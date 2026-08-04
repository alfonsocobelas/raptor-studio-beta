# Spec: Persistencia MongoDB/Mongoose (`--database=postgres|mongo`)

---

## Contexto de negocio

Hay clientes cuya infraestructura estándar es MongoDB (Atlas o CosmosDB API Mongo) y hoy el acelerador
solo emite persistencia TypeORM/PostgreSQL. Esta spec añade **Mongo con Mongoose como motor alternativo
por app**: el generador `app` acepta `--database=postgres|mongo` (default `postgres`) y, si se elige
mongo, TODOS los recursos emiten repositorios Mongoose con su infra compartida y su arrange de tests
de integración. No hay mezcla de motores en una misma app.

Decisiones cerradas en brainstorming (2026-07-31):

- **Alcance**: motor alternativo por app (no plugin transversal, no elección por recurso).
- **Enfoque**: opción `database` propagada a `kernel` y `resource` + árboles de plantillas paralelos
  (`persistence/mongoose/` junto a `persistence/typeorm/`); la lógica de selección vive en `generator.ts`.
- **Test arrange**: servicio mongo en `docker-compose.{test,local}.yml` emitidos, simétrico a Postgres.
- **Gate**: nueva fixture golden `--database=mongo` congelada tras revisión manual + suite verde.

## User stories (formato EARS)

- **WHEN** genero una app con `--database=mongo` **THEN** todos los módulos de recurso emiten
  schema Mongoose + mapper + repositorio Mongoose que implementa el mismo port `XxxRepository` del dominio
- **WHEN** genero una app sin indicar `database` **THEN** la salida es byte a byte idéntica a la actual
  (Postgres/TypeORM, golden intacto)
- **WHEN** genero una app mongo **THEN** dominio, aplicación, entrypoints HTTP y frontend son idénticos
  a los de la app Postgres (solo cambia `infrastructure/persistence` + infra compartida + config + compose)
- **IF** `database=mongo` **THEN** los `environments/*.json` llevan URI de conexión Mongo y
  `config-validation` valida ese shape (no host/puerto/schemas Postgres)
- **IF** un campo del modelo es único **THEN** el schema Mongoose declara índice único; si además es
  opcional, con `partialFilterExpression` (equivalente al partial unique index de Postgres)
- **IF** el agregado tiene composición (hijos) **THEN** los hijos se persisten como subdocumentos
  embebidos en el documento padre y `save` es un reemplazo atómico del documento
- **IF** `database=mongo` se combina con un plugin que emite persistencia TypeORM (p. ej. `auth`)
  **THEN** el generador falla con un error claro antes de emitir nada
- **WHEN** ejecuto la suite de integración de la app emitida **THEN** los tests de repositorio corren
  contra un Mongo real (docker, single-node replica set) con limpieza de colecciones entre tests
- **WHILE** la app mongo arranca **THEN** los índices se materializan vía `syncIndexes()` (no hay
  migraciones; el plugin de fábrica de migraciones se omite)

## Criterios de aceptación

- [ ] `nx g @acc/generators:app --database=mongo` genera una app que compila, arranca y pasa su suite
      completa (unit + integración contra mongo docker + e2e)
- [ ] `nx g @acc/generators:app` (sin opción) produce salida idéntica a la baseline actual: `/golden-diff`
      de la fixture Postgres queda vacío
- [ ] Nueva fixture golden mongo congelada e incorporada a `tools/golden-diff.sh`
- [x] ~~IDs `_id` string UUIDv7 (no ObjectId)~~ → **cambiado por decisión de Alfonso el 2026-08-04**:
      `_id` es el ObjectId de Mongo y el UUIDv7 del dominio va en un campo `id` único. Ver
      "Identidad del documento" abajo
- [ ] Unicidad `ifPresent` de campos opcionales cubierta por test de integración emitido
- [ ] Combinación `database=mongo` + plugin incompatible → error claro del generador (con test)

## Referencias (proyecto de referencia y diseño)

- Canon de patrones emitidos: `docs/referencia/libs/backend/src/contexts/` (DDD, Criteria, repos) —
  no existe canon Mongoose escrito a mano; el canon TypeORM marca el estilo y la primera generación
  mongo se revisa a mano antes de congelarse
- Infra compartida actual: `libs/generators/src/generators/kernel/files/contexts/shared/infrastructure/persistence/typeorm/`
- Templates de recurso actuales: `libs/generators/src/generators/resource/files/backend/infrastructure/persistence/typeorm/`
- Arrange actual: `libs/generators/src/generators/app/files-skeleton/docker/` y
  `files-skeleton/libs/backend/tests/infrastructure/`

## Reglas de negocio aplicables

- Plantillas tontas, lógica en `generator.ts` (CLAUDE.md, regla 8) → nada de condicionales de motor en EJS
- Generar, no interpretar (regla 7) → el motor es opción de app, no del resource-schema
- UUIDv7 para todos los IDs (convención crítica)
- Gate de oro antes de commit para todo cambio de plantillas (`/golden-diff`)

## Fuera de scope (deliberado)

- Mezcla de motores en una misma app o elección de motor por recurso
- Adaptar los plugins con persistencia TypeORM (`auth`) a mongo — spec posterior; en v1 la combinación falla
- mongodb-memory-server u otros arranges alternativos — solo docker compose
- Migraciones de datos Mongo (migrate-mongo etc.) — los índices se sincronizan al bootstrap
- Piel frontend: cero cambios en frontend

## Identidad del documento (decisión de Alfonso, 2026-08-04)

`_id` es el **ObjectId** que genera Mongo, y el id del **dominio** (UUIDv7) viaja como un campo
`id` con índice único. Sustituye al criterio original de la spec (`_id` = UUIDv7), que se
implementó y se descartó tras el debate.

```
  _id  : ObjectId('6a71e009…')                  ← lo genera Mongo, NO se expone
  id   : 01920000-0000-7000-8000-0000000000bb   ← UUIDv7 del dominio, índice único
```

Por qué se eligió: mantiene `_id` idiomático de Mongo (12 bytes, timestamp propio, herramientas
que lo entienden de serie) sin tocar el contrato de la API — el cliente sigue mandando su UUIDv7
en el POST y las rutas, los VOs de id y los DTOs compartidos no cambian.

Lo que cuesta, y se acepta:

- **Dos identidades por documento**: la de Mongo y la del negocio. El código emitido nunca usa
  `_id`, pero existe.
- **Un índice más** (`id_1` único) y un `_id_` que nadie consulta: más espacio y más escrituras
  de índice por inserción.
- **`get(id)` va por índice secundario**, no por clave primaria.
- **Riesgo de fuga**: un `lean()` descuidado devolvería `_id`. Mitigado a propósito — el tipo
  `XxxDoc` NO declara `_id`, así que el mapper no puede tocarlo (verificado: el GET de la API
  devuelve solo `id`).

Consecuencia técnica que obligó a un cambio no evidente: el desempate de la paginación keyset pasa
de `_id` a `id`. El predicado del cursor compara el id de dominio, así que ordenar por el `_id` de
Mongo habría hecho que sort y predicado siguieran órdenes distintos — saltando o repitiendo filas
entre páginas. Por lo mismo, el converter de criterios ya no traduce `id` → `_id`.

Descartada la variante «ObjectId como única identidad» (sin campo `id`): el id del dominio pasaría
a ser un ObjectId, y eso cambia el contrato (el cliente lo manda validado con `@IsUUID('7')`, los
VOs de id, los DTOs compartidos, las rutas del frontend, la PK `uuid` de Postgres, las relaciones y
el ADR de UUIDv7 de CLAUDE.md). El mismo resource-schema daría dos APIs distintas según el motor.

---

> Aprobado en brainstorming 2026-07-31 (diseño consolidado en `DESIGN.md`).
