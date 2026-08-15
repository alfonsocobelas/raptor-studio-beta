# Spec: Generador de recurso (arranque)

## Contexto de negocio

Primera spec del acelerador. Crea el workspace Nx y el plugin local `@raptor/generators` con su primer
generador (`resource`), y demuestra el mecanismo completo end-to-end con **una sola plantilla**: la
entidad TypeORM de `contract`, validada por diff contra el código real de la referencia. Es el paso 1-2
de la ruta de aprendizaje de `docs/guia-generador-nx.md` §9 y el "siguiente paso" del documento maestro §12.

El objetivo NO es cubrir un módulo entero (eso son las specs 03-04): es que el esqueleto
modelo → generator.ts → plantilla EJS → diff funcione y quede commiteado como base.

## User stories (formato EARS)

- WHEN ejecuto `nx generate @raptor/generators:resource contract --dry-run` THEN veo el preview de los ficheros que se generarían, sin escribir nada
- WHEN ejecuto la generación real de `contract` THEN se emite `typeorm-contract.entity.ts` formateado con las reglas de prettier del repo
- IF comparo el fichero emitido con `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.entity.ts` THEN el diff es vacío (o solo cosmético justificado y documentado)
- IF la plantilla menciona una entidad concreta (hardcodea "contract") THEN es un defecto — la misma plantilla debe servir para cualquier entidad
- WHILE se desarrolla la plantilla THEN toda la lógica de sustituciones vive en `generator.ts`, no en EJS

## Criterios de aceptación

- [ ] Workspace Nx inicializado (Node 24+, prettier/eslint con las convenciones del proyecto)
- [ ] Plugin local `libs/generators` registrado y ejecutable vía `nx generate @raptor/generators:resource`
- [ ] `contract.model.ts` escrito como dato puro (forma mínima del resource-schema, guía §3)
- [ ] La entidad TypeORM emitida reproduce la real de la referencia (diff vacío)
- [ ] `--dry-run` funciona
- [ ] Repo git en rama `develop` con commits atómicos Conventional Commits

## Referencias (proyecto de referencia y diseño)

- `docs/guia-generador-nx.md` (mecanismo completo, plantilla de ejemplo §5.1)
- `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/` (módulo de oro)
- `docs/ACELERADOR-arquitectura-consolidada.md` §6 (generador) y §9 (secuencia)

## Reglas de negocio aplicables

- "Plantillas tontas, lógica en generator.ts" (regla nº 8 de CLAUDE.md)
- "Generar, no interpretar" (regla nº 7)
- Validación por referencia de oro: diff vacío = correcto (maestro §6)

## Fuera de scope (deliberado)

- El resto de plantillas del módulo backend (spec 03) y todo el frontend (spec 04)
- `libs/schema` formal con `defineResource` (spec 01) — aquí el modelo es un objeto TS simple
- Fixtures congeladas y comando `/golden-diff` operativo (spec 02) — aquí el diff se hace a mano contra `docs/referencia`
- Cualquier adapter de infra (fase 2)
