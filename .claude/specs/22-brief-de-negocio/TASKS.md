# 22 — Brief de negocio · TASKS

> Cada tarea = un commit atómico en develop. TDD: test rojo primero.
> Gate de oro: TASK-01..04 no tocan plantillas → `/golden-diff` vacío.

- [ ] TASK-01 — Contrato en `@acc/schema`: `BusinessBrief` + `AppDefinition.brief` + `ResourceDefinition.brief`, validación con topes en `defineApp`/`defineResource` (tests: acepta válido, rechaza `business` vacío, corta por tope)
- [ ] TASK-02 — Chat de punta a punta: `DesignPayload.brief` + `DraftResource.brief`, prompt («destila, conserva, no inventes»), `RESPONSE_SCHEMA`, fake adapter con brief de demo, topes en `validateDesign` (tests del gate primero)
- [ ] TASK-03 — Estudio: signal `brief` en `DesignStore` (`mutate`/`applyExternal`/`exportJson`/`importJson`), panel plegable «Contexto del negocio» sobre el chat, `brief` de entidad en el inspector
- [ ] TASK-04 — Cruce al generador: `buildAppFile` copia `design.brief`; `draftToResource` copia el de entidad al `ResourceDefinition` (test de la frontera)
- [ ] TASK-05 — Emisión: `CLAUDE.md` en la raíz de la app generada (markdown construido en `generator.ts`, plantilla tonta; sin brief → sin fichero). Gate: fixtures actuales sin brief → diff vacío
- [ ] TASK-06 — Fixture de oro nueva CON brief (commit propio de re-baseline, skill `golden-diff`)
- [ ] TASK-07 — Validación final: `/golden-diff` completo, suites de `@acc/schema` + generadores + estudio verdes, verificación manual con bridge: contar negocio → recargar → el turno siguiente no repregunta

## Regla del juego

- Implementar UNA, commitear, esperar revisión, siguiente.
- Si una tarea supera ~1h o ~150 líneas, partirla antes de empezar.
- Dependencia oculta no contemplada → PARA y reporta.
