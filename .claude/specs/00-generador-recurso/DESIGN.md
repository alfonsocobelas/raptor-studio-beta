# Diseño técnico: Generador de recurso (arranque)

> REQUIREMENTS aprobado al heredar el starter (2026-07-12). Diseño basado en `docs/guia-generador-nx.md`.

---

## Workspace Nx

- `npx create-nx-workspace@latest` (preset ts/none, sin apps todavía) o `nx init` sobre repo vacío.
- Node `>=24`, npm, `engine-strict`. Prettier: `semi: false`, `singleQuote: true`, `printWidth: 120`, `trailingComma: "none"`, `arrowParens: "avoid"`. ESLint + `@nx/eslint-plugin`.
- `nx add @nx/plugin` → `nx g @nx/plugin:generator resource --directory=libs/generators/...` (esqueleto oficial).

## Estructura resultante

```
libs/generators/
├── generators.json                         # { "generators": { "resource": {...} } }
└── src/generators/resource/
    ├── generator.ts                        # lógica: loadModel + substitutions + generateFiles
    ├── schema.json                         # { name: string } (entidad a generar)
    ├── schema.d.ts
    ├── models/contract.model.ts            # la definición de entidad (dato puro)
    └── files/backend/infrastructure/persistence/typeorm/
        └── typeorm-__name__.entity.ts.template
```

(La ubicación de `models/` es provisional en esta spec; la spec 01 la formaliza en `libs/schema`.)

## La entrada (forma mínima del resource-schema, guía §3)

```typescript
export const contract = {
  name: 'contract',
  plural: 'contracts',
  context: 'sap-licensing',
  fields: [
    { name: 'id', tsType: 'string', column: 'uuid', pk: true },
    { name: 'contractNumber', tsType: 'string', column: 'varchar', required: true, unique: true }
    // …campos copiados fielmente de la entidad real de docs/referencia
  ]
} as const
```

**Fidelidad primero**: los campos se transcriben de `typeorm-contract.entity.ts` real (incluido
naming snake_case vía SnakeNamingStrategy, schema `sap_licensing`, índices y defaults) para que el
diff pueda ser vacío.

## La plantilla (única en esta spec)

`typeorm-__name__.entity.ts.template` — emite `@Entity({ name: '<%= plural %>', schema: '<%= schemaName %>' })`,
decoradores `@Column`/`@Index` por campo, tipos TS. Sin lógica: recibe todo masticado
(`columnsWithOptions`, `indexes`, etc. calculados en `generator.ts`).

## Validación (a mano en esta spec)

```
nx generate @acc/generators:resource contract → tmp
diff tmp/... docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.entity.ts
```

## Decisiones técnicas

| Decisión             | Opción elegida                   | Razón                                                      |
| -------------------- | -------------------------------- | ---------------------------------------------------------- |
| Preset del workspace | ts vacío, sin apps               | Solo hace falta el plugin; las apps de demo llegan después |
| Ubicación del modelo | junto al generador (provisional) | `libs/schema` es la spec 01; no adelantar estructura       |
| Alcance de plantilla | solo entidad TypeORM             | Ver el mecanismo end-to-end con lo mínimo (guía §9.2)      |
| Git                  | rama `develop`, commits directos | Decisión 2026-07-29 (CLAUDE.md)                            |

## Riesgos identificados

| Riesgo                                                                                          | Probabilidad | Impacto | Mitigación                                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------ |
| El diff nunca vacía por detalles de formato (prettier/imports)                                  | media        | medio   | `formatFiles` + copiar convenciones exactas de la referencia; documentar los cosméticos que se acepten |
| La entidad real usa detalles no capturables por el modelo mínimo (índices compuestos, defaults) | media        | bajo    | Ampliar el modelo solo con lo que la entidad real exige; nada especulativo                             |
| Versiones de Nx/plugin incompatibles con lo documentado                                         | baja         | medio   | No inventar API: verificar contra la doc de la versión instalada                                       |
