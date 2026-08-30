# Tareas atómicas: bloqueo optimista (spec 78)

> Cada tarea = un commit en develop. TDD estricto: test rojo antes de producción.
> Orden: kernel → dominio → persistencia → aplicación → front → oro. Las plantillas se validan
> con golden-diff; el re-baseline va al final de cada tanda para que el diff sea explicable.

## Kernel y dominio

- [x] TASK-01: `ConcurrencyConflictError` en `errors.ts.template` (409, mensaje con entidad e
      id) + test del generador que afirma su presencia en el kernel emitido.
- [x] TASK-02: el agregado emitido gana `version` (create=1, toPrimitives/fromPrimitives,
      propiedad plana) — plantilla de dominio + tests emitidos del agregado.

## Persistencia

- [x] TASK-03: TypeORM — columna `version` en la entidad + migración; `save()` condicional con
      `version: () => 'version + 1'` y ConcurrencyConflictError si `affected === 0` (composición:
      check solo en el padre). Test de integración emitido: dos saves, uno gana, otro 409.
- [x] TASK-04: Mongoose — campo `version` en el schema; `findOneAndUpdate({_id, version},
      {$set, $inc})`, `null` → error. Test de integración emitido equivalente.

## Aplicación

- [x] TASK-05: `UpdateXInput.version` (`@IsInt @Min(1)`) + check en el use case de update antes
      de mutar. Tests unit emitidos: versión desfasada → error, el repo no recibe save.
- [x] TASK-06: input de transición `{ id, version }` + check en el use case; handler, DTO y
      controller de transición transportan la versión. Tests unit emitidos.

## Front emitido

- [x] TASK-07: el modelo/DTO de lectura y el mapper exponen `version`; el diálogo de edición la
      captura al abrir y la envía en el submit. Spec de servicio emitido: el update envía version.
- [x] TASK-08: los botones de transición envían la versión visible. Spec emitido.
- [x] TASK-09: manejo del 409 de concurrencia (name === 'ConcurrencyConflictError'): aviso
      «otro usuario ha modificado este registro» + reload; los demás 409 intactos.

## Oro y gates

- [x] TASK-10: re-baseline completo (4 fixtures + app/ + app-mongo/), golden-diff vacío,
      typecheck emitido 0 errores, `npm run web:build` verde. Verificación con demo regenerada:
      dos ediciones concurrentes por HTTP → un 200 y un 409.
