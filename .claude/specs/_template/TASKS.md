# Tareas atómicas: {Nombre de la feature}

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.
> Orden TDD obligatorio: dominio → aplicación → infraestructura → e2e (backend); servicio → componente (frontend).

---

## Backend — Dominio

- [ ] **TASK-01**: Crear `{entity}-constants.ts`, `{entity}-enums.ts`, `{entity}-types.ts` (sin tests, no hay lógica)
- [ ] **TASK-02**: Crear `{entity}-errors.ts` (extends `BusinessRuleViolationError`)
- [ ] **TASK-03**: Tests property-based + implementación de VOs en `value-objects/` (uno por commit si son muchos)
- [ ] **TASK-04**: Tests + implementación del AggregateRoot `{entity}.ts`
- [ ] **TASK-05**: Interface `{entity}.repository.ts` (sin tests, es port abstracto)
- [ ] **TASK-06**: Specifications en `specifications/` (sin test propio, se validan en integración del repo)

## Backend — Soporte de tests

- [ ] **TASK-07**: Crear `{entity}.mother.ts` + `{entity}.builder.ts`
- [ ] **TASK-08**: Crear `{entity}.repository.mock.ts`

## Backend — Aplicación

- [ ] **TASK-09**: Crear `{entity}-input-mapper.ts` (Factory — se valida en test del use case)
- [ ] **TASK-10**: DTO + Test + implementación de `Register{Entity}UseCase`
- [ ] **TASK-11**: Handler `Register{Entity}Handler` (delegación fina)
- [ ] **TASK-12**: `search-{entity}-config.ts` (allowedFilters, allowedOrders)
- [ ] **TASK-13**: Test + implementación de `Search{Entity}sUseCase` (paginación)
- [ ] **TASK-14**: DTO + Test + implementación de `Update{Entity}UseCase` (si aplica)
- [ ] **TASK-15**: DTO + Test + implementación de `Remove{Entity}UseCase` (si aplica)

## Backend — Infraestructura

- [ ] **TASK-16**: Migración TypeORM (crear schema + tabla + índices, todo en la misma migración)
- [ ] **TASK-17**: Test integración + `TypeOrm{Entity}Entity` + `Mapper` + `Repository`

## Backend — E2E

- [ ] **TASK-18**: Test e2e + Controller + DTOs HTTP + `{Module}Module` para `POST /api/v1/{entities}`
- [ ] **TASK-19**: Test e2e + endpoint `GET /api/v1/{entities}` (search)
- [ ] **TASK-20**: Test e2e + endpoint `GET /api/v1/{entities}/:id`
- [ ] **TASK-21**: Test e2e + endpoint `PUT /api/v1/{entities}/:id`
- [ ] **TASK-22**: Test e2e + endpoint `DELETE /api/v1/{entities}/:id`

## DTOs compartidos

- [ ] **TASK-23**: Crear `{entity}.dto.ts`, `register-{entity}.dto.ts`, `update-{entity}.dto.ts` en `libs/shared/domain` + actualizar `src/index.ts`

## Frontend — Soporte de tests

- [ ] **TASK-24**: `{entity}.mother.ts` en `libs/frontend/tests/mothers/`
- [ ] **TASK-25**: `{entity}.mock.ts` en `libs/frontend/core/services/mocks/` (datos para fase mock)

## Frontend — Servicio

- [ ] **TASK-26**: Test + implementación de `{Entity}Service` con `resource()` y mocks
- [ ] **TASK-27**: Tests + métodos `create`, `update`, `remove` del servicio

## Frontend — Componentes

- [ ] **TASK-28**: Test + `{Feature}ListComponent` (solo render + estados loading/error/empty)
- [ ] **TASK-29**: Configurar columnas, badges y acciones del DataTable
- [ ] **TASK-30**: Test + `{Feature}DialogComponent` (formulario + validaciones)
- [ ] **TASK-31**: Integrar diálogo en list (botón "Nuevo" + edit por fila)
- [ ] **TASK-32**: Tests + flujo de borrado con `hlm-alert-dialog` de confirmación
- [ ] **TASK-33**: Test + `{Feature}DetailComponent` (si aplica)
- [ ] **TASK-34**: KPI cards con `computed()` (si aplica)

## Frontend — Routing

- [ ] **TASK-35**: Añadir rutas en `sap-licensing.routes.ts` (lazy loading)
- [ ] **TASK-36**: Añadir entrada en `navigation-data.ts` con icono lucide

## Validación final

- [ ] **TASK-37**: `/golden-diff` — diffs de oro vacíos (si la spec tocó plantillas/generator)
- [ ] **TASK-38**: `/arch-review libs/backend/.../modules/{module}/` — corregir violaciones
- [ ] **TASK-39**: `make test-back` + `make test-front` — suite completa (back + front) verde
- [ ] **TASK-40**: Smoke test manual del flujo completo (crear + editar + borrar + buscar + paginar)

---

## Regla del juego

- Implementar **UNA** tarea, `make commit`, esperar aprobación, siguiente.
- Si una tarea parece > 1h o > ~150 líneas, **partirla en subtareas** antes de empezar.
- Si descubres una dependencia oculta que la spec no contempla, **PARA** y reporta antes de seguir.
- Las tareas que no apliquen se marcan como `[x] TASK-XX: N/A` con motivo.
