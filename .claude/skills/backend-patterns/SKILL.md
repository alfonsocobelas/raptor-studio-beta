---
name: backend-patterns
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when working in libs/backend on any NestJS code: use cases, value objects,
  aggregate roots, repositories, specifications, controllers, handlers, mappers,
  migrations. Use when the user says "use case", "repositorio", "agregado",
  "value object", "controller", "endpoint", "mapper", "specification", "criteria",
  "transacción", "migración".
---

> **Contexto acelerador (2026-07-29)**: esta skill ya no gobierna código escrito a mano, sino **el código
> que emiten las plantillas del generador**. La referencia viva es `docs/referencia/libs/backend/` (sap-licenses).
> Toda ruta `libs/backend/...` citada abajo se refiere a ese repo de referencia. Si una plantilla emite código
> que viola estos patrones, la plantilla está mal.

# Patrones de backend — extraídos del repositorio de referencia

Estos patrones están implementados en `../sap-licences-backend/`. Léelos ahí antes de implementar — **no improvises basándote en este resumen**.

## AggregateRoot — estructura exacta

```typescript
export class Contract extends AggregateRoot {
  private constructor(
    readonly id: ContractId, // inmutable: readonly directo
    readonly customerId: CustomerId,
    private _contractNumber: ContractNumber, // mutable: prefijo _ + getter
    private _status: ContractStatus,
    private _isActive: ContractIsActive
  ) {
    super()
  }

  //#region ... Getters ...
  get contractNumber(): ContractNumber {
    return this._contractNumber
  }
  get status(): ContractStatus {
    return this._status
  }
  //#endregion

  static create(props: ContractAggregateProps): Contract {
    return new Contract(
      props.id,
      props.customerId,
      props.contractNumber,
      ContractStatus.draft(), // defaults de dominio
      ContractIsActive.inactive()
    )
  }

  static fromPrimitives(props: ContractPrimitiveProps): Contract {
    return new Contract(
      ContractId.create(props.id),
      CustomerId.create(props.customerId),
      ContractNumber.create(props.contractNumber),
      ContractStatus.create(props.status),
      ContractIsActive.create(props.isActive)
    )
  }

  toPrimitives(): ContractDto {
    return {
      id: this.id.value,
      customerId: this.customerId.value,
      contractNumber: this._contractNumber.value,
      status: this._status.value,
      isActive: this._isActive.value
    }
  }
}
```

**Reglas críticas:**

- `private constructor`.
- Campos inmutables: `readonly` directo, sin prefijo.
- Campos mutables: prefijo `_` + getter público.
- `static create(props)` recibe **Value Objects ya construidos** (ensamblado interno / cuando ya tienes VOs).
- `static fromPrimitives(props)` reconstruye desde persistencia: **todos** los primitivos, sin defaults (round-trip exacto con `toPrimitives()`).
- `static register(props)` da de alta una entidad **nueva** desde primitivos parciales aplicando los **defaults de dominio**, y delega en `create()` (ver sección siguiente).
- Setters siempre privados. Mutaciones por métodos de negocio semánticos con `ensureXxx()` privados antes de mutar.

## Named constructor de alta (`register`) — los defaults de creación viven en el dominio, NO en mappers

El agregado tiene **tres puertas de entrada**, cada una con una intención distinta:

| Constructor             | Entrada              | Defaults | Cuándo                                            |
| ----------------------- | -------------------- | -------- | ------------------------------------------------- |
| `create(props)`         | Value Objects        | no       | ensamblado interno / cuando ya tienes VOs         |
| `fromPrimitives(props)` | todos los primitivos | no       | rehidratar desde persistencia (round-trip exacto) |
| `register(props)`       | primitivos parciales | **sí**   | alta de una entidad nueva                         |

**Regla:** los defaults de creación (`source='AVVALE_SOLD'`, `currency='EUR'`, `totalValue=0`…) son **reglas de negocio** y viven en `register`, dentro del agregado. **Nunca en un mapper de la capa de aplicación.** Un mapper que traduce primitivos→VOs y de paso aplica defaults es **anemia de dominio**: obliga a todo el que cree la entidad a pasar por él o a replicar los defaults, y `create()` deja de ser autosuficiente.

`register` parsea primitivos, aplica defaults y **delega en `create`**:

```typescript
static register(props: RegisterContractProps): Contract {
  return Contract.create({
    id: ContractId.create(props.id),
    contractType: ContractType.create(props.contractType),
    source: ContractSource.create(props.source ?? 'AVVALE_SOLD'), // default de dominio
    totalValue: ContractValue.create(props.totalValue ?? 0),
    currency: ContractCurrency.create(props.currency ?? 'EUR'),
    // … resto de VOs; los opcionales con su `?? default`
  })
}
```

**Reglas del patrón:**

- El shape de entrada del alta (`RegisterXProps`) vive en el **dominio** (`*-types.ts`): un named constructor de dominio no puede depender de un tipo de la capa de aplicación. **Pero** para mantener la simetría de "un input DTO por use case", `application/dtos/register-X-input.dto.ts` se conserva como **re-export** del tipo de dominio, y los consumidores de la capa de aplicación importan el `*Input` desde ahí (no el tipo de dominio a pelo):

  ```typescript
  // application/dtos/register-contract-input.dto.ts
  export type { RegisterContractProps as RegisterContractInput } from '../../domain/contract-types'
  ```

- Los consumidores de aplicación (use case de alta, handler, seeder) importan `RegisterXInput` desde `application/dtos` y llaman `Aggregate.register(input)` **directo**, sin mapper intermedio. El **servicio de sync** llama `Aggregate.register(...)` con spread cuando la fuente ya trae casi todos los campos: `Contract.register({ ...record, id, customerId })`.
- Campos que la fuente puede omitir → **opcionales** en `RegisterContractProps` con su default en `register`. Los verdaderamente obligatorios (`id`, `contractNumber`, `customerId`, `customerName`, `startDate`) → requeridos.
- La obligatoriedad específica de un flujo (p. ej. exigir `totalValue` en el alta manual) se valida en el **borde HTTP (DTO)**, no en el named constructor, que da un default sensato cuando el dato falta.

> Historia: refactor de anemia 2026-07-14. Antes los defaults vivían en un `*InputMapper` de aplicación; se movieron a `Aggregate.register` y el mapper se eliminó. El `*-input.dto.ts` se **conservó como re-export** del tipo de dominio (decisión de simetría entre módulos). Aplicado a contracts, customers, licenses y projects.

## Value Object — jerarquía y patrón

```typescript
// domain/value-objects/contract-number.vo.ts
import { StringValueObject } from 'src/contexts/shared/domain/value-objects/string-value-object'
import { CONTRACT_CONSTANTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

export class ContractNumber extends StringValueObject {
  protected static override fieldName = 'Contract number'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContractNumber {
    const normalized = value.trim().toUpperCase()
    this.validate(normalized)
    return new ContractNumber(normalized)
  }

  private static validate(value: string): void {
    if (!value) throw new ContractError(`${this.fieldName} cannot be empty`)
    if (value.length < CONTRACT_CONSTANTS.NUMBER_MIN_LENGTH) {
      throw new ContractError(`${this.fieldName} too short`)
    }
    if (value.length > CONTRACT_CONSTANTS.NUMBER_MAX_LENGTH) {
      throw new ContractError(`${this.fieldName} too long`)
    }
  }
}
```

**Jerarquía base** (todas en `src/contexts/shared/domain/value-objects/`):

- `ValueObject<T>` (root)
- `PrimitiveValueObject` extends ValueObject
- `StringValueObject` extends PrimitiveValueObject
- `IntegerValueObject` extends PrimitiveValueObject
- `NumberValueObject` extends PrimitiveValueObject
- `EnumValueObject` extends StringValueObject
- `DateValueObject` extends ValueObject<Date> (`toDateString`, `isBefore`, `isSameOrAfter`)
- `UuidV7ValueObject` extends StringValueObject
- `BooleanValueObject` extends PrimitiveValueObject

### `EnumValueObject` — `ensureIsValidEnum(value, VALUES)` → `InvalidArgumentError`

Para VOs enum (conjunto cerrado de valores): `extends EnumValueObject<XxxValue>` y validar en `create()` con
`ensureIsValidEnum(value, VALUES)`. La base lanza **`InvalidArgumentError`** (→ 400) con mensaje útil
(`... must be one of: ...`). **No hay `errorFactory`**: verificado en el repo (2026-07-13), la firma es de
dos parámetros y las 14 llamadas de enum VOs la usan así — no se lanza el error tipado del módulo en enums
(a diferencia del repo de referencia `../sap-licences-backend/`, que sí usa una `errorFactory`). El tipo
`XxxValue` es un union type de dominio (definido junto al VO o en `*-types.ts`), independiente de los enums de
`shared/domain` (que son de transporte).

```typescript
export class ContractType extends EnumValueObject<ContractTypeValue> {
  protected static override fieldName = 'Contract type'
  static readonly VALUES: readonly ContractTypeValue[] = ['cloud', 'onprem']
  private constructor(value: ContractTypeValue) {
    super(value)
  }
  static create(value: string): ContractType {
    this.ensureIsValidEnum(value as ContractTypeValue, this.VALUES)
    return new ContractType(value as ContractTypeValue)
  }
}
```

VOs de texto libre con longitud máxima (no enum, admiten `''`) → `StringValueObject` directo (ej. `BusinessModel`),
sin `ensureIsString` si la cadena vacía es válida.

### Naming de VOs — prefijo del agregado

El VO se nombra con el **término del negocio** (Ubiquitous Language), no con el nombre del sistema. El prefijo del agregado (`Contract…`, `Customer…`) se usa **solo para desambiguar**, no por mecánica:

- **Con prefijo** cuando el término base es una palabra genérica que, sola, sería ambigua o colisionaría: `Type`, `Status`, `Value`, `Number`, `Date`, `Source`, `Currency`, `Notes`, `Id` → `ContractType`, `ContractStatus`, `ContractValue`, `ContractNumber`… (`Value` además chocaría con el `.value` común a todos los VO).
- **Sin prefijo** cuando el término ya es específico de dominio y autoexplicativo: `BillingFrequency`, `RenewalType`, `SubSolutionAreas`, `BusinessModel`, `CmsCaseId`, `IsFavorite`. Prefijarlos (`ContractBillingFrequency`) sería ruido.

Regla mental: _¿este nombre, leído en su punto de uso (`contract.xxx`), es inequívoco sin el prefijo?_ Si sí → sin prefijo. Si no → prefija.

**No se renombra por estética.** La consistencia se aplica al escribir VOs nuevos, no en barridos masivos: un rename cosmético genera churn, invalida `git blame` y arriesga romper algo por cero valor funcional (Boy Scout Rule: se ajusta al tocar ese código por otra razón).

### Nulabilidad — `Nullable<T>`, no `undefined`, ni `T | null` a pelo

Un campo ausente en el dominio se expresa con **`null`** vía el alias `Nullable<T>` (`shared/domain/nullable.ts`), nunca con `undefined` (`?`), y nunca con `T | null` escrito a mano.

```typescript
private _startDate: Nullable<ContractDate>   // ✅
private _startDate: ContractDate | null      // ❌ mismo tipo, estilo inconsistente
private _startDate?: ContractDate            // ❌ undefined en el dominio
```

**Por qué `null` y no `undefined` (divergencia consciente del repo de referencia):**

- El repo de referencia (`../sap-licences-backend/`) usa `undefined` en el dominio y confina `null` a persistencia, traduciendo en el mapper (`?? undefined` al leer, `?? null` al guardar). Este proyecto **diverge a propósito**.
- **TypeORM/Postgres no aceptan `undefined`**: pasar `undefined` a una columna hace que TypeORM la **omita** del INSERT/UPDATE (bug silencioso), no que escriba `NULL`. Elegir `undefined` en el dominio _obliga_ a la conversión bidireccional en cada mapper. Usar `null` la elimina.
- `toPrimitives()` va a JSON: `undefined` **desaparece** del payload (`JSON.stringify` lo omite) → el DTO cambia de forma según el dato. `null` mantiene el contrato de la API estable (campo siempre presente). Crítico para un frontend de tablas/KPIs.
- En un aggregate reconstruido completo no hay "propiedad ausente" (undefined): el objeto siempre está entero. "Sin valor conocido" = `null` es la semántica correcta.
- **Consecuencia**: el mapper es _passthrough_, solo normaliza con `?? null` en `toPersistence` (p. ej. `domain.assignedKamId?.value ?? null`). No traduce null↔undefined.

**Excepción — DTOs de entrada (borde HTTP):** ahí sí se usa `?: T | null` combinado, porque la semántica PATCH distingue _ausente_ ("no toques este campo") de _null_ ("ponlo a vacío"). Eso es propio del DTO de entrada, no del estado del aggregate.

> Si algún día aparece un campo donde "no aplica" (undefined) tenga un significado de negocio **distinto** de "vacío/sin fijar" (null), ese campo concreto puede justificar `undefined` + conversión en su mapper. Documentarlo como excepción argumentada, no como patrón por defecto.

## Use Case — estructura exacta

```typescript
// application/use-cases/register-contract-usecase.service.ts
@Injectable()
export class RegisterContractUseCase {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

  async invoke(input: RegisterContractInput): Promise<void> {
    const props = ContractInputMapper.toDomain(input)

    // Validaciones paralelas (lecturas independientes)
    const [customer, alreadyExists] = await Promise.all([
      this.customerRepository.get(props.customerId),
      this.contractRepository.exists(withContractNumber(props.contractNumber))
    ])

    if (!customer) {
      throw new EntityNotFoundError('Customer', props.customerId.value)
    }
    if (alreadyExists) {
      throw new AlreadyExistsError('Contract', 'contractNumber', props.contractNumber.value)
    }

    const contract = Contract.create(props)
    await this.contractRepository.register(contract)
  }
}
```

## Repository — interface + implementación

```typescript
// domain/contract.repository.ts (port)
export abstract class ContractRepository {
  abstract get(id: ContractId): Promise<Contract | null>
  abstract matching(criteria: Criteria): Promise<Contract[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  abstract register(contract: Contract): Promise<void>
  abstract save(contract: Contract): Promise<void>
}

// infrastructure/persistence/typeorm/typeorm-contract.repository.ts (adapter)
@Injectable()
export class TypeOrmContractRepository
  extends TypeOrmRepository<Contract, TypeOrmContractEntity>
  implements ContractRepository {
  // hereda matching/count/exists del base. Implementa get/register/save específicos.
}
```

## Specification — extender Criteria

```typescript
// domain/specifications/contract-with-number.specification.ts
export class ContractWithNumberSpecification extends Criteria {
  constructor(number: ContractNumber) {
    super({
      filters: new Filters([
        new Filter(
          new FilterField('contractNumber'),
          FilterOperator.create(Operator.EQUAL),
          new FilterValue(number.value)
        )
      ])
    })
  }

  static withNumber(number: ContractNumber): ContractWithNumberSpecification {
    return new ContractWithNumberSpecification(number)
  }
}

// Re-export como función nombrada
export const withContractNumber = ContractWithNumberSpecification.withNumber
```

## Paginación — cursor vs offset (decisión caso a caso)

**Cursor**: dataset grande append-only (logs, historial, evidencias) o scroll infinito.

```typescript
const criteria = Criteria.fromCursor(input, allowedFilters, allowedOrders)
return paginateWithCursor(criteria, this.contractRepository, input.pageSize, c => c.toPrimitives())
// devuelve: { nextCursor, hasMore, items }
```

`fromCursor` **fuerza siempre un desempate `id asc`** (sin él la paginación por cursor puede repetir/saltar filas entre páginas), así que **`allowedOrders` DEBE incluir `'id'`** o `CriteriaValidator` lo rechaza. El `limit` sale como `pageSize + 1` para detectar si hay página siguiente.

Es **keyset pagination multi-columna** (no id-only): el `Cursor` VO (`shared/domain/query`) codifica en base64 la **posición** de la última fila —los valores de todas las columnas de orden + el `id`— junto a `filtersHash`/`ordersHash` y `createdAt` (caducidad 24h; valida que filtros/orden no cambien al decodificar). El `TypeOrmCriteriaConverter` traduce esa posición al predicado lexicográfico `(colA después de vA) OR (colA = vA AND id > vId)`, respetando ASC/DESC y NULLs (`ASC → NULLS LAST`, `DESC → NULLS FIRST`, explícito en el `ORDER BY`). `paginateWithCursor` (`shared/application`) pide `pageSize + 1`, detecta `hasMore` y codifica el `nextCursor` desde la última fila; devuelve `{ nextCursor, hasMore, items }` (`CursorPaginatedOutput`). Sin columna de usuario colapsa a `id > :cursor` (orden cronológico gracias a UUIDv7). **Ámbito validado con tests de integración: 0-1 columna de usuario (nullable) + `id`.** El código es genérico para N columnas pero N>1 no tiene test — si vas a ordenar por 2+ columnas, añade tests de integración antes de confiar en ello.

**Offset**: usuario salta a página concreta, ve total de registros (tablas de gestión).

```typescript
const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders)
const [items, total] = await Promise.all([
  this.contractRepository.matching(criteria),
  this.contractRepository.count(criteria)
])
return {
  total,
  page: input.page,
  pageSize: input.pageSize,
  totalPages: getTotalPages({ pageSize: input.pageSize, total }),
  items: items.map(c => c.toPrimitives())
}
// devuelve: { total, page, pageSize, totalPages, items }
```

**Si el caso no está claro, PREGUNTA antes de implementar.**

## Handler — delegación fina (sin lógica)

```typescript
// application/handlers/register-contract.handler.ts
@Injectable()
export class RegisterContractHandler {
  constructor(private readonly useCase: RegisterContractUseCase) {}

  async handle(dto: RegisterContractDto): Promise<void> {
    await this.useCase.invoke({ ...dto })
  }
}
```

**NO se testea un handler de delegación pura.** Un handler que solo hace `return this.useCase.invoke(input)` no tiene comportamiento propio: el test sería de cableado (`expect(useCase.invoke).toHaveBeenCalledWith(input)`), y ese cableado ya lo cubren el test del use case (lógica real) y el e2e/controller (la cadena HTTP→handler→use case contra la app montada). Escribir el test **solo cuando el handler gana lógica** (mapear/transformar el input, orquestar varios use cases, autorizar, decidir). Mientras sea un pass-through, no hay red que poner en rojo primero.

## Controller — entrypoint HTTP

```typescript
// infrastructure/entrypoints/contract.controller.ts
// Sin versión en el decorador: la aplica `defaultVersion: '1'` global → URLs /api/v1/contracts.
// NO usar `@Version('1')` ni `version:` aquí (salvo VERSION_NEUTRAL para health check).
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly registerHandler: RegisterContractHandler,
    private readonly searchHandler: SearchContractsHandler
  ) {}

  // Creación de recurso → 201 Created (default de NestJS en POST). NO poner @HttpCode.
  // El id lo genera el cliente (UUIDv7 en el body), así que no hay Location/body que devolver:
  // 201 con cuerpo vacío. Un POST-comando (logout, disable, accept-invitation) sí usa @HttpCode(204).
  @Post()
  async register(@Body() dto: RegisterContractDto): Promise<void> {
    await this.registerHandler.handle(dto)
  }

  @Get()
  async search(@Query(new ParseCriteriaPipe()) query: PaginateOffsetDto): Promise<OffsetPaginatedOutput<ContractDto>> {
    return this.searchHandler.handle(query)
  }
}
```

### Autorización: TODO endpoint declara sus roles

El `RolesGuard` global es **default-allow**: un handler sin `@Roles()` lo puede invocar **cualquier** usuario
autenticado. Eso convierte un olvido en un agujero silencioso, así que la regla del proyecto es explícita:

```typescript
@Post()
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)                        // escrituras
register(@Body() dto: RegisterContractDto): Promise<void> { … }

@Get()
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)   // lecturas
search(…): Promise<OffsetPaginatedOutput<ContractDto>> { … }
```

- **Escrituras** (`@Post`/`@Put`/`@Patch`/`@Delete`) → `@Roles(ADMIN, USER)`. El rol `viewer` es un auditor de
  solo lectura (spec 50) y debe recibir 403.
- **Lecturas** (`@Get`, incluidos `/export` y descargas) → `@Roles(ADMIN, USER, VIEWER)`.
- **Ni uno solo sin declarar.** No es cosmética: si mañana se añade un cuarto rol, heredaría acceso automático
  a todo lo que no lleve decorador. Declarándolo todo, un rol nuevo no entra a ninguna parte hasta que se le
  conceda — fail-closed. Excepción consciente: `auth` deja `logout` y `/me` sin declarar porque son endpoints
  de sesión, agnósticos al rol.

**En los e2e, asertar las DOS caras de cada escritura**: `viewer → 403` **y** `user → 2xx`. Con solo la
primera, escribir `@Roles(ADMIN)` en vez de `@Roles(ADMIN, USER)` pasaría los tests dejando al rol principal de
la app sin poder escribir nada. Lo mismo con las lecturas (`viewer → 2xx`): todas las suites conducen la API
como admin, así que omitir `VIEWER` en un `@Get` no lo detectaría nadie. Los casos van dentro de la suite del
propio endpoint, no en una suite transversal de autorización.

## Promise.all — solo si son genuinamente independientes

**Sí** (lecturas independientes, mutaciones de aggregates distintos):

```typescript
const [customer, alreadyExists] = await Promise.all([...])     // ambas lecturas
const [items, total] = await Promise.all([...])                // paginación
await Promise.all([this.licenseRepository.save(l), this.contractRepository.save(c)])  // aggs distintos
```

**No** (dependencia causal, mismo aggregate):

```typescript
await Promise.all([this.repo.get(id), this.repo.save(entity)]) // ❌ save depende de get
await Promise.all([this.add(id, l1), this.add(id, l2)]) // ❌ race en mismo aggregate
```

## Errores — siempre tipados

```typescript
// domain/contract-errors.ts
export class ContractError extends BusinessRuleViolationError {}

// uso
throw new ContractError(`${ContractNumber.fieldName} cannot be empty`)
throw new EntityNotFoundError('Customer', id.value)
throw new AlreadyExistsError('Contract', 'contractNumber', value)
```

Genéricos en `shared/domain/errors.ts`:

- `BusinessRuleViolationError`
- `EntityNotFoundError`
- `AlreadyExistsError`

## Columnas de auditoría — `@CreateDateColumn` / `@UpdateDateColumn`

Comportamiento verificado en el código de TypeORM (`query-builder/`):

- **INSERT**: `@CreateDateColumn`/`@UpdateDateColumn` **NO** asignan valor en JS. `InsertQueryBuilder` se apoya en el `DEFAULT` de la columna en BD. TypeORM lo autogenera (`DEFAULT now()`) solo si crea el esquema con `synchronize`/`migration:generate`.
- **UPDATE**: `UpdateQueryBuilder` **sí** emite `updated_at = CURRENT_TIMESTAMP` automáticamente. Sin trigger.

⚠️ **Gap de este repo**: las migraciones a mano de customers/licenses/contracts declararon `created_at/updated_at NOT NULL` **sin `DEFAULT now()`** (IAM Auth sí lo puso). Funcionan solo porque el **dominio** inyecta el timestamp vía mapper (patrón "domain-owned"), lo que deja el `@CreateDateColumn` como decorador redundante (doble fuente de verdad). Para pasar al patrón "ORM/BD como dueño" basta añadir `DEFAULT now()` a esas columnas en la migración — sin triggers.

## Migraciones — migration-first (la migración SQL es la única fuente de verdad del esquema)

Estrategia consolidada del repo (2026-07-13): las migraciones se escriben **a mano** (`typeorm:migration:create` + SQL) y `synchronize: false` en los 5 environments, incluido test (la BD de test también se monta con migraciones).

- **`@Index` / `@Check` / `@Unique` NO se usan en entidades TypeORM.** Son metadatos de DDL puro: en runtime TypeORM no los lee para nada (ni construye queries con ellos, ni valida). Solo los consumen `synchronize` y `migration:generate` — ninguno de los dos está en nuestro flujo. Índices, uniques, checks y defaults viven **solo** en la migración SQL.
- **`typeorm:migration:generate` está VETADO** para producir migraciones commiteables. Diffea _decoradores vs BD real_: como nuestras entidades no declaran los índices/checks que sí existen en la BD, generaría `DROP INDEX`/`DROP CONSTRAINT` de todo lo creado a mano. Como mucho sirve de chuleta local para ver el SQL de una columna nueva, descartando su salida.
- La entidad TypeORM declara solo lo que el runtime necesita: `@PrimaryColumn`, `@Column` (tipo, length, nullable, default de lectura), `@CreateDateColumn`/`@UpdateDateColumn` y relaciones.
- Razón de fondo: dos fuentes de verdad (decorador + migración) que nadie sincroniza acaban divergiendo, y un decorador que miente es peor que su ausencia (ver el gap de `DEFAULT now()` en «Columnas de auditoría»). El SQL a mano además permite lo que los decoradores no expresan: índices parciales, `CREATE INDEX CONCURRENTLY`, backfills.

### Foreign keys — solo dentro del agregado (decisión 2026-07-23)

La FK se decide por la frontera del agregado, no por si existe una columna `*_id`:

| Relación                              | ¿FK?               | Por qué                                                                                          |
| ------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| **Composición** (dentro del agregado) | **SÍ**, `RESTRICT` | El repo persiste padre e hijos en la misma transacción: la FK es el espejo físico del invariante |
| **Asociación** (entre agregados)      | **NO**             | Referencia por identidad (DDD). La existencia la valida el **caso de uso**, no la BD             |

Regla enseñable: _¿lo persiste el mismo repositorio en la misma transacción?_ → FK. Si no → identidad + validación en el use case.

- Con FK hoy: `contacts→customers`, `consumption_records→licenses`, `qbr_activities→qbr_declarations`, `qbr_evidences→qbr_activities`. Más los dos `CASCADE` de IAM (`session`/`auth_token` → `user`), que son infra de auth y se dejan a propósito.
- Sin FK a propósito: `contracts→customers`, `licenses→contracts|customers`, `projects→customers`, `metric_consumption→customers`, `qbr_declarations→customers`.
- **Consecuencia que hay que respetar**: al no haber red en BD, todo use case que referencia otro agregado **debe** validar su existencia antes de persistir (el sync ya lo hace: `findBySapId` → `skip`). Añadir FKs cross-agregado rompe además ~100 tests, porque obliga a cada fixture a montar los agregados vecinos.

### CHECK constraints — los invariantes de dominio también en BD (decisión 2026-07-23)

Los VOs solo protegen las escrituras que pasan por la aplicación. Scripts, fixes manuales y migraciones de datos **saltan el dominio**: los CHECK son la última línea de defensa, independiente del origen de la escritura (defensa en profundidad, no duplicación gratuita).

Toda columna nueva nace con su CHECK si encaja en una de estas tres familias (ver `1785300000000-AddCheckConstraints`, 50 constraints):

| Familia         | Cuándo                                    | Ejemplo                                                           |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Enum            | La columna está respaldada por un VO enum | `CHECK (status IN ('active','expiring','expired','terminated'))`  |
| Longitud mínima | El `LIMITS.*.MIN` del dominio             | `CHECK (char_length(sap_id) >= 3)` — el MAX ya lo da `VARCHAR(n)` |
| Rango numérico  | Cotas del dominio                         | `CHECK (quarter BETWEEN 1 AND 4)`                                 |

- Convención de nombre: `ck_<tabla>_<campo>` (y sufijo `_length` / `_range` cuando no es un enum).
- Columnas nullable: `col IS NULL OR <condición>`. Texto libre (`business_model`, `metric_name`, `notes`) **no** lleva CHECK.
- **Los valores van como literales**, nunca importando `LIMITS`/`VO.VALUES`: una migración es un artefacto congelado y no puede depender de constantes vivas. **Contrapartida asumida**: ampliar un enum o un rango exige una migración `ALTER` que actualice el CHECK, además de tocar el VO.
- Al añadirlos se cazaron 3 fixtures con `metric: 'users'`, un valor que ningún VO puede producir. Si un CHECK rompe un test, **la fixture es la sospechosa** antes que el constraint.

## Object Mothers / Builders — viven en la capa del objeto que construyen

Regla: **el mother/builder vive en la misma capa que el objeto que fabrica**, no en la del test que lo consume (un mother es un fixture transversal: lo usan tests de dominio, aplicación e infraestructura por igual).

| Qué construye el mother                              | Dónde vive                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| Agregado de dominio (`Contract`, `User`, `License`…) | `tests/modules/<módulo>/domain/mothers/`                              |
| Value Object                                         | `tests/modules/<módulo>/domain/value-objects/`                        |
| DTO de input/output de aplicación                    | `tests/modules/<módulo>/application/mothers/` (o `application/dtos/`) |
| Primitivos compartidos (uuid, string, enum…)         | `tests/modules/shared/domain/mothers/`                                |

Error típico a evitar: colocar el mother de un agregado bajo `application/mothers/` solo porque el primer test que lo usó era un use case. Es inercia, no diseño — el mismo mother lo acaba usando el test del mapper (infraestructura). Ubícalo por lo que **fabrica**, no por quién lo estrena.

## Referencia para cada patrón

Si tienes la mínima duda sobre algún patrón:

1. **Lee el repo `../sap-licences-backend/`** — tiene ejemplos vivos.
2. Si aun así dudas, **PREGUNTA**. No improvises.

> ⚠️ El repo de referencia incluye **Domain Events / EventBus** que SAP Licenses v1 **NO implementa**. No copies esos patrones — fueron una decisión deliberada de no incluirlos en v1.
