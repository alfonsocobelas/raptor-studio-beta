---
name: tdd-enforcer
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when the user asks to implement, code, write, or create any production logic:
  use cases, value objects, aggregate roots, repositories, services, components,
  controllers, handlers, mappers, specifications. Use when the user says "implementa",
  "crea el", "haz el", "escribe el", "código de", "test de", "TDD". CRITICAL: this
  skill enforces test-first; never write production code without a failing test first.
---

# TDD estricto — Red → Green → Refactor

> **Contexto acelerador**: aplica tanto al código del generador (`generator.ts`, helpers de `libs/schema`)
> como al código emitido. Para plantillas EJS el ciclo RED→GREEN es el **diff de oro** (skill `golden-diff`):
> el diff no vacío es el test fallido. Las rutas de capas de abajo describen el código EMITIDO
> (canon: `docs/referencia/libs/`).

**No se escribe código de producción sin un test fallido previo.** Esta es la regla más importante del proyecto.

## El ciclo obligatorio

```
1. RED:    Escribe el test (debe fallar)
2. GREEN:  Escribe el código MÍNIMO para que el test pase
3. REFACTOR: Limpia sin romper el test
4. Repite
```

**Nunca generes el fichero de producción y el test en el mismo paso.** Primero el test, luego el código de producción.

## Orden por capas — backend (ciclo TDD unificado)

### 1. Dominio (VOs y AggregateRoot)

Ficheros sin lógica primero (sin test):

```
{entity}-constants.ts
{entity}-enums.ts
{entity}-types.ts
{entity}-errors.ts
```

Luego TDD:

```
{entity}.vo.test.ts        →  value-objects/*.vo.ts
{entity}.test.ts           →  {entity}.ts (AggregateRoot)
```

VOs con property-based testing (`fast-check`) cubriendo: valor vacío/nulo, por debajo del mínimo, por encima del máximo, valor válido.

### 2. Aplicación (Use Cases)

Antes de los tests:

```
mothers/{entity}.mother.ts + {entity}.builder.ts
mocks/{entity}.repository.mock.ts
```

Luego TDD:

```
{action}-{entity}-usecase.test.ts  →  dtos/{action}-{entity}-input.dto.ts
                                   →  use-cases/{action}-{entity}-usecase.service.ts
                                   →  handlers/{action}-{entity}.handler.ts
                                   →  config/search-{entity}-config.ts
```

### 3. Infraestructura (Repository TypeORM)

```
typeorm-{entity}.repository.test.ts  →  typeorm-{entity}.entity.ts
                                     →  typeorm-{entity}.mapper.ts
                                     →  typeorm-{entity}.repository.ts
                                     →  migración TypeORM
```

Tests de integración contra DB real, sin mocks de repositorio.

### 4. E2E (cierre)

```
{action}-{entity}.e2e.test.ts  →  entrypoints/dtos/{action}-{entity}.dto.ts
                               →  entrypoints/{entity}.controller.ts
                               →  {module}.module.ts
```

El test e2e actúa como test de aceptación. Si pasa, la feature está completa.

## Orden por capas — frontend

```
1. RED:  Test del servicio (HttpTestingController.expectOne + flush mock)
2. GREEN: Implementación del servicio con resource()
3. RED:  Test del componente con @testing-library/angular
4. GREEN: Implementación del componente
```

Mocks de servicio en componente:

```typescript
const mockService = {
  contracts: signal([ContractMother.create()]),
  isLoading: signal(false),
  error: signal(undefined)
}
TestBed.configureTestingModule({
  providers: [{ provide: ContractsService, useValue: mockService }]
})
```

Queries semánticas siempre: `getByRole`, `getByText`, `getByLabelText`. **No verificar implementación interna.**

## Reglas para tests

### Backend

- Estructura **AAA explícita** con comentarios `// ARRANGE`, `// GIVEN`, `// WHEN`, `// THEN`.
- Fixtures siempre con **Object Mother + Builder**. Nunca constructores inline.
- Mocks de repositorio con helpers semánticos: `givenFound()`, `givenNotFound()`, `givenAlreadyExists()`, `assertCalledWith()`, `assertNotCalled()`.
- Dominio: property-based con `fast-check` para invariantes.
- **Comportamiento falsy en métodos de actualización** (`updateDetails` y similares): TODOS los campos del update llevan fijado su comportamiento ante un valor falsy, sin excepción y en dos variantes:
  - Campo cuyo VO **acepta** el falsy (`false` booleanos, `0` numéricos con `MIN: 0`, `''` strings opcionales sin `ensureIsString`): test de que la actualización **se aplica** (ej. `isFavorite: false`, `totalValue: 0`, `notes: ''`).
  - Campo cuyo VO **rechaza** el falsy (`ensureIsString`, enums, UUIDs, fechas, `MIN ≥ 1`): test de que updateDetails **lanza** en vez de ignorar en silencio — `it.each([{ campo: '' }, …])('throws instead of silently ignoring %o', …)`.

  Motivo: un guard `if (updates.campo)` en vez de `if (updates.campo !== undefined)` convierte ambos casos en no-op silencioso y NI la cobertura de líneas NI los tests de happy path lo detectan. Sin estos tests, la suite en verde NO protege refactors de los guards. Los guards de "campo presente" se escriben siempre con `!== undefined` (o `'campo' in updates` para nullables), nunca con check truthy — uniformemente en todos los campos, aunque para alguno el truthy fuera equivalente.

  Para saber si un VO acepta un falsy, leer TAMBIÉN las clases base (`StringValueObject.ensureIsString` rechaza `''` y whitespace; patrón del repo de referencia `docs/referencia/libs/backend/`), no solo el `create()` concreto.
- IDs de mocks: UUIDs reales generados con `generateId()`.
- **Clases base de Value Object** (`StringValueObject`, `BooleanValueObject`, `NumberValueObject`, `IntegerValueObject`…): aunque sean abstractas, llevan su propio test en `tests/modules/shared/domain/value-objects/`, usando una subclase concreta mínima inline (`TestXxxVo`) para poder instanciarla. No omitir el test por ser abstracta.

### Frontend

- Servicios: Vitest puro, sin `TestBed` salvo lo mínimo para `runInInjectionContext`.
- **IMPORTANTE**: en tests de servicio NO incluir `apiPrefixInterceptor`. `HttpTestingController` intercepta la URL cruda del servicio (`/api/v1/contracts`), no la prefijada.
- Componentes: `TestBed` + `@testing-library/angular`.
- Verificar comportamiento observable, no estado interno.

## Si la petición es amplia

Si me pides "implementa el use case X", el primer mensaje que produces es:

1. El test del use case (fallando), con sus mocks.
2. **STOP**. Confirma que tengo que correr el test para verlo fallar.
3. Solo después de mi confirmación, implementas el código de producción.

Si me pides un módulo completo, **divide en subtareas siguiendo el orden TDD** y resuélvelas una a una confirmando antes de pasar a la siguiente. Cada subtarea = un commit atómico.
