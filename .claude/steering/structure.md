# Estructura del repo — Acelerador

> Estado actual: solo existen `docs/` y `.claude/`. El workspace Nx se crea en la TASK-01 de la spec `00-generador-recurso`. Esta es la estructura OBJETIVO.

## Vista general (objetivo)

```
acelerador/
├── .claude/                       # Este arnés (constitución, skills, specs)
├── docs/                          # 17 documentos de diseño (maestro + ADRs + guías)
│   └── referencia/                # ⚠️ copia completa de sap-licenses (código + .claude + docs)
├── libs/
│   ├── schema/                    # defineResource + tipos del resource-schema (TS puro)
│   ├── generators/                # Plugin Nx local
│   │   ├── generators.json
│   │   └── src/generators/resource/
│   │       ├── generator.ts       # LA LÓGICA (sustituciones, helpers)
│   │       ├── schema.json        # opciones del comando
│   │       ├── schema.d.ts
│   │       └── files/             # plantillas EJS (.template, __name__)
│   │           ├── backend/       #   domain/ application/ infrastructure/
│   │           └── frontend/      #   list, dialog, detail, service, routes
│   └── infra/                     # Catálogo de adapters (ADR-004)
│       ├── ports/                 # StoragePort, … (abstract classes)
│       └── storage-azure/         # 1er adapter real (copiado de referencia)
├── tools/
│   └── golden-fixtures/           # ⚠️ fixtures congeladas — NUNCA editar a mano
│       ├── customers/  contracts/  licenses/  projects/
└── (más adelante) apps/ de demo si hace falta conducir el código emitido
```

## Estructura del módulo EMITIDO por el generador

Espeja la referencia (`docs/referencia/libs/backend/src/contexts/{context}/modules/{module}/`):

```
{module}/
├── domain/            # {entity}.ts (AggregateRoot), VOs, errors, constants, repository (port), specifications
├── application/       # use-cases/, handlers/, dtos/, mappers/, config/search-{entity}-config.ts
├── infrastructure/    # entrypoints/ (controller + DTOs HTTP), persistence/typeorm/ (entity, mapper, repository)
└── {module}.module.ts
```

Y en frontend: `features/{module}/` con `*-list`, `*-dialog`, `*-detail` + servicio con `resource()`.

## Reglas de estructura — inamovibles

1. **`libs/schema` es TypeScript puro**: prohibido `@nestjs/*`, `@angular/*`, `typeorm`, `ejs`, `@nx/devkit`. Es el contrato; no conoce al generador.
2. **Las plantillas no mencionan entidades concretas**: solo huecos (`<%= %>`, `__name__`). Si una plantilla dice "customer", está mal.
3. **`tools/golden-fixtures/` es de solo lectura**: se regenera con re-baseline deliberado (`golden-diff`), nunca ediciones manuales.
4. **Plantillas de features no importan `@spartan-ng/*` directamente** (ADR-003 Nivel 1): emiten contra componentes shared.
5. **Plantillas de domain no emiten imports de framework** en `domain/` (el código emitido cumple las mismas 10 reglas de oro que la referencia).
6. **Barrel único por lib**; dentro de la lib, imports directos al fichero.

## Naming (idéntico a la referencia)

Ficheros kebab-case, clases PascalCase, `{Acción}{Entidad}UseCase`, `TypeOrm{Entity}Repository`, `{Entidad}Mother/Builder/RepositoryMock`, tests `.test.ts` (back) / `.spec.ts` (front). Ver `docs/referencia/.claude/steering/structure.md` para la tabla completa.
