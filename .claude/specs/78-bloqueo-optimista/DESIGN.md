# Diseño: bloqueo optimista por defecto (spec 78)

> Enfoque A aprobado 2026-08-30: el dominio es el dueño del check; el repositorio caza la
> carrera residual con escritura condicional. Dos capas, un solo error de dominio, simétrico
> TypeORM/Mongoose.

## Flujo del choque

```
usuario A                 usuario B                  servidor
   |  GET ficha (v=3)        |                          |
   |                         |  GET ficha (v=3)         |
   |  PUT {…, version:3} --------------------------->  use case: get() → v=3, ok
   |                         |                          save() WHERE id AND version=3 → v=4
   |                         |  PUT {…, version:3} -->  use case: get() → v=4 ≠ 3
   |                         |  <-- 409 ConcurrencyConflictError
   |                         |  «otro usuario ha modificado este registro» + recargar
```

La carrera residual (dos peticiones que pasan el get con la misma versión, milésimas) la caza
la segunda capa: el update condicional afecta 0 filas y lanza el mismo error.

## 1. Kernel — error compartido

`errors.ts.template` gana:

```ts
export class ConcurrencyConflictError extends BaseCustomError {
  constructor(entity: string, id: string, cause?: unknown) {
    super(`${entity} with id "${id}" was modified by another user. Reload and retry.`, http.CONFLICT, cause)
  }
}
```

El filtro HTTP existente ya usa `getStatus()`/`getResponse()`: 409 con `name` distinguible del
de transición ilegal. Cero cambios en la frontera HTTP.

## 2. Dominio emitido

- `version: number` como propiedad plana del agregado (como `deletedAt`, no VO: es plomería
  de persistencia, no concepto de negocio).
- `create()` la inicia a 1; `toPrimitives()`/`fromPrimitives()` la transportan.
- El agregado NO la incrementa: incrementar es cosa del repositorio al persistir (única
  fuente del contador; evita dobles incrementos con composición).

## 3. Persistencia

**TypeORM** (`typeorm-__fileName__.entity.ts` + migración + repositorio):

- Columna `version int NOT NULL DEFAULT 1`.
- `save()`: `repository().update({ id, version }, { …campos, version: () => 'version + 1' })`;
  `affected === 0` → releer para distinguir «no existe» (EntityNotFoundError aguas arriba ya
  lo cubre; aquí basta lanzar ConcurrencyConflictError). `register()` sigue con `save` plano.
- Composición: el check y el incremento van SOLO en la fila del padre; hijas como hoy
  (upsert + soft-delete de huérfanas dentro de la misma unidad).

**Mongoose** (`mongoose-__fileName__.repository.ts` + schema):

- Campo `version` en el schema (no el `__v` de Mongoose: contrato explícito y simétrico).
- `save()`: `findOneAndUpdate({ _id, version }, { $set: {…}, $inc: { version: 1 } })`;
  `null` → ConcurrencyConflictError.

## 4. Aplicación

- `UpdateXInput` gana `version: number` (`@IsInt() @Min(1)`); el use case de update compara
  `input.version !== primitives.version` → error, ANTES de `updateDetails`.
- El input de transición pasa de `{ id }` a `{ id, version }`, mismo check antes de
  `entidad.verbo()`. El handler/DTO/controller de transición transportan la versión.
- `app.updatesExpr` NO incluye `version` (el cliente no la escribe; la incrementa el repo).

## 5. Front emitido

- El modelo/DTO de lectura expone `version`; el mapper la conserva.
- Diálogo de edición: guarda la versión del registro al abrir, la envía en el submit.
- Botones de transición: envían la versión del registro visible en la ficha/fila.
- Interceptor/manejador del 409: si `error.name === 'ConcurrencyConflictError'`, toast
  «Otro usuario ha modificado este registro. Recarga para ver los cambios.» + `reload()`;
  cualquier otro 409 (transición ilegal, unique) conserva su tratamiento actual.

## 6. Tests (plantillas de tests emitidos + gates)

- Unit use case update/transición: versión desfasada → `ConcurrencyConflictError`, el repo no
  recibe `save`.
- Integración TypeORM y Mongoose: dos `save` con la misma versión leída — el primero gana
  (v+1), el segundo lanza. (Integración exige BD: queda fuera del gate CI como siempre.)
- Spec del servicio front: el update y la transición envían `version`.
- Gates: suite del generador verde → golden-diff vacío tras re-baseline (4 fixtures +
  `app/` + `app-mongo/`) → typecheck emitido → `npm run web:build`.

## Riesgos

- Es la spec que más oro toca desde la 38: mucho re-baseline, poca lógica. Hacer el
  re-baseline por tandas (backend → front) para que cada commit deje el diff explicable.
- Apps ya entregadas: se curan regenerando (doctrina de siempre); la migración nueva crea la
  columna con DEFAULT 1, sin backfill especial.
