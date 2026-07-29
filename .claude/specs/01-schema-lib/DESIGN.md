# Diseño técnico: Schema lib (`@acc/schema`)

> REQUIREMENTS aprobado (2026-07-30).

---

## La lib

- `nx g @nx/js:library libs/schema --importPath=@acc/schema --unitTestRunner=jest --bundler=none --linter=eslint`
- TypeScript puro. Cero dependencias de runtime. Barrel único `src/index.ts`.
- El guard de hooks ya vigila su pureza (regla 11 de architecture-guard).

```
libs/schema/
└── src/
    ├── index.ts                  # barrel: defineResource + tipos públicos
    ├── lib/
    │   ├── resource-types.ts     # el formato canónico completo (tipos)
    │   ├── define-resource.ts    # defineResource() + validación estructural
    │   └── validation-errors.ts  # SchemaValidationError con lista de problemas
```

## Decisión A4: formato unificado → `fields` como OBJETO keyed

| Criterio                      | Array (guía §3, spec 00)    | Objeto keyed (canon customers)                           |
| ----------------------------- | --------------------------- | -------------------------------------------------------- |
| Duplicación del nombre        | `{ name: 'x', ... }` repite | la clave ES el nombre                                    |
| Orden de campos (golden diff) | explícito                   | orden de inserción de claves string — garantizado por JS |
| Autoría / lectura             | más ruido                   | más limpio, lookup directo                               |
| Consumo en generador          | directo                     | `Object.entries()` — trivial                             |

**Elegido: objeto keyed**, como el documento canónico (`resource-schema-customers.md` §2). El
generador itera con `Object.entries(fields)` (el orden de inserción se preserva; hay test que lo fija).
`contract.model.ts` migra de array a objeto.

## Los tipos (formato canónico + fidelidad de persistencia)

El canon de customers declara `vo/query/table/form`; la spec 00 demostró que la fidelidad de oro
exige además detalle de **persistencia** (tipo de columna, lengthConst, transformers, comentarios).
El formato unificado incluye ambos planos:

```typescript
interface ResourceDefinition {
  schemaVersion: 1 // decisión de la revisión crítica
  name: string
  plural: string
  context: string
  schemaName: string // schema PostgreSQL (schema-per-context)
  route?: string
  api?: string
  labels?: { singular: string; plural: string; subtitle?: string }
  constraintsConst?: string // p.ej. 'CONTRACT_CONSTRAINTS' (alias LIMITS)
  audit?: boolean // createdAt/updatedAt
  fields: Record<string, FieldDefinition> // ← objeto keyed (A4)
  list?: ListDefinition // defaultSort, pageSize, features, actions
  relations?: Record<string, RelationDefinition>
  detail?: DetailDefinition
}

interface FieldDefinition {
  type: 'uuid' | 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'timestamptz' | 'text'
  origin?: 'auto' | 'sap' | 'manual' // decisión 2: gobierna SOLO el sync
  pk?: boolean
  required?: boolean
  nullable?: boolean
  unique?: boolean // decisión 1: en opcionales = ifPresent
  vo?: string // decisión 5: nombre explícito
  min?: number
  max?: number
  relation?: { to: string; context?: string; kind: 'reference' | 'composition' } // decisión 3: drill-down se deriva de aquí
  query?: { sortable?: boolean; filterable?: boolean; searchable?: boolean }
  table?: { show: boolean; label?: string; minWidth?: number }
  form?: {
    control: 'text' | 'textarea' | 'number' | 'checkbox' | 'date' | 'select' | 'none'
    label?: string
    rows?: number
  } // decisión 4: 'none' = omitir
  column?: ColumnDefinition // detalle de persistencia (spec 00)
  comment?: string[] // comentarios emitidos sobre la columna
}

interface ColumnDefinition {
  type: string // 'varchar' | 'uuid' | 'numeric' | ... (typeorm)
  length?: number
  lengthConst?: string // 'CONTRACT_NUMBER.MAX' → LIMITS.…
  default?: string | number | boolean
  defaultRaw?: string
  precision?: number
  scale?: number
  array?: boolean
  transformer?: 'numeric' | 'nullableNumeric'
  tsType?: string // override del tipo TS emitido (p.ej. 'Nullable<string>')
}
```

Nota anti-inner-platform: los tipos cubren el canon completo, pero la **validación** solo exige lo
que el generador consume hoy. Nada de validar semántica de bloques (`list`, `detail`) que aún no
tienen plantilla.

## `defineResource()` — validación estructural

Función identidad tipada + validación. **Acumula todos los problemas** y lanza un único
`SchemaValidationError` con la lista (campo + motivo), no falla en el primero:

```typescript
const problems = validate(definition) // string[] tipo "fields.name: table.show requiere label"
if (problems.length) throw new SchemaValidationError(definition.name, problems)
return Object.freeze(definition)
```

Reglas de validación (v1, solo estructurales):

1. `schemaVersion === 1`; `name/plural/context/schemaName` no vacíos y kebab/snake válidos.
2. Exactamente **un** campo `pk`.
3. `table.show: true` ⇒ `label` obligatorio.
4. `form.control !== 'none'` ⇒ `label` obligatorio.
5. `relation.kind` válido; `relation.to` no vacío.
6. `column.lengthConst` y `column.length` son mutuamente excluyentes.
7. `column.transformer: 'nullableNumeric'` ⇒ `nullable: true` (evita el dato corrupto que el transformer previene).
8. `min <= max` cuando ambos existen.

## Migración del generador (spec 00 → `@acc/schema`)

- `libs/generators` añade dependencia a `@acc/schema` (boundary permitido: generators → schema).
- `contract.model.ts` se reescribe con `defineResource` y `fields` keyed; los datos no cambian.
- `build-substitutions.ts` consume `ResourceDefinition`: `Object.entries(fields)`, `column.tsType`
  con fallback al tipo base, resto igual (los tests existentes se adaptan, no se relajan).
- `model-types.ts` se elimina.
- **Gate**: el diff de oro de contract debe seguir vacío tras la migración.

## Decisiones técnicas

| Decisión           | Opción elegida                                  | Razón                                                             |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| Formato fields     | objeto keyed                                    | canon de customers; sin duplicar nombre; orden garantizado + test |
| Validación         | acumulativa, un solo error                      | DX: ver todos los problemas de una pasada                         |
| Alcance validación | solo estructural v1                             | anti inner-platform; crece con las plantillas                     |
| `tsType`           | derivado de `type` con override `column.tsType` | los casos raros (Nullable<Date>) no fuerzan la regla general      |
| Freeze del modelo  | `Object.freeze` superficial                     | el modelo es dato inmutable; barato                               |

## Riesgos identificados

| Riesgo                                      | Probabilidad | Impacto | Mitigación                                                                     |
| ------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------ |
| La migración rompe el diff de oro           | baja         | alto    | gate obligatorio en la última tarea; los tests de sustituciones fijan el orden |
| Tipos demasiado ambiciosos (inner-platform) | media        | medio   | validación mínima; bloques sin plantilla se tipan pero no se validan           |
| Boundary generators→schema mal configurado  | baja         | bajo    | tags Nx + lint en la tarea de migración                                        |

---

> ⚠️ **STOP** — revisar y aprobar antes de pasar a TASKS.md.
