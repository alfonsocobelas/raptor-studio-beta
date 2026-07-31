# Tareas atómicas: Persistencia MongoDB/Mongoose

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.
> Gate permanente: en TODOS los commits el golden Postgres actual queda con diff vacío.

---

## Contrato y guard

- [x] **TASK-01**: Opción `database: 'postgres' | 'mongo'` en `app/schema.json` (default postgres,
      x-prompt) + propagación tipada a `kernel` y `resource`. Test: sin opción, la salida no cambia.
- [ ] **TASK-02**: Guard de plugins incompatibles: `database=mongo` + `auth` → error claro (con test).

## Kernel — infra compartida

- [ ] **TASK-03**: Config mongo emitida: bloque `database.uri` en `environments/*.json` +
      `config-types`/`config-validation` según motor (TDD en `kernel.spec.ts`).
- [ ] **TASK-04**: Plantillas `persistence/mongoose/`: `shared-persistence.module` +
      `mongoose.repository` base + `mongoose-transaction-manager`/`-context` (TDD kernel).
- [ ] **TASK-05**: `mongoose-criteria-converter` (Criteria → filter/sort/skip/limit), paridad de
      operadores con el converter TypeORM (TDD kernel).

## Resource — persistencia por módulo

- [ ] **TASK-06**: Plantillas `__fileName__.schema.ts` (UUIDv7, índices únicos + partialFilterExpression
      en opcionales) y `__fileName__.mapper.ts`; selección de directorio por motor en `resource.ts`
      (TDD en `resource.spec.ts`).
- [ ] **TASK-07**: Plantilla `mongoose-__fileName__.repository.ts` (port completo del dominio,
      composición como subdocumentos embebidos, mapeo E11000 → error de dominio).
- [ ] **TASK-08**: Plantilla de test de integración `mongoose-__fileName__.repository.test.ts`
      (espejo del de TypeORM: register/get, unique finders, criteria, ifPresent).

## App skeleton — arrange

- [ ] **TASK-09**: Compose mongo (`mongo:7` single-node replSet + healthcheck) en
      `docker-compose.{test,local}.yml` emitidos + variante mongoose de `jest.setup.integration` y
      arranger.
- [ ] **TASK-10**: Ensamblaje app mongo: deps (`mongoose`, `@nestjs/mongoose`), fuera `typeorm`/`pg`,
      Makefile sin targets de migración, migraciones de fábrica omitidas, `syncIndexes()` en bootstrap.

## Gate y verificación end-to-end

- [ ] **TASK-11**: Fixture golden `--database=mongo` en `tools/golden-fixtures`: revisión manual del
      emitido, congelar baseline, incorporar a `golden-diff.sh`.
- [ ] **TASK-12**: Demo generada con `--database=mongo`: suite completa verde (unit + integración
      contra mongo docker + e2e) y arranque real verificado.
