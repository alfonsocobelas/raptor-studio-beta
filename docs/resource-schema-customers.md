# Resource-schema — `customers`

**Fecha:** 2026-07-10
**Estado:** Brainstorming (previo a spec). Artefacto de diseño para discutir el formato antes de construir el generador.
**Origen:** calcado del `customers` real (entidad, `customer-constants`, VOs, `search-customer-config`, `columns[]`, `customer-dialog`, DTOs).

> Objetivo del ejercicio: si este schema puede **reproducir el `customers` actual campo a campo**, el formato sirve. La verificación de fidelidad está en la sección 4.

---

## 1. Principio rector: generar, no interpretar

El schema es **entrada de un generador**, no un intérprete de runtime. Produce código real, editable, que luego es tuyo (como el `customers` de hoy). El schema cubre el **caso canónico**; cuando una vista se salga del molde, editas el código generado a mano — no retuerces el schema. Esto evita el _inner-platform effect_ y encaja con TDD y tus patrones DDD.

Corolario: el schema **no** aspira a modelar todo. Modela lo repetible; lo raro es código.

---

## 2. El schema de `customers`

```typescript
import { defineResource } from '@raptor/schema'

export const customerResource = defineResource({
  // — Identidad del recurso —
  name: 'customer',
  plural: 'customers',
  context: 'sap-licensing', // bounded context / módulo Nest
  route: '/sap-licensing/customers',
  api: '/api/v1/customers',
  labels: { singular: 'Cliente', plural: 'Clientes', subtitle: 'Gestión de clientes SAP' },

  // — Campos (única fuente de verdad de front + back) —
  fields: {
    id: { type: 'uuid', origin: 'auto', pk: true },

    sapId: {
      type: 'string',
      origin: 'sap',
      required: true,
      vo: 'SapId',
      min: 3,
      max: 20,
      noInnerWhitespace: true,
      form: { control: 'text', label: 'ID SAP' },
      table: { show: false }, // ojo: filtrable/ordenable pero NO columna visible
      query: { sortable: true, filterable: true },
      unique: true
    },
    name: {
      type: 'string',
      origin: 'sap',
      required: true,
      vo: 'CustomerName',
      form: { control: 'text', label: 'Nombre' },
      table: { show: true, label: 'Nombre', minWidth: 220 },
      query: { sortable: true, filterable: true, searchable: true }
    },
    taxId: {
      type: 'string',
      origin: 'manual',
      required: false,
      vo: 'TaxId',
      max: 20,
      form: { control: 'text', label: 'CIF / NIF' },
      table: { show: true, label: 'CIF / NIF', minWidth: 130 },
      query: { sortable: true, filterable: true, searchable: true },
      unique: true // unicidad condicional: solo si no vacío
    },
    industry: {
      type: 'string',
      origin: 'manual',
      max: 100,
      vo: 'CustomerIndustry',
      form: { control: 'text', label: 'Industria' },
      table: { show: true, label: 'Industria', minWidth: 180 },
      query: { sortable: true, filterable: true, searchable: true }
    },
    address: {
      type: 'string',
      origin: 'manual',
      max: 500,
      vo: 'CustomerAddress',
      form: { control: 'text', label: 'Dirección' },
      table: { show: true, label: 'Dirección', minWidth: 250 },
      query: { sortable: false, filterable: false, searchable: true } // solo búsqueda global
    },
    phone: {
      type: 'string',
      origin: 'manual',
      max: 30,
      vo: 'CustomerPhone',
      form: { control: 'text', label: 'Teléfono' },
      table: { show: true, label: 'Teléfono', minWidth: 150 },
      query: { sortable: false, filterable: false, searchable: true }
    },
    notes: {
      type: 'string',
      origin: 'manual',
      max: 1000,
      vo: 'CustomerNotes',
      form: { control: 'textarea', label: 'Notas internas', rows: 3 },
      table: { show: false },
      query: {}
    },
    assignedKamId: {
      type: 'uuid',
      origin: 'manual',
      nullable: true,
      vo: 'AssignedKamId',
      relation: { to: 'user', context: 'iam', kind: 'reference' }, // soft ref → KAM
      form: { control: 'none' }, // hoy no está en el formulario
      table: { show: false },
      query: { filterable: true, sortable: false }
    }
  },

  // — Listado (tabla) —
  list: {
    defaultSort: { field: 'name', dir: 'asc' },
    pageSize: 10,
    features: { create: true, export: ['csv', 'xlsx'], search: true },
    actions: [
      { id: 'view', icon: 'lucideEye', label: 'Ver ficha', navigate: 'detail' },
      { id: 'edit', icon: 'lucidePencil', label: 'Editar', opens: 'form' },
      { id: 'delete', icon: 'lucideTrash2', label: 'Eliminar', confirm: true, variant: 'ghost' }
    ]
  },

  // — Relaciones (composición + drill-down) —
  relations: {
    contacts: { kind: 'composition', of: 'contact', in: 'detail' }, // sub-tabla en la ficha
    contracts: { kind: 'inbound', from: 'contract', by: 'customerId', drilldown: true },
    licenses: { kind: 'inbound', from: 'license', by: 'customerId', drilldown: true },
    projects: { kind: 'inbound', from: 'project', by: 'customerId', drilldown: true }
  },

  // — Detalle (ficha) —
  detail: { title: 'name', sections: ['fields', 'contacts', 'contracts', 'licenses', 'projects'] }
})
```

---

## 3. Mapa de proyección: schema → ficheros generados

Cada bloque del schema alimenta ficheros concretos. Marcado con la clasificación estructura/binding del contrato de unidad-vista.

| Bloque del schema           | Genera (backend)                                                                                                    | Genera (frontend)                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `fields[].vo` + constraints | `domain/value-objects/*.vo.ts` con `create()` validador **[BINDING]**                                               | tipos del `Dto`                                                   |
| `fields` completo           | `domain/<name>.ts` (agregado: protocolo `create/update/toPrimitives/equals`) **[ESTRUCTURA]** + props **[BINDING]** | —                                                                 |
| `fields[].origin`           | qué campos acepta `Register/Update DTO` (SAP read-only vs manual)                                                   | qué campos van en el formulario                                   |
| `fields[].query`            | `application/config/search-<name>-config.ts` (allowedFilters/Orders/searchable) **[BINDING]**                       | flags `sortable/filterable` de `ColumnDef`                        |
| `fields[].table`            | —                                                                                                                   | `columns: ColumnDef[]` del `*-list.component.ts` **[BINDING]**    |
| `fields[].form`             | validadores del DTO                                                                                                 | `*-dialog.component.ts` (controles + `Validators`) **[BINDING]**  |
| `fields[].unique`           | specifications de unicidad + métodos `new*IfChanged()` **[BINDING]**                                                | —                                                                 |
| `list.features/actions`     | endpoints (`export`, CRUD) en `*.controller.ts` **[ESTRUCTURA]**                                                    | `actions: TableAction[]` + botones **[BINDING/ESTRUCTURA]**       |
| `list` genérico             | `BaseController`/handlers/use-cases **[ESTRUCTURA]**                                                                | `*.service.ts` (`resource()` + `criteriaParams`) **[ESTRUCTURA]** |
| `relations.composition`     | entidad hija + repo `getWith*`                                                                                      | sub-tabla en `*-detail.component.ts`                              |
| `relations.inbound`         | —                                                                                                                   | drill-down: enlace a tabla filtrada por `customerId`              |
| `name/route/api/context`    | `@Controller`, `*.module.ts`, registro                                                                              | ruta en `sap-licensing.routes.ts` + ítem sidebar (**costuras**)   |
| persistence (de `fields`)   | `infrastructure/persistence/typeorm/*.entity.ts` + `mapper` **[BINDING]**                                           | —                                                                 |

Todo lo `[ESTRUCTURA]` se copia igual entre recursos; solo lo `[BINDING]` se deriva del schema. Eso es lo que hace el generador barato.

---

## 4. Verificación de fidelidad (¿reproduce el `customers` real?)

Cotejo del schema contra el código actual:

| Elemento real                                                                            | En el schema                         | ✓   |
| ---------------------------------------------------------------------------------------- | ------------------------------------ | --- |
| Columnas visibles: name, industry, taxId, address, phone (con anchos)                    | `table.show` + `minWidth`            | ✓   |
| `sapId` filtrable/ordenable pero no columna                                              | `query` sí, `table.show:false`       | ✓   |
| address/phone: buscables, no sortable/filterable                                         | `query.searchable:true`, resto false | ✓   |
| `CUSTOMER_ALLOWED_FILTERS` = id, sapId, name, taxId, industry, assignedKamId             | campos con `query.filterable:true`   | ✓   |
| `CUSTOMER_ALLOWED_ORDERS` = name, sapId, taxId, industry                                 | campos con `query.sortable:true`     | ✓   |
| `SEARCHABLE` = name, industry, taxId, address, phone                                     | campos con `query.searchable:true`   | ✓   |
| Formulario: sapId, name, taxId, industry, address, phone, notes                          | `form.control` ≠ none                | ✓   |
| sapId+name required                                                                      | `required:true`                      | ✓   |
| notes = textarea                                                                         | `form.control:'textarea'`            | ✓   |
| assignedKamId no en formulario                                                           | `form.control:'none'`                | ✓   |
| Constraints VO (SAP_ID 3-20, TAX_ID 20, INDUSTRY 100, ADDRESS 500, PHONE 30, NOTES 1000) | `min/max` por campo                  | ✓   |
| Unicidad sapId + taxId                                                                   | `unique:true` en ambos               | ✓   |
| Acciones view/edit/delete                                                                | `list.actions`                       | ✓   |
| Export CSV/XLSX                                                                          | `features.export`                    | ✓   |
| Origen SAP: sapId, name                                                                  | `origin:'sap'`                       | ✓   |

Reproduce el `customers` actual sin huecos. El formato es viable.

---

## 5. Decisiones de diseño abiertas (a debatir antes de la spec)

1. **Unicidad condicional de `taxId`**: hoy solo aplica si no está vacío (`newTaxIdIfChanged` comprueba `isEmpty`). ¿El flag `unique:true` implica esa semántica por defecto para campos opcionales, o hace falta `unique: 'ifPresent'`?
2. **`origin: 'sap'`**: ¿significa read-only en formulario siempre? Hoy sapId **sí** es editable en el form pese a venir de SAP. Aclarar si `origin` afecta solo al sync o también a la editabilidad.
3. **Relaciones inbound**: el drill-down (ficha de cliente → sus contratos) ¿lo genera el schema del _padre_ (customer) o se infiere del schema del _hijo_ (contract.customerId)? Propongo inferirlo del hijo para no duplicar.
4. **`assignedKamId`**: es un `relation.reference` a `user` pero sin resolución en UI hoy. ¿El generador deja el hueco (select de KAMs) preparado o lo omite hasta que exista el endpoint?
5. **Nombres de fichero/VO**: ¿el generador deriva `SapId` de `sapId` automáticamente o el schema lo declara explícito (como ahora, `vo: 'SapId'`)? Explícito es más control; derivado es menos ruido.

---

## 6. Siguiente paso

Si el formato te convence (con los ajustes de la sección 5), el paso siguiente sale de brainstorming y entra en `/spec-new`: una feature "generador de recurso" con REQUIREMENTS/DESIGN/TASKS y TDD, cuya **primera prueba de fuego** es regenerar `customers` desde este schema y comparar (diff) contra el código actual. Si el diff es vacío (o solo cosmético), el generador funciona.
