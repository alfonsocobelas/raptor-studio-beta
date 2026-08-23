# Tasks: Campos desnormalizados en el resource-schema

> Cada tarea = un commit atómico en `develop`. TDD estricto; las que tocan plantillas
> pasan por `/golden-diff` antes del commit.

- [x] **TASK-01** — `libs/schema`: validar `form.lookup` en `validateField` (resource/labelField no vacíos; `denormalizes` nombra un campo existente; el destino no declara `form`). Tests primero en `define-resource.spec.ts`.
- [x] **TASK-02** — Generador backend: el campo desnormalizado deja de viajar en escritura y el use case hace el lookup.
  - `build-substitutions.ts`: derivar `denormalizations[]` del schema (lógica, no plantillas).
  - `build-entrypoints.ts`: excluir destinos de denormalización de `registerDtoFields`/`updateDtoFields`.
  - Input de aplicación: generalizar el `Omit` del patrón `code` a lista de claves.
  - `build-application.ts` + plantillas de use cases: inyección del repo origen, lookup, `EntityNotFoundError`, copia en register y en update-si-cambia-el-FK.
  - Plantilla del módulo: import del módulo origen (maquinaria `dragModules`, deduplicada).
  - Tests emitidos (`files-tests-application`): mock del repo origen + casos nuevos.
  - Tests del generador + re-baseline golden (`contracts`, `projects`, apps si aplica) con diff revisado.
- [x] **TASK-03** — Generador frontend: el diálogo deja de enviar el campo (`denormLines` fuera de `formValueExtras`); verificar que el pipe emitido no usa `forbidNonWhitelisted`. Re-baseline golden.
- [x] **TASK-04** — Verificación: regenerar una app con lookup (fixture), typecheck + suite emitida en verde; comprobar que colar `customerName` por HTTP se ignora y FK inexistente da 404 (test emitido o smoke).

---

## Cierre (2026-08-23)

- Suite emitida de la app golden: **342/342 en verde** (incluye los tests nuevos: copia del canon, 404 por FK inexistente, refresco al cambiar FK, lookup con caché en import).
- Typecheck de la app emitida: 1 solo error, **preexistente y ajeno a la spec** — `processes/del-contrato-al-proyecto-implantado.controller.ts` importa `@sap-licenses/shared/domain` (alias inexistente); ya estaba congelado en la fixture. Arreglado en la misma sesión (cd7ae949): emitFlowProcesses recibe el alias de la app.
- Smoke HTTP en vivo no ejecutado (requiere Postgres): la protección "colar el campo por HTTP" la da `forbidNonWhitelisted: true` (400) + el use case que nunca lee el campo del input; cubierto por tests emitidos y de generador.
