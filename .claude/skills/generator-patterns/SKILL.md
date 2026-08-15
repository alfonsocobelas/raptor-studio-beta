---
name: generator-patterns
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when working on the Nx plugin: generator.ts, schema.json, EJS templates in files/,
  generateFiles, substitutions, or when the user says "generador", "plantilla", "template",
  "EJS", "plugin Nx", "genera el módulo", "nx generate". CRITICAL: templates must be dumb;
  all logic lives in generator.ts.
---

# Patrones del generador Nx

Referencia completa: `docs/guia-generador-nx.md`. Esto es el canon operativo.

## Anatomía del plugin

```
libs/generators/
├── generators.json                       # registra el generador para `nx generate`
└── src/generators/resource/
    ├── generator.ts                      # LA LÓGICA: lee modelo, calcula, expande
    ├── schema.json                       # opciones CLI (name, dry-run…)
    ├── schema.d.ts                       # tipos de las opciones
    └── files/                            # plantillas EJS
        ├── backend/…                     # __plural__.ts.template, etc.
        └── frontend/…
```

Convenciones de nombre que Nx entiende: `__name__` → valor de `name`; sufijo `.template` se elimina al generar (evita que las plantillas compilen como código del repo).

## Las 4 reglas de oro

1. **Plantillas tontas, lógica en `generator.ts`.** Todo cálculo (filtrar campos, derivar nombres, decidir tipos) se hace en la función y se pasa masticado en `substitutions`. Si aparecen `if` anidados en `<% %>`, extraer a `generator.ts`. Es la regla que evita el inner-platform effect.
2. **Las plantillas no mencionan entidades concretas.** Solo huecos. Si una plantilla dice "customer", está mal.
3. **El generado debe ser indistinguible del código a mano de la referencia** (`docs/referencia/libs/`). La prueba es el diff de oro, no una impresión.
4. **Generar una vez, poseer el código.** Regenerar pisa lo editado; la política es generar y editar a mano después.

## Esqueleto canónico de `generator.ts`

```typescript
import { Tree, formatFiles, generateFiles, names, joinPathFragments } from '@nx/devkit'

export async function resourceGenerator(tree: Tree, options: ResourceSchema) {
  const model = loadModel(options.name) // lee el resource-schema
  const n = names(model.name) // { className, propertyName, constantName… }

  const substitutions = {
    ...model,
    className: n.className,
    propertyName: n.propertyName,
    constantName: n.constantName,
    // helpers pre-masticados para las plantillas:
    searchable: model.fields.filter(f => f.query?.searchable).map(f => f.name),
    sortable: model.fields.filter(f => f.query?.sortable).map(f => f.name),
    filterable: model.fields.filter(f => f.query?.filterable).map(f => f.name),
    columns: model.fields.filter(f => f.table?.show),
    formFields: model.fields.filter(f => f.form?.control && f.form.control !== 'none')
  }

  generateFiles(tree, joinPathFragments(__dirname, 'files'), targetDir, substitutions)
  await formatFiles(tree) // aplica prettier del repo
}
```

`names('contract')` da todas las capitalizaciones de golpe — no calcularlas en plantillas.

## Coherencia front↔back gratis

`columns[]` (front) y `ALLOWED_FILTERS/ORDERS/SEARCHABLE` (back) se derivan del **mismo** array `fields`. Nunca introducir una segunda fuente.

## Flujo de trabajo con plantillas (TDD adaptado)

1. Escribe/ajusta el `*.model.ts` de una entidad de oro (p.ej. contract).
2. Genera a carpeta temporal: `nx generate @raptor/generators:resource contract --dry-run` primero.
3. **Diff contra la fixture de oro** (`tools/golden-fixtures/contracts/…`). El diff fallando es tu test RED.
4. Ajusta plantilla/generator hasta diff vacío (GREEN). Refactoriza la plantilla si se ensució.
5. Regenera las 4 entidades de oro antes de commitear (gate `/golden-diff`).

## Pitfalls conocidos (de la guía §8)

- **EJS ilegible** = lógica en plantilla → mover a generator.ts.
- **El modelo no captura un dato**: no meterlo con calzador; generar el 80% y editar el 20% a mano. El schema crece solo cuando un patrón se repite en varias entidades.
- **VOs con validación rara** (CIF con dígito de control): generar el VO estándar; especializar a mano.
- **`formatFiles` no basta**: el generado debe pasar también `nx/enforce-module-boundaries`.

## Dónde mirar código real

- Módulos de oro: `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/{customers,contracts,licenses,projects}/`
- Front de oro: `docs/referencia/libs/frontend/src/domains/admin/bounded-contexts/sap-licensing/features/`
- Adapters Azure a copiar (no generar — ADR-004): `docs/referencia/libs/backend/src/contexts/shared/infrastructure/{config,storage,logger,telemetry}/`
