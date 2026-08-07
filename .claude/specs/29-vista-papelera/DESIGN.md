# Diseño técnico: Vista papelera

> Todo lo de abajo se EMITE por el generador, condicionado a `softDelete && list.features.delete`.
> Regla 8: las plantillas solo interpolan; la condición y los nombres se calculan en
> `build-substitutions.ts` (nueva bandera `trash: boolean` en las sustituciones).

---

## Condición de emisión

```
trash = definition.softDelete === true && app.removes === true
```

`app.removes` ya existe (gobierna remove use case + DELETE). La papelera cuelga de él.

## Capa backend emitida

### Port (domain/<name>-repository.ts)

```typescript
abstract matchingDeleted(criteria: Criteria): Promise<Entity[]>
abstract countDeleted(criteria: Criteria): Promise<number>
abstract restore(entityId: EntityId): Promise<void>
```

### Repositorio TypeORM

- `matchingDeleted` / `countDeleted`: mismos converters del criteria, con `withDeleted: true`
  y filtro `deletedAt Not(IsNull())`. Detalle de implementación: se resuelve en la tarea
  midiendo qué expone `TypeOrmRepository` (searchByCriteria) y se extiende lo mínimo.
- `restore`: `this.repository().restore({ id })`.

### Repositorio Mongoose

- El find de borrados es `{ deletedAt: { $ne: null } }` (el matching normal ya filtra
  `deletedAt: null`).
- `restore`: `updateOne({ id }, { $set: { deletedAt: null } })`.

### Aplicación

- `SearchDeleted<Plural>UseCase` — espejo de `Search<Plural>UseCase` (mismo search-config,
  misma paginación offset, mismo mapeo a DTO), sobre `matchingDeleted`/`countDeleted`.
- `Restore<Entity>UseCase` — input `{ id }`; si el id no existe borrado, no-op idempotente
  (misma semántica que remove: el repo no lanza).
- Handlers finos correspondientes.

### Entrypoints

- `GET /api/v1/<plural>/deleted` — MISMO DTO de salida que el search normal. ⚠️ La ruta se
  declara ANTES de `GET :id` en el controller (orden de matching de Nest).
- `POST /api/v1/<plural>/:id/restore` → 204.

### Tests emitidos

- Test de use case: `restore-<name>-usecase.test.ts` (mock de repositorio con
  `assertCalledWith`), y `search-deleted-<plural>` cubierto en el del search si el patrón de
  los tests emitidos lo permite sin duplicar arneses.
- Integración (dos motores): borrar → no está en `matching` → está en `matchingDeleted` →
  `restore` → vuelve a `matching`.

## Capa frontend emitida

### Servicio (<name>.service.ts)

- Señal `trashRequest` + `resource` contra `/deleted` (mismo shape que el listado).
- `restore(id)`: POST + `reload()` de ambos resources.

### Componente papelera

- `<name>-trash.component.ts`: DataTable con las MISMAS columnas del listado (sin acciones de
  crear/editar/borrar, sin export), una única acción por fila «Restaurar» (icono
  lucideArchiveRestore o equivalente ya disponible), sin confirmación.
- Cabecera con título «Papelera — <plural>» y enlace de vuelta al listado.

### Rutas y navegación

- Ruta `<ruta>/papelera` ANTES de `<ruta>/:id` (si hay detail).
- En el listado: botón/enlace «Papelera» en la toolbar (solo si `trash`).
- SIN entrada propia en el menú lateral: la papelera es subordinada del listado.

## Decisiones técnicas

| Decisión | Opción elegida | Razón |
| --- | --- | --- |
| Endpoint de borrados | `GET /<plural>/deleted` separado | Un filtro `?deleted=true` en el search contaminaría el criteria permitido y el gate de filtros |
| `deletedAt` en el DTO | NO se expone | El dominio no conoce la columna; subirla atravesaría las capas por una columna de UI (fuera de scope) |
| Confirmación al restaurar | Sin diálogo | Restaurar es la operación segura |
| Menú lateral | Sin entrada | La papelera es subordinada del listado; entrada propia = ruido |
| Restore de id inexistente | No-op 204 idempotente | Misma semántica que el DELETE actual |

## Riesgos identificados

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| El shape del golden de license/project cambia (ficheros nuevos) | segura | medio | Re-baseline deliberado, commit propio, revisando el diff completo |
| Colisión con la sesión concurrente (data-table.ts.template en vuelo) | media | medio | La papelera NO toca data-table; adds selectivos; re-mirar `git status` antes de cada commit |
| Ruta `/deleted` vs `:id` (matching de Nest) | baja | alto | Test e2e emitido pide `/deleted` y comprueba 200 con página, no 400 de UUID inválido |
| `TypeOrmRepository` base no expone hook para `withDeleted` | media | medio | Medir primero; si hace falta, método protegido nuevo en el repo base del kernel (con su test) |
