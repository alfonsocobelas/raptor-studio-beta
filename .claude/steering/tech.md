# Stack técnico — Acelerador

## Dos planos (no confundir)

| Plano                                                  | Tecnología                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **El acelerador** (este repo)                          | Nx + plugin local `@raptor/generators` (generators + EJS) · TypeScript 5 · Node `>=24` · Jest/Vitest para el generador |
| **El código emitido** (lo que producen las plantillas) | Angular 21 (Signals, `resource()`) + Spartan NG + Tailwind v4 · NestJS 11 + TypeORM + PostgreSQL                    |

El código emitido debe ser indistinguible del escrito a mano en `docs/referencia/libs/` — mismas convenciones, mismos patrones.

## Piezas del acelerador

- **`libs/schema`**: formato del resource-schema (`defineResource`). **TypeScript puro**, sin dependencias de framework — es el contrato único del proyecto.
- **`libs/generators`**: plugin Nx local. `generator.ts` (lógica) + `schema.json` (opciones CLI) + `files/` (plantillas EJS con `__name__` y sufijo `.template`).
- **`libs/infra`** (catálogo de adapters, ADR-004): `ports/` + un directorio por adapter (`storage-azure`, …). Copiados/adaptados de `docs/referencia/`.
- **`tools/golden-fixtures/`**: fixtures congeladas de los 4 módulos de oro. **Solo se modifican mediante re-baseline deliberado** (skill `golden-diff`), nunca a mano.

## Tooling y convenciones de código

- **Prettier**: `printWidth: 120` · `singleQuote: true` · `semi: false` · `trailingComma: "none"` · `arrowParens: "avoid"`
- **ESLint**: `@typescript-eslint` + `@nx/eslint-plugin` (`nx/enforce-module-boundaries`)
- **editorconfig**: LF · UTF-8 · 2 espacios · newline final
- Conventional Commits en inglés (commitlint cuando exista el workspace)

## Comandos esenciales

Hasta que exista el workspace Nx (TASK-01 de la spec 00), no hay Makefile. Cuando exista, replicar el patrón de la referencia (`make` como fachada de npm scripts):

```bash
nx generate @raptor/generators:resource <entidad> --dry-run   # preview
nx generate @raptor/generators:resource <entidad>             # generación real
# gate de oro: regenerar los 4 módulos y comparar con tools/golden-fixtures/
```

## Decisiones técnicas y sus razones

### Plantillas tontas, lógica en `generator.ts`

Todo cálculo (filtrar campos, derivar nombres, decidir tipos) se hace en la función y se pasa masticado a la plantilla. Si aparecen `if` anidados en `<% %>`, la lógica se extrae a `generator.ts`.

### Coherencia front↔back gratis

`columns[]` (front) y `ALLOWED_FILTERS/ORDERS` (back) salen del mismo array `fields` del schema → imposible desincronizarlos.

### Generar una vez, poseer el código

Regenerar pisa lo editado. Política inicial: se genera una vez y el código pasa a ser del proyecto. Sin separación "generado vs editado".

### Puerto = abstract class, DI por la propia clase

Patrón de la referencia: puerto como `abstract class` en `domain/` o `application/ports/`, adapter `@Injectable()` que la `extends`, y `{ provide: Puerto, useClass: Adapter }`. Sin tokens string/Symbol.

### Config JSON por entorno + Key Vault

El patrón de config de la referencia (JSON bundleado + placeholders `vault.*` + `DefaultAzureCredential`) es el mecanismo canónico del catálogo Azure.

## Path aliases previstos

```
@raptor/schema      →  libs/schema/src/index.ts
@raptor/generators  →  libs/generators (plugin local, registrado en generators.json)
@raptor/infra/*     →  libs/infra/* (catálogo de adapters)
```
