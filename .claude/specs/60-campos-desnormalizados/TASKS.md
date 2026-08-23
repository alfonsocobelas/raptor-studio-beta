# Tasks: Campos desnormalizados en el resource-schema

> Cada tarea = un commit atómico en `develop`. TDD estricto; las que tocan plantillas
> pasan por `/golden-diff` antes del commit.

- [ ] **TASK-01** — `libs/schema`: validar `form.lookup` en `validateField` (resource/labelField no vacíos; `denormalizes` nombra un campo existente; el destino no declara `form`). Tests primero en `define-resource.spec.ts`.
- [ ] **TASK-02** — Generador backend: el campo desnormalizado deja de viajar en escritura y el use case hace el lookup.
  - `build-substitutions.ts`: derivar `denormalizations[]` del schema (lógica, no plantillas).
  - `build-entrypoints.ts`: excluir destinos de denormalización de `registerDtoFields`/`updateDtoFields`.
  - Input de aplicación: generalizar el `Omit` del patrón `code` a lista de claves.
  - `build-application.ts` + plantillas de use cases: inyección del repo origen, lookup, `EntityNotFoundError`, copia en register y en update-si-cambia-el-FK.
  - Plantilla del módulo: import del módulo origen (maquinaria `dragModules`, deduplicada).
  - Tests emitidos (`files-tests-application`): mock del repo origen + casos nuevos.
  - Tests del generador + re-baseline golden (`contracts`, `projects`, apps si aplica) con diff revisado.
- [ ] **TASK-03** — Generador frontend: el diálogo deja de enviar el campo (`denormLines` fuera de `formValueExtras`); verificar que el pipe emitido no usa `forbidNonWhitelisted`. Re-baseline golden.
- [ ] **TASK-04** — Verificación: regenerar una app con lookup (fixture), typecheck + suite emitida en verde; comprobar que colar `customerName` por HTTP se ignora y FK inexistente da 404 (test emitido o smoke).
