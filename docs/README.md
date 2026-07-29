# Acelerador de Dashboards — Starter pack de Claude Code

Paquete de arranque del proyecto **acelerador**, heredado y adaptado del `.claude` de `sap-licences` (2026-07-12). Contiene todo lo necesario para arrancar el desarrollo desde cero con las bases ya aprendidas.

## Contenido

```
acelerador-starter/
├── .claude/
│   ├── CLAUDE.md                  # Constitución del proyecto (identidad, reglas, principios rectores)
│   ├── settings.json              # Hooks (guards + lint-staged) y permisos
│   ├── settings.local.json.example
│   ├── steering/                  # product.md · tech.md · structure.md (se autocargan cada sesión)
│   ├── skills/                    # 10 skills auto-invocables (canon operativo)
│   ├── commands/                  # /spec-new /spec-status /task-next /arch-review /golden-diff
│   ├── scripts/                   # guards de hooks (comandos peligrosos + arquitectura)
│   └── specs/
│       ├── ROADMAP.md             # mapa completo del proyecto: specs 00-10 + bajo demanda
│       ├── _template/             # plantilla de spec (REQUIREMENTS + DESIGN + TASKS)
│       └── 00-generador-recurso/  # primera spec, redactada y lista para /task-next
├── docs/
│   └── acelerador/                # los 17 documentos de diseño (maestro, ADR-001…007, guías, UMLs, revisión)
└── README.md                      # este fichero
```

## Instalación en el repo nuevo

1. Crea la carpeta del proyecto **hermana de `sap-licences/`** (las rutas de referencia `../sap-licences/` y `../ip-opentext-cmis-api/` lo asumen):
   ```bash
   mkdir acelerador && cd acelerador && git init
   ```
2. Copia `.claude/` y `docs/` a la raíz del repo.
3. Da permisos de ejecución a los scripts de hooks:
   ```bash
   chmod +x .claude/scripts/*.sh
   ```
4. Decide qué versionas: en sap-licences `.claude/` va gitignored a propósito (skills privadas firmadas) y `docs/` gitignored con excepciones. Replica esa política o cambia de criterio conscientemente.
5. Abre Claude Code en la carpeta. La primera sesión activará `session-start`, detectará la spec `00-generador-recurso` y propondrá **TASK-01** (crear el workspace Nx).

## Diferencias deliberadas respecto al `.claude` de sap-licences

- **Sin `visual-fidelity` ni gate visual Playwright**: aquí no hay UI que conducir. Su equivalente es el **gate de oro** (skill `golden-diff` + comando `/golden-diff`): toda plantilla se valida regenerando contra fixtures congeladas.
- **Sin `dto-sync`**: no hay `libs/shared/domain` front↔back. Su lugar lo ocupa `schema-authoring` (el resource-schema es el contrato único de este proyecto).
- **`backend-patterns` / `frontend-patterns` reorientadas**: ya no gobiernan código que escribes a mano, sino **el código que emiten las plantillas** (la referencia viva pasa a ser `../sap-licences/`).
- **Skills nuevas**: `generator-patterns` (plugin Nx + EJS), `schema-authoring` (formato canónico + decisiones cerradas), `golden-diff` (fixtures + re-baseline).
- **Hooks adaptados**: el guard de imports vigila la pureza de `libs/schema`, las plantillas (Spartan en features, framework en domain) y bloquea escrituras en `tools/golden-fixtures/`.

## Estado del diseño

- Brainstorming **cerrado** (2026-07-12). Decisiones firmes en `steering/product.md`; detalle en `docs/acelerador/` (leer el maestro primero, después la revisión crítica).
- Las 5 decisiones abiertas del resource-schema quedaron **cerradas** (resource-schema-customers.md §5) e incorporadas a la skill `schema-authoring`.
- Pendientes conocidos (no bloquean la spec 00): ADR-008 distribución del kernel (B1), selección de adapter en generación (A3), propagación de denormalización (B2), scoping en Criteria (B4), constante compartida de campos (C1), uniformización de los 4 módulos de oro (C2), anotar ADR-001 (A1).
