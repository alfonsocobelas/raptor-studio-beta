# Diseño técnico: {Nombre de la feature}

> Solo rellenar cuando `REQUIREMENTS.md` esté aprobado.

---

## Capa backend (si aplica)

### Bounded Context / módulo

- Contexto: `{sap-licensing | catalog | ...}`
- Módulo: `{contracts | licenses | customers | ...}`
- Schema PostgreSQL: `{schema_name}`

### Entidades de dominio

- **{Entity}** (AggregateRoot)
  - VOs: `{Entity}Id`, `{Entity}Name`, `{Entity}Status`, ...
  - Errores: `{Entity}Error`
  - Constantes: `{ENTITY}_CONSTANTS` (longitudes, rangos)

### Repositorio (port)

- `{Entity}Repository extends abstract class`
  - Métodos: `get(id)`, `matching(criteria)`, `exists(criteria)`, `count(criteria)`, `register(agg)`, `save(agg)`

### Specifications

- `{Entity}With{Criterio}Specification.with{Criterio}({arg})`
- `{Entity}{Criterio}Specification.{semantic}()`

### Use cases

- `Register{Entity}UseCase` → input `Register{Entity}Input` → no return
  - Errores: `EntityNotFoundError`, `AlreadyExistsError`, `{Entity}Error`
- `Update{Entity}UseCase` → input `Update{Entity}Input` → no return
- `Remove{Entity}UseCase` → input `{ id }` → no return
- `Search{Entity}sUseCase` → input `Search{Entity}sInput` → `OffsetPaginatedOutput<{Entity}Dto>`

### Endpoints HTTP

- `POST /api/v1/{entities}` — `Register{Entity}Dto` → 204
- `GET /api/v1/{entities}` — `PaginateOffsetDto` → `OffsetPaginatedOutput<{Entity}Dto>`
- `GET /api/v1/{entities}/:id` → `{Entity}Dto` / 404
- `PUT /api/v1/{entities}/:id` — `Update{Entity}Dto` → 204
- `DELETE /api/v1/{entities}/:id` → 204

### Migración TypeORM

- Crear schema si no existe
- Tabla con todos los campos (snake_case)
- Índices: UNIQUE en campos únicos, INDEX en FKs lógicas y filtros frecuentes

---

## Capa frontend (si aplica)

### Componentes a crear

- `{Feature}ListComponent` — listado con DataTable
- `{Feature}DetailComponent` — vista de detalle 360 (si aplica)
- `{Feature}DialogComponent` — diálogo de crear/editar
- `{Feature}KpiCardsComponent` — tarjetas de KPIs (si aplica)

### Servicio

- `{Entity}Service` (`providedIn: 'root'`)
  - Signal de `request` (page, pageSize, filters)
  - `resource<{Entity}sListOutput>` para el listado
  - `create()`, `update()`, `remove()` con `reload()`
  - `computed()` de KPIs si aplica

### Rutas

- `/sap-licensing/{ruta}` → `{Feature}ListComponent`
- `/sap-licensing/{ruta}/:id` → `{Feature}DetailComponent`
- `/sap-licensing/{ruta}/{subruta}` → `{Feature}{Variant}Component`

### Menú lateral

- Entrada en `navigation-data.ts`:
  ```ts
  { icon: lucide{Icon}, label: '{Label}', route: '/sap-licensing/{ruta}' }
  ```

---

## DTOs compartidos (`libs/shared/domain`)

```typescript
// libs/shared/domain/src/{entity}/{entity}.dto.ts
export interface {Entity}Dto {
  id: string
  // ... resto de campos
  createdAt: string
  updatedAt: string
}

// libs/shared/domain/src/{entity}/register-{entity}.dto.ts
export interface Register{Entity}Dto {
  // campos del input (sin id, sin metadatos generados)
}
```

Enums compartidos (si aplican):

```typescript
// libs/shared/domain/src/{entity}/{entity}-enums.ts
export enum {Entity}StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
```

---

## Decisiones técnicas

| Decisión     | Opción elegida      | Razón                     |
| ------------ | ------------------- | ------------------------- |
| Paginación   | `offset` / `cursor` | {razón concreta del caso} |
| {decisión 2} | ...                 | ...                       |

---

## Riesgos identificados

| Riesgo            | Probabilidad    | Impacto         | Mitigación |
| ----------------- | --------------- | --------------- | ---------- |
| {riesgo concreto} | baja/media/alta | bajo/medio/alto | {plan}     |

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `TASKS.md` hasta aprobación explícita del usuario.
