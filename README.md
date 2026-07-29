# Acelerador de Dashboards

Generador Nx **determinista** de dashboards de negocio: un resource-schema → un módulo completo
(dominio + persistencia + vista), con la variabilidad (piel UI, proveedor cloud) resuelta en los
bordes mediante un catálogo de adapters. Sin IA en el núcleo.

> Diseño completo en `docs/` (maestro: `docs/ACELERADOR-arquitectura-consolidada.md`).
> `docs/referencia/` contiene el proyecto de referencia (sap-licenses) del que salen los patrones
> y las referencias de oro — no se versiona en este repo.

## Requisitos

- Node `>=24` · npm `>=11`
- `npm install`

## Ejecutar el generador

```bash
# preview (no escribe nada)
npx nx generate @acc/generators:resource contract --dry-run

# generación real → tmp/generated/contracts/
npx nx generate @acc/generators:resource contract

# a un directorio concreto
npx nx generate @acc/generators:resource contract --directory tmp/probe
```

La entrada es un **modelo registrado** (dato puro) en
`libs/generators/src/generators/resource/models/`. Hoy: `contract`. Los modelos nuevos se
registran en el mapa `MODELS` de `resource.ts`.

## Validar por diff (gate de oro)

La prueba de que el generador es correcto es un **diff vacío** contra el código escrito a mano del
proyecto de referencia — no una impresión:

```bash
npx nx generate @acc/generators:resource contract

diff tmp/generated/contracts/infrastructure/persistence/typeorm/typeorm-contract.entity.ts \
     docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.entity.ts
```

Sin salida = correcto. Cualquier diff señala exactamente qué le falta a la plantilla o al modelo.
Este gate es **obligatorio antes de commitear** cambios en plantillas o `generator.ts`
(ver `.claude/skills/golden-diff/`). Cuando existan las fixtures congeladas (spec 02), el diff
se hará contra `tools/golden-fixtures/` vía `/golden-diff`.

## Tests y lint

```bash
npx nx run-many -t lint,test
```

## Estructura

```
libs/generators/                      # plugin Nx local (@acc/generators)
└── src/generators/resource/
    ├── resource.ts                   # generador: registro de modelos + generateFiles
    ├── build-substitutions.ts        # TODA la lógica de renderizado (plantillas tontas)
    ├── models/                       # resource-schemas como dato puro (provisional; spec 01 → libs/schema)
    └── files/                        # plantillas EJS (.template, __fileName__)
docs/                                 # documentos de diseño (maestro + ADRs + guías)
.claude/                              # arnés de trabajo (skills, specs, steering, hooks)
```

## Reglas de la casa (resumen)

- **Plantillas tontas, lógica en `generator.ts`** — si hay un `if` complejo en EJS, está mal.
- **Generar, no interpretar** — el schema cubre el caso canónico; lo raro se edita a mano.
- **TDD estricto** — para plantillas, el test es el diff de oro.
- Una tarea = un commit atómico en `develop` (Conventional Commits, en inglés).

El detalle vive en `.claude/CLAUDE.md` y `.claude/skills/`.
