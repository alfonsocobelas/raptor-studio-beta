# Spec 78: Bloqueo optimista por defecto en el emitido

> Idea 33 del ROADMAP (2026-08-29, apuntada por Alfonso; brainstorming 2026-08-30, enfoque A
> aprobado). El caso canónico: dos usuarios decrementan el mismo stock a la vez y el último
> en escribir pisa al primero. Hoy el emitido no tiene ninguna protección.

## Contexto de negocio

Toda escritura emitida es leer → mutar → `save` sin condición: ni columna de versión, ni
`FOR UPDATE`, ni transacción que cubra leer-decidir-escribir como unidad. Afecta a la edición
por formulario (dos personas con el diálogo abierto), a las transiciones de estado (dos
«Facturar» simultáneos) y a cualquier campo acumulativo. La protección debe ser **de serie**
(seguridad por defecto), sin ranura nueva en el schema, y **end-to-end**: la versión que el
usuario leyó viaja con su escritura, o el check solo cubre milésimas.

## User stories (formato EARS)

- WHEN se crea un agregado, THEN nace con `version = 1` y el listado/ficha la exponen en el DTO.
- WHEN el usuario edita por formulario, THEN el submit envía la `version` leída al abrir el
  diálogo, y el use case rechaza con 409 (`ConcurrencyConflictError`) si ya no es la actual.
- WHEN el usuario pulsa un botón de transición, THEN el POST envía la `version` de la ficha y
  el use case rechaza igual si otro la movió antes.
- WHEN la escritura pasa el check del use case pero otra escritura se cuela entre el get y el
  save, THEN el repositorio (update condicional por `id + version`) detecta 0 filas afectadas
  y lanza el mismo error de dominio.
- WHEN el front recibe el 409 de concurrencia, THEN avisa «otro usuario ha modificado este
  registro», ofrece recargar y NO pierde silenciosamente la escritura del otro.
- IF el 409 es de transición ilegal (guarda de estado), THEN el front lo distingue por el
  `name` del payload y conserva su mensaje de dominio actual.
- WHEN la app usa `database=mongo`, THEN el adapter Mongoose aplica el mismo contrato
  (`findOneAndUpdate` por `_id + version` con `$inc`).

## Criterios de aceptación

- [ ] `ConcurrencyConflictError` en los errores compartidos del kernel, con `http.CONFLICT`.
- [ ] El agregado emitido lleva `version` en `create`/`toPrimitives`/`fromPrimitives` (propiedad
      plana, no VO); la entidad TypeORM lleva la columna y la migración la crea.
- [ ] `save()` de ambos repositorios es condicional: choque = `ConcurrencyConflictError`;
      `register()` sigue plano. En composición, el check vive en la fila del padre.
- [ ] `UpdateXInput` y el input de transición llevan `version` validada en el borde; el use
      case compara antes de mutar.
- [ ] El diálogo de edición y los botones de transición reenvían la versión; el 409 de
      concurrencia se avisa y se recarga.
- [ ] Tests emitidos: unit del use case (choque → error), integración de ambos repositorios
      (dos saves con la misma versión: uno gana, otro 409), spec del servicio front.
- [ ] Golden-diff vacío tras re-baseline (4 fixtures + `app/` + `app-mongo/`) y
      `npm run web:build` del emitido verde.

## Decisiones cerradas en el brainstorming (2026-08-30)

- **Alcance**: por defecto en TODOS los agregados; sin ranura nueva en el schema.
- **Al chocar**: 409 y el usuario reintenta. Sin retry automático.
- **Versión end-to-end**: DTO de lectura → formulario/botón → use case.
- **Pesimista**: aparcado (regla de los dos; esperar al caso que el optimista no resuelva).
- **Operaciones**: update + transiciones. Delete y las hijas de composición quedan fuera
  (borrar es idempotente; las hijas siguen al padre).
- **Mongoose**: entra aquí — el contrato del repositorio es uno.
- **Dueño del check**: el dominio/aplicación (enfoque A). Descartados `@VersionColumn` (TypeORM
  no comprueba al `save`, asimétrico con Mongo) y el check solo en el use case (deja viva la
  carrera get→save).

## Referencias del proyecto

- `libs/generators/src/generators/kernel/files/contexts/shared/domain/errors.ts.template` —
  errores compartidos con `getStatus()` (el filtro HTTP ya traduce).
- `files-application/use-cases/update-__fileName__-usecase.service.ts.template` y
  `files-transition/use-cases/__transitionFile__-usecase.service.ts.template` — los dos
  use cases que ganan el check.
- `files-persistence-typeorm/.../typeorm-__fileName__.repository.ts.template` y
  `files-persistence-mongoose/.../mongoose-__fileName__.repository.ts.template` — los saves.

## Fuera de scope (deliberado)

- Bloqueo pesimista (`SELECT … FOR UPDATE`) y ranura `concurrency` en el schema.
- Check de versión en delete/bulk y en add/update/remove de hijas de composición.
- Retry automático en el servidor.
- Merge de cambios en el front (three-way): solo avisar + recargar.
