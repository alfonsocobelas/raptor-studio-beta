# Diseño técnico: Endpoint `aggregate`

## La decisión que gobierna todo lo demás

El nombre del campo llega por HTTP y termina dentro de la consulta. En TypeORM la expresión se
construye interpolando (`SUM(entity.total_value)`), así que **el campo nunca puede llegar crudo al
repositorio**. La defensa no es escapar: es una **lista blanca emitida desde el modelo**, y ya
existe el sitio donde vive esa clase de lista — `search-{entity}-config.ts`, con
`allowedFilters`/`allowedOrders` tipados contra `PrimitiveProps`.

Se amplía ese fichero, no se inventa otro:

```ts
// search-contract-config.ts (emitido)
const CONTRACT_AGGREGATABLE_FIELDS = {
  totalValue: 'numeric',
  nbrOfContracts: 'numeric',
  startDate: 'date',
  endDate: 'date'
} as const satisfies Partial<Record<ContractAllowedField, 'numeric' | 'date'>>
```

El tipo de cada campo viaja con él porque decide qué operaciones son legales: `sum` y `avg` sobre
una fecha no significan nada; `min`, `max` y `distinct` sí.

| op         | numeric | date | Motivo                                  |
| ---------- | ------- | ---- | --------------------------------------- |
| `sum`      | ✅      | ❌   | sumar fechas no es una pregunta         |
| `avg`      | ✅      | ❌   | la media de dos fechas tampoco          |
| `min`/`max`| ✅      | ✅   | «el mayor pedido», «la última visita»   |
| `distinct` | ✅      | ✅   | cuántos valores diferentes hay          |

## Capa backend

### Puerto de dominio

`{entity}-repository.ts` gana una firma. El puerto habla de intención, no de SQL:

```ts
export type AggregateOp = 'sum' | 'avg' | 'min' | 'max' | 'distinct'

abstract aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null>
```

`number | null` no es comodidad: `avg`/`min`/`max` sobre el conjunto vacío **no son cero**, y
devolver 0 sería afirmar algo falso. `sum` y `distinct` del vacío sí son 0, y eso lo resuelve el
adapter, que es quien sabe lo que devuelve el motor.

### Use case

```ts
@Injectable()
export class AggregateContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: AggregateInput): Promise<{ value: number | null }> {
    const { allowedFilters, allowedOrders, searchableFields, aggregatableFields } = searchContractConfig
    const kind = aggregatableFields[input.field]           // ← la lista blanca, aquí
    if (!kind) throw new InvalidArgumentError(`Field '${input.field}' is not aggregatable`)
    if (!opAllowedOn(input.op, kind)) throw new InvalidArgumentError(...)

    const criteria = Criteria.fromOffset({ ...input, page: 1, pageSize: 1 }, allowedFilters, allowedOrders, searchableFields)
    return { value: await this.contractRepository.aggregate(criteria, input.op, input.field) }
  }
}
```

La validación vive en el use case y NO solo en el DTO: el DTO valida forma (que `op` sea una de
cinco, que `field` sea una cadena); que ESTE campo de ESTE recurso sea agregable es una regla de
aplicación, y el use case es lo único que se ejecuta en todos los caminos.

`InvalidArgumentError` ya se traduce a 400 en el filtro de excepciones del emitido.

### Entrypoint

```ts
// declarado ANTES de `:id`, o 'aggregate' se leería como un uuid (la lección de `export`)
@Get('aggregate')
@Roles(<%- entry.readRoles %>)
aggregate(@Query(new ParseCriteriaPipe()) query: AggregateContractsQueryDto): Promise<AggregateOutput> {
  return this.aggregateContractsHandler.handle(query)
}
```

Mismos roles que el listado: **agregar es leer**, no una capacidad nueva (spec 49).

`AggregateContractsQueryDto` extiende el DTO de criteria que ya parsea `filters`, y añade:

```ts
@IsIn(['sum', 'avg', 'min', 'max', 'distinct']) op!: AggregateOp
@IsString() @IsNotEmpty() field!: string
```

### Adapters, uno por motor

**TypeORM** — molde exacto de `countByCriteria`, con la expresión ya validada:

```ts
protected async aggregateByCriteria(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null> {
  const qb = this.repository().createQueryBuilder('entity')
  const query = this.criteriaConverter.buildQuery(criteria)
  if (query.filter) qb.where(query.filter.query, query.filter.params)
  this.excludeSoftDeleted(qb)

  const column = `entity.${field}`
  const expression = op === 'distinct' ? `COUNT(DISTINCT ${column})` : `${op.toUpperCase()}(${column})`
  const raw = await qb.select(expression, 'value').getRawOne<{ value: string | null }>()

  if (raw?.value === null || raw?.value === undefined) return op === 'sum' || op === 'distinct' ? 0 : null
  return Number(raw.value)
}
```

`numeric` de PostgreSQL vuelve como cadena: el `Number()` no es adorno.

**Mongoose** — pipeline de agregación con el mismo filtro y el mismo borrado lógico:

```ts
protected async aggregateByCriteria(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null> {
  const query = this.criteriaConverter.buildQuery(criteria)
  const match = this.excludeSoftDeleted(query.filter)
  const group = op === 'distinct'
    ? [{ $group: { _id: `$${field}` } }, { $count: 'value' }]
    : [{ $group: { _id: null, value: { [`$${op}`]: `$${field}` } } }]
  const [row] = await this.model().aggregate([{ $match: match }, ...group]).session(this.session())
  ...
}
```

`$sum` de Mongo devuelve 0 sobre el vacío y `$avg` devuelve null: coincide con el contrato sin
tener que forzarlo.

## Capa frontend emitida

`dashboard.service.ts` gana `_aggregate`, hermano de `_countBy`:

```ts
private _aggregate(api: string, op: string, field: string, filters: KpiFilter[]): Promise<number | null> {
  const params: Record<string, string> = { op, field }
  if (filters.length) params['filters'] = JSON.stringify(filters)
  return firstValueFrom(this._http.get<{ value: number | null }>(`${api}/aggregate`, { params })).then(r => r.value)
}
```

`_loadKpi` elige entre `_countBy` y `_aggregate` según la medida; el resto de la maquinaria de la
spec 70 (ventana, comparación, objetivo) **no cambia**: sigue siendo «un número, y opcionalmente el
del periodo anterior».

`KpiValue.value` pasa a `number | null`, y la tarjeta pinta «—» cuando es null. Un guion no es un
detalle estético: un cero en «Importe medio» es una afirmación falsa sobre el negocio.

Formato por tipo de campo, decidido en `generator.ts` (regla 8): `numeric` con `toLocaleString`
español, `date` con la fecha corta. El sufijo de moneda NO se inventa: solo se emite si el modelo
declara un campo `currency`.

## Capa estudio

`kpi-config` gana **Medida** y, cuando la medida no es conteo, **Campo**:

```
┌─ Componente · KPI ──────────────────┐
│ Etiqueta    [ Facturación pendiente ]│
│ Medida      [ Suma            ▾ ]   │  ← conteo | suma | media | máx | mín | distintos
│ Campo       [ Importe         ▾ ]   │  ← solo los que la medida admite
│ Condición   [ Estado ▾ ][ es ▾ ][ Pendiente ▾ ]
│ Ventana     [ Este mes        ▾ ]   │
│ Comparar    [x] con el periodo anterior
│ Objetivo    [ 60            ]       │
└─────────────────────────────────────┘
```

- Cambiar la medida **invalida el campo** si el nuevo tipo no lo admite (misma regla que ya aplica
  al cambiar el campo de la condición).
- `ratio` desaparece del panel cuando la medida no es conteo (requisito de la spec).
- Sin ningún campo agregable en la entidad, las medidas distintas de conteo no se ofrecen.

## Decisiones técnicas

- **La lista blanca en el use case, no solo en el DTO**: es la única capa por la que pasan todos
  los caminos, y es donde el nombre de campo se convierte en algo que toca SQL.
- **Ampliar `search-{entity}-config` en vez de crear `aggregate-config`**: la app ya tiene un sitio
  para «qué campos admite la API»; dos ficheros serían dos verdades.
- **`number | null` en el puerto**: la media de nada no es cero. El tipo lo dice y la tarjeta lo
  pinta.
- **Mismos roles que el listado**: agregar es leer. Una capacidad nueva obligaría a re-decidir la
  matriz de accesos de la spec 49 sin ninguna pregunta de negocio detrás.
- **`@Get('aggregate')` antes de `:id`**: la lección que ya pagó `export`.
- **Sin `groupBy`**: cambia la forma de la respuesta y con ella tres kinds. Spec 72.

## Riesgos identificados

- **Interpolación de `field`**: mitigado por la lista blanca emitida + tipo por campo + test e2e
  que prueba un campo fuera de la lista. Es el riesgo serio de la spec y se prueba, no se supone.
- **`numeric` como cadena en PostgreSQL**: sin el `Number()`, `sum` concatenaría. Cubierto por el
  test de integración de TypeORM.
- **Divergencia entre motores**: el vacío devuelve cosas distintas en cada uno. Mismo test de
  integración escrito dos veces (uno por ranura), y el contrato lo fija el puerto.
- **El panel gasta más**: cada tarjeta con medida real es otra petición. El gasto sigue congelado
  en el spec emitido; bajarlo es la spec 72.
- **`avg` sobre `numeric` en PostgreSQL** devuelve más decimales de los que nadie quiere leer: el
  formato se resuelve en la tarjeta, no en SQL (redondear en la consulta escondería el dato real).
