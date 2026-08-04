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
- [x] IDs `_id` string UUIDv7 (no ObjectId) en todos los documentos — **decisión revisada y
      reafirmada por Alfonso el 2026-08-04**, ver "Identidad del documento" abajo
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

## Identidad del documento (decisión reafirmada 2026-08-04)

`_id` **es** el UUIDv7 del dominio. Ni ObjectId, ni un campo `id` adicional. Se debatieron las tres
opciones y se descartaron dos:

```
  A) _id = UUIDv7            ✅ elegida: UNA identidad, cero campos extra
  B) _id = ObjectId + id     ✗ dos identidades, un índice más, get() por índice secundario,
                               y _id se filtra a la API con un lean() descuidado
  C) _id = ObjectId, sin más ✗ el id del dominio pasaría a ser ObjectId: cambia el CONTRATO
                               (el cliente manda el id en el POST validado con @IsUUID('7'),
                               los VOs de id, los DTOs compartidos, las rutas del frontend,
                               la PK `uuid` de Postgres, las relaciones y el ADR de CLAUDE.md).
                               El mismo resource-schema daría dos APIs según el motor.
```

Razón de fondo: el agregado **tiene identidad antes de persistirse** — `register()` recibe un
agregado ya identificado, y el id lo genera el dominio (UUIDv7). Si lo generase la base, habría un
id de dominio y otro de base que no significan lo mismo.

Lo que se acepta perder al no usar ObjectId:

- **Espacio**: 41 bytes en BSON frente a 12 (~29 por documento, y el índice `_id` crece igual).
- **Comparación**: 36 bytes de string comparan más lento que 12 de ObjectId.
- **La fecha de creación no se lee sola**: Compass/mongosh decodifican el timestamp del ObjectId de
  serie; el del UUIDv7 hay que parsearlo. Mitigado con `timestamps: true` (`createdAt` explícito).
- **No se puede apuntar a colecciones existentes con `_id` de ObjectId**: el emitido asume base
  nueva. Integrar con una base heredada exigiría otra decisión.
- **Nadie autogenera el id**: un `insert` a mano sin `_id` falla (el dominio siempre lo pone).

Lo que NO se pierde, y hace viable la decisión: **la localidad de escritura**. UUIDv7 es ordenado en
el tiempo, así que los inserts van al extremo derecho del índice igual que con ObjectId (con UUIDv4
sí sería un problema serio).

Válvula de escape si el espacio llegara a doler: guardar el UUID como `BinData` subtipo 4 (16 bytes),
manteniendo una sola identidad y el contrato intacto; precio, ids ilegibles en mongosh y conversión
en el mapper. No se hace ahora (YAGNI).

---

> Aprobado en brainstorming 2026-07-31 (diseño consolidado en `DESIGN.md`).
