---
name: schema-authoring
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when writing or modifying a resource-schema / entity model (*.model.ts, defineResource),
  adding fields, or when the user says "schema", "modelo de entidad", "resource-schema",
  "define el recurso", "añade un campo al modelo". The resource-schema is the single
  contract of this project: front and back are both derived from it.
---

# Autoría del resource-schema

Referencia completa y ejemplo íntegro de `customers`: `docs/resource-schema-customers.md`.

## Principio rector: generar, no interpretar

El schema es **entrada de un generador**, no un intérprete de runtime. Cubre el **caso canónico**; lo raro se edita a mano sobre el código generado. **Nunca retorcer el schema para modelarlo todo.**

## Forma canónica

```typescript
import { defineResource } from '@acc/schema'

export const customerResource = defineResource({
  name: 'customer',
  plural: 'customers',
  context: 'sap-licensing',
  route: '/sap-licensing/customers',
  api: '/api/v1/customers',
  labels: { singular: 'Cliente', plural: 'Clientes' },

  fields: {
    id: { type: 'uuid', origin: 'auto', pk: true },
    name: {
      type: 'string',
      origin: 'sap',
      required: true,
      vo: 'CustomerName',
      form: { control: 'text', label: 'Nombre' },
      table: { show: true, label: 'Nombre', minWidth: 220 },
      query: { sortable: true, filterable: true, searchable: true }
    }
    // …cada campo declara: vo+constraints, query, table, form, unique, relation
  },

  list: {
    defaultSort: { field: 'name', dir: 'asc' },
    pageSize: 10,
    features: { create: true, export: ['csv', 'xlsx'], search: true },
    actions: [/* view / edit / delete */]
  },

  relations: {
    contacts: { kind: 'composition', of: 'contact', in: 'detail' },
    contracts: { kind: 'inbound', from: 'contract', by: 'customerId', drilldown: true }
  },

  detail: { title: 'name', sections: ['fields', 'contacts', 'contracts'] }
})
```

## Qué genera cada bloque

| Bloque                  | Backend                                             | Frontend                    |
| ----------------------- | --------------------------------------------------- | --------------------------- |
| `vo` + constraints      | VOs con `create()` validador                        | tipos del Dto               |
| `query`                 | `search-config` (ALLOWED_FILTERS/ORDERS/SEARCHABLE) | flags de `ColumnDef`        |
| `table`                 | —                                                   | `columns: ColumnDef[]`      |
| `form`                  | validadores del DTO                                 | dialog + `Validators`       |
| `unique`                | specifications + `new*IfChanged()`                  | —                           |
| `relations.composition` | entidad hija + repo `getWith*`                      | sub-tabla en detail         |
| `relations.inbound`     | —                                                   | drill-down a tabla filtrada |

Dos tipos de arista, tratados distinto: **composición** (hijo propio, cascada en el agregado) y **referencia entre contextos** (solo ID + lookup, sin FK dura).

## Decisiones de formato (✅ RATIFICADAS por Alfonso, 2026-07-30)

> Cierran las 5 decisiones abiertas de `docs/resource-schema-customers.md` §5. Son vinculantes
> para `libs/schema` y el generador; no re-litigar sin motivo nuevo.

1. **Unicidad en campos opcionales** = semántica `ifPresent` (solo aplica si no vacío), como el `taxId` real. Sin flag extra hasta que un caso real lo pida.
2. **`origin: 'sap'`** afecta **solo al sync**, no a la editabilidad del formulario (`sapId` es editable en el form real). La editabilidad la declara `form.control`.
3. **Drill-down**: se **infiere del hijo** (`contract.customerId` con `relation.to`), no se duplica en el padre. `relations.inbound` del padre es derivado, nunca fuente.
4. **Campos con relación sin UI** (ej. `assignedKamId`): `form.control: 'none'` explícito; el generador **omite** el control hasta que exista el endpoint de lookup.
5. **Nombres de VO explícitos** (`vo: 'SapId'`), no derivados — más control, cero magia, coincide con el código de oro.

## Checklist al escribir un schema

- [ ] ¿Cada campo visible en tabla tiene `label` y `minWidth`?
- [ ] ¿`query` refleja exactamente qué es filtrable/ordenable/buscable? (es la única fuente de ALLOWED_*)
- [ ] ¿Los VOs declaran min/max/formato que el `create()` debe validar?
- [ ] ¿Las relaciones distinguen composición vs referencia?
- [ ] ¿El schema reproduce el módulo de oro campo a campo? (verificación de fidelidad tipo §4 del doc)
- [ ] ¿Estás intentando modelar algo raro? → NO lo metas: genera y edita a mano.
