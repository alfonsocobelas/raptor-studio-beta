# Spec 76: database=mongo de punta a punta

> Origen: idea 38 del backlog (`ROADMAP.md:529`, 2026-08-29).
> Auditoría previa hecha el 2026-08-30 (esta spec la incorpora como hallazgo, ver abajo).

## Contexto de negocio

La ranura `database` ofrece `mongo` en el CLI y en el wizard del estudio («Antes de generar»),
pero la opción nunca se ha verificado de punta a punta como se hizo con las demos Postgres:
elegir Mongo en el estudio → app generada que arranca, sincroniza índices, siembra y pasa su
suite contra un Mongo real. La idea 38 nace de la sospecha de que el camino mongo quedó
desfasado respecto a todo lo que entró después por TypeORM.

**Hallazgo de la auditoría (2026-08-30), que reencuadra la spec**: el camino mongo está mucho
más al día de lo que dice el ROADMAP. Aggregate simple y agrupado (specs 71-72), composición
por subdocumentos embebidos, borrado suave con arrastre, transiciones, denormalización,
auditoría, seeds, health y la suite de integración con replSet existen y están congelados en
la fixture `app-mongo` (re-baselineada 2026-08-29, mismo commit que `app/`). Los huecos reales
son otros:

1. **Bug**: `resource.ts:220-231` borra el repositorio con ruta hardcodeada a
   `persistence/typeorm/typeorm-*.repository.ts` cuando `!aggregate.emitAggregate`; con mongo
   se emite un `mongoose-*.repository.ts` **vacío** que nadie borra.
2. **Cobertura del gate**: el comando de `app-mongo` en `tools/golden-diff.sh`
   (`--models=customer,contract,license --database=mongo --dashboard --infra=none`) no ejercita
   KPIs/aggregate en frontend, ni calendario/kanban, ni el modelo con hijos+historial que sí
   cubre `--app=golden`. Lo que no está en la fixture puede romperse sin que el gate lo vea.
3. **Verificación real pendiente**: nunca se ha conducido una demo mongo end-to-end desde el
   estudio con el feature-set actual. Incluye el fleco vivo de la spec 38 (TASK-07): el
   arrastre del borrado suave por el adapter Mongoose nunca se probó contra un Mongo real.
4. **Degradaciones declaradas** (honestas, con aviso o error): auth single-tenant (y con él
   sessionStore, IAM UI, mi-cuenta, rate-limit), adjuntos, código de negocio, e IaC (los tres
   proveedores aprovisionan siempre Postgres). Son huecos conocidos, no regresiones.
5. **ROADMAP desactualizado**: `ROADMAP.md:47` (spec 06 «Activa») y `:211` («falta golden
   mongo + suite integración») contradicen el TASKS.md de la spec 06 (12/12 hechas) y la
   fixture actual.

## User stories (formato EARS)

- WHEN genero una app con `--database=mongo` y un modelo sin agregado (`emitAggregate=false`)
  THEN no queda ningún fichero vacío en `persistence/mongoose/` (el borrado sale del
  manifiesto de persistencia, no de una ruta typeorm fija).
- WHEN el gate de oro regenera `app-mongo` THEN el comando ejercita el mismo feature-set que
  la fixture postgres rica (KPIs/aggregate agrupado, modelo con hijos, transiciones,
  calendario/kanban si aplica), de modo que una regresión mongo en esos rasgos rompe el diff.
- WHEN elijo MongoDB en «Antes de generar» del estudio y genero THEN la app emitida arranca
  contra el Mongo del `docker-compose.local.yml`, sincroniza índices (`syncIndexes`), siembra,
  y responde readiness con `database: up`.
- WHEN ejecuto la suite emitida (`npm run test:integration` + unit + typecheck) de esa app
  THEN queda verde contra el replSet real.
- WHEN borro (soft delete) un padre con hijas relacionadas en la app mongo THEN el arrastre
  marca las relacionadas en la misma transacción y deja de listarlas (cierra TASK-07 de la
  spec 38, contra Mongo real).
- IF un modelo pide adjuntos o código de negocio con `database=mongo` THEN el generador sigue
  fallando con el error explícito actual (no se implementan en esta spec).
- WHEN termina la spec THEN el ROADMAP refleja la realidad: spec 06 cerrada, tabla de ranuras
  sin la nota estancada, idea 38 resuelta con puntero a esta spec.

## Criterios de aceptación

- [ ] Test rojo → verde del bug de `resource.ts` (borrado por manifiesto); golden-diff vacío
      tras el fix (o re-baseline justificado si la fixture contenía el fichero vacío).
- [ ] Comando de `app-mongo` en `golden-diff.sh` ampliado + re-baseline deliberado de la
      fixture; el diff de oro queda vacío al regenerar.
- [ ] Demo real generada desde el estudio (o CLI con los mismos args que emite el estudio):
      arranque + seeds + readiness + suite completa verde contra Mongo replSet en Docker.
- [ ] Arrastre de borrado padre→hijas verificado por HTTP contra la demo (fleco spec 38
      TASK-07 cerrado y anotado en su TASKS.md).
- [ ] Defectos que aparezcan en la demo se arreglan **en el generador** (test rojo + golden),
      nunca a mano en la app generada.
- [ ] ROADMAP.md actualizado (líneas 47 y 211, idea 38).

## Referencias del proyecto de referencia

- Manifiesto de motores: `libs/generators/src/generators/app/persistence/{provider,registry,mongo.provider}.ts`
- Plantillas mongo: `kernel/files-mongo/`, `resource/files-persistence-mongoose/`, `app/files-engine-mongo/`
- Gate: `tools/golden-diff.sh` (función `gate_app`, invocación `app-mongo`)
- Fleco de arrastre: `.claude/specs/38-borrado-suave-canonico/TASKS.md` (TASK-07)
- Precedente de demo verificada: memoria «Demo veterinaria 2026-08-24» y «Demo taller 2026-08-18»

## Reglas de negocio aplicables

- Las demos detectan, no se parchean: fallo en demo ⇒ arreglo en generador + golden.
- Gate de oro antes de cada commit que toque plantillas o `generator.ts`.
- Plantillas tontas: cualquier lógica nueva va a `generator.ts`/helpers, no a EJS.
- Un `mongod` nativo en 127.0.0.1:27017 puede ganar el loopback al contenedor (aviso spec 06).

## Fuera de scope (deliberado)

- **Port de auth a Mongoose** (y sessionStore/IAM UI/mi-cuenta/rate-limit): sigue siendo
  degradación declarada. Es una spec propia si algún cliente lo pide.
- **Adjuntos y código de negocio con mongo**: siguen fallando con error explícito.
- **IaC para Mongo** (Atlas/CosmosDB/self-hosted): los proveedores de infra siguen emitiendo
  Postgres; la demo mongo se hace con `--infra=none` o local.
- **Multi-tenant, papelera, import CSV**: sin cambios (retirados o pendientes de otra spec).
