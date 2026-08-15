# Guía — El primer generador Nx (entidad → módulo)

**Fecha:** 2026-07-10
**Objetivo:** entender el mecanismo determinista (sin IA) que convierte una **definición de entidad** en el **código base de un módulo** completo, usando `contract` como entidad de ejemplo.
**Nivel:** desde cero con Nx.

---

## 1. Modelo mental: qué es un generador Nx

Un generador Nx es una **función que escribe ficheros a partir de plantillas**. Nada de IA: coge un texto con huecos y rellena los huecos con datos. Tres piezas:

```
   ENTRADA                    GENERADOR                        SALIDA
   definición de entidad  ─►  función(tree, opciones)      ─►  ficheros reales
   (contract.model.ts)        └─ lee el modelo                 (módulo contract
                              └─ calcula sustituciones          completo, editable)
                              └─ expande plantillas EJS
```

- **`tree`**: un sistema de ficheros virtual. El generador escribe en él; Nx lo vuelca a disco al final (y te enseña un preview antes con `--dry-run`).
- **plantillas**: ficheros de texto con `<%= variable %>` (sintaxis EJS). El nombre del fichero también lleva huecos.
- **sustituciones**: el objeto de datos que rellena los huecos (viene de tu definición de entidad).

La clave de que sea **genérico**: las plantillas no mencionan "contract" ni "customer". Solo tienen huecos. Cambias la entrada, cambias la salida.

---

## 2. Dónde vive (estructura)

Se crea como un **plugin local** dentro del propio monorepo. No se publica en ningún sitio; es una `lib` más.

```
libs/generators/
├── src/generators/resource/
│   ├── generator.ts          ← la función (lee modelo, expande plantillas)
│   ├── schema.json           ← qué opciones acepta el comando (ej. el nombre)
│   ├── schema.d.ts           ← tipos de esas opciones
│   └── files/                ← LAS PLANTILLAS (el molde del módulo)
│       ├── domain/
│       │   ├── __plural__.ts.template
│       │   └── value-objects/ ...
│       ├── application/
│       │   └── config/search-__name__-config.ts.template
│       └── infrastructure/
│           ├── entrypoints/__plural__.controller.ts.template
│           └── persistence/typeorm/typeorm-__name__.entity.ts.template
└── generators.json           ← registra el generador para `nx generate`
```

Dos convenciones de nombre de fichero que Nx entiende:

- **`__name__`** en el nombre del fichero se sustituye por el valor de `name` (→ `contract`).
- **`.template`** al final se elimina al generar (`...entity.ts.template` → `...entity.ts`). Es lo que evita que las plantillas se compilen como código del repo.

---

## 3. La entrada: la definición de la entidad

Para entidades ricas (con validaciones, columnas, formulario) los datos no caben en argumentos de línea de comandos. Así que la entrada es un **fichero de modelo** que el generador lee. Es el resource-schema que ya diseñamos, en su forma mínima para el generador:

```typescript
// contract.model.ts  (la definición de la entidad nueva)
export const contract = {
  name: 'contract',
  plural: 'contracts',
  context: 'sap-licensing',
  fields: [
    { name: 'id', tsType: 'string', column: 'uuid', pk: true },
    {
      name: 'contractNumber',
      tsType: 'string',
      column: 'varchar',
      required: true,
      vo: 'ContractNumber',
      max: 40,
      unique: true,
      table: { show: true, label: 'Nº contrato', minWidth: 160 },
      query: { sortable: true, filterable: true, searchable: true },
      form: { control: 'text', label: 'Nº contrato' }
    },
    {
      name: 'customerId',
      tsType: 'string',
      column: 'uuid',
      required: true,
      relation: { to: 'customer', kind: 'reference' },
      query: { filterable: true }
    },
    {
      name: 'totalValue',
      tsType: 'number',
      column: 'numeric',
      vo: 'ContractValue',
      table: { show: true, label: 'Valor', minWidth: 140 },
      query: { sortable: true },
      form: { control: 'number', label: 'Valor total' }
    },
    {
      name: 'isFavorite',
      tsType: 'boolean',
      column: 'boolean',
      default: false,
      table: { show: true, label: 'Favorito' },
      form: { control: 'checkbox', label: 'Favorito' }
    }
    // ...resto de campos reales de contract
  ]
} as const
```

Esto es puro dato. No hay lógica. El generador lo lee y lo reparte por las plantillas.

---

## 4. La función del generador

Lee el modelo, calcula variantes del nombre y expande **todas** las plantillas de `files/` en la carpeta destino. Es corto porque el trabajo lo hacen las plantillas.

```typescript
// generator.ts
import { Tree, formatFiles, generateFiles, names, joinPathFragments } from '@nx/devkit'
import { ResourceSchema } from './schema'
import { loadModel } from './load-model'

export async function resourceGenerator(tree: Tree, options: ResourceSchema) {
  const model = loadModel(options.name) // carga contract.model.ts
  const n = names(model.name) // { className:'Contract', propertyName:'contract', ... }

  const substitutions = {
    ...model, // name, plural, context, fields[]
    className: n.className, // Contract
    propertyName: n.propertyName, // contract
    constantName: n.constantName, // CONTRACT
    // helpers que las plantillas usarán:
    searchable: model.fields.filter(f => f.query?.searchable).map(f => f.name),
    sortable: model.fields.filter(f => f.query?.sortable).map(f => f.name),
    filterable: model.fields.filter(f => f.query?.filterable).map(f => f.name),
    columns: model.fields.filter(f => f.table?.show),
    formFields: model.fields.filter(f => f.form?.control && f.form.control !== 'none')
  }

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'), // de dónde: las plantillas
    joinPathFragments('libs/backend/src/contexts', model.context, 'modules', model.plural), // a dónde: el módulo destino
    substitutions // con qué: los datos
  )
  // (idéntico para el front, con otra carpeta files/ y otro destino)

  await formatFiles(tree) // pasa prettier con tus reglas (sin ; comillas simples...)
}
```

`names('contract')` es un helper de Nx que te da todas las capitalizaciones de golpe, para no calcularlas a mano en cada plantilla.

---

## 5. Las plantillas expandiéndose (el corazón)

Aquí se ve por qué es genérico. Misma plantilla, distinta entrada.

### 5.1 La entidad TypeORM

```
// files/infrastructure/persistence/typeorm/typeorm-__name__.entity.ts.template
@Entity({ name: '<%= plural %>', schema: 'sap_licensing' })
export class TypeOrm<%= className %>Entity {
<% fields.forEach(f => { %>
  @Column('<%= f.column %>'<%= f.default !== undefined ? `, { default: ${JSON.stringify(f.default)} }` : '' %>)
  <%= f.name %>!: <%= f.tsType %>
<% }) %>
}
```

Con `contract` como entrada, expande a:

```typescript
@Entity({ name: 'contracts', schema: 'sap_licensing' })
export class TypeOrmContractEntity {
  @Column('uuid')
  id!: string

  @Column('varchar')
  contractNumber!: string

  @Column('uuid')
  customerId!: string

  @Column('numeric')
  totalValue!: number

  @Column('boolean', { default: false })
  isFavorite!: boolean
}
```

Con `customer` como entrada, la **misma plantilla** produce la entidad de customer. Eso es la genericidad.

### 5.2 El search-config (binding de query)

```
// files/application/config/search-__name__-config.ts.template
const <%= constantName %>_ALLOWED_FILTERS = [<%= filterable.map(f => `'${f}'`).join(', ') %>] as const
const <%= constantName %>_ALLOWED_ORDERS  = [<%= sortable.map(f => `'${f}'`).join(', ') %>] as const
const <%= constantName %>_SEARCHABLE       = [<%= searchable.map(f => `'${f}'`).join(', ') %>] as const
```

→ para contract:

```typescript
const CONTRACT_ALLOWED_FILTERS = ['contractNumber', 'customerId'] as const
const CONTRACT_ALLOWED_ORDERS = ['contractNumber', 'totalValue'] as const
const CONTRACT_SEARCHABLE = ['contractNumber'] as const
```

### 5.3 Las columnas del front

```
// files/.../__plural__-list.component.ts.template  (fragmento)
readonly columns: ColumnDef[] = [
<% columns.forEach(c => { %>  { key: '<%= c.name %>', label: '<%= c.table.label %>'<%= c.table.minWidth ? `, minWidth: ${c.table.minWidth}` : '' %><%= c.query?.filterable ? ', filterable: true' : '' %><%= c.query?.sortable === false ? ', sortable: false' : '' %> },
<% }) %>]
```

→ para contract:

```typescript
readonly columns: ColumnDef[] = [
  { key: 'contractNumber', label: 'Nº contrato', minWidth: 160, filterable: true },
  { key: 'totalValue', label: 'Valor', minWidth: 140 },
  { key: 'isFavorite', label: 'Favorito' }
]
```

Fíjate que **la coherencia front↔back sale gratis**: `filterable`/`sortable` de las columnas y los `ALLOWED_FILTERS/ORDERS` del back se generan del **mismo** array `fields`. Imposible que se desincronicen.

---

## 6. Ejecutarlo

```
# preview sin escribir nada (ver qué ficheros crearía)
nx generate @raptor/generators:resource contract --dry-run

# generación real
nx generate @raptor/generators:resource contract
```

Sale el módulo `contracts` completo (dominio + persistencia + aplicación + front), formateado con tus reglas de prettier, listo para que lo edites donde el caso lo pida.

---

## 7. Validación: las 4 referencias de oro

Aquí es donde se demuestra que el generador es correcto, no en que "parezca que funciona":

```
para cada entidad ya escrita a mano (customer, contract, license, project):
  1. escribe su <entidad>.model.ts
  2. nx generate ... <entidad>   (a una carpeta temporal)
  3. diff  código-generado  vs  código-real-del-repo
  4. objetivo: diff vacío (o solo cosmético)
```

Si las 4 salen limpias, el generador reproduce el trabajo manual → una entidad nueva saldrá bien. Si una falla, el diff te dice exactamente qué le falta a la plantilla o al modelo. Es un test, no una impresión.

---

## 8. Pitfalls honestos (dónde se tuerce esto)

1. **EJS se vuelve ilegible con lógica.** La regla: **plantillas tontas, lógica en `generator.ts`.** Todo cálculo (filtrar campos, derivar nombres, decidir tipos) se hace en la función y se pasa ya masticado a la plantilla. Si te ves metiendo `if` anidados en `<% %>`, saca esa lógica a `generator.ts`. En cuanto se ignora esta regla, las plantillas se convierten en el inner-platform del que huimos.

2. **El modelo debe capturar lo suficiente.** Si un caso real necesita un dato que el modelo no tiene, no lo metas con calzador: genera el 80% y edita el 20% a mano (generar-no-interpretar). El modelo crece solo cuando un patrón se repite en varias entidades.

3. **Idempotencia / regeneración.** Por defecto regenerar pisa lo editado. Decide pronto la política: o generas una vez y posees el código (simple, recomendado), o separas "generado" de "editado a mano" en ficheros distintos (más complejo). Para empezar: generar una vez, luego es tuyo.

4. **VOs con validación específica.** El `create()` de cada VO (longitudes, formato) se puede plantillar desde `min/max`, pero las reglas raras (un CIF con dígito de control) son código a mano. Genera el VO estándar; especializa el que lo pida.

5. **Prettier/lint.** `formatFiles(tree)` aplica tus reglas, pero revisa que el generado pase `@nx/enforce-module-boundaries` — es tu garantía de que la pieza es conforme (no importa otro módulo).

---

## 9. Ruta de aprendizaje sugerida

Como partes de cero con Nx, el orden que menos fricción tiene:

1. **Crear el plugin local vacío**: `nx add @nx/plugin` y luego `nx g @nx/plugin:generator resource --directory=libs/generators`. Esto te da el esqueleto (generator.ts + schema.json + files/) funcionando con un fichero de ejemplo.
2. **Generar UN solo fichero** desde el modelo de contract (p.ej. solo la entidad TypeORM). Ver el mecanismo completo end-to-end con lo mínimo.
3. **Añadir plantillas** fichero a fichero hasta cubrir un módulo backend entero.
4. **Validar contra contract real** (diff).
5. **Repetir para el front**, y luego validar las 4 entidades.

Cada paso es un commit pequeño y revisable (encaja con tu TDD y tu flujo de tareas atómicas). Cuando quieras, el paso 1-2 lo hacemos juntos como primera tarea de una spec.
