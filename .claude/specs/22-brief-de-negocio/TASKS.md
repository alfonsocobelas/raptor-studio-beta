# 22 — Brief de negocio · TASKS

> Cada tarea = un commit atómico en develop. TDD: test rojo primero.
> Gate de oro: TASK-01..04 no tocan plantillas → `/golden-diff` vacío.

- [x] TASK-01 — Contrato en `@acc/schema`: `BusinessBrief` + `AppDefinition.brief` + `ResourceDefinition.brief`, validación con topes en `defineApp`/`defineResource` (tests: acepta válido, rechaza `business` vacío, corta por tope)
- [x] TASK-02 — Chat de punta a punta: `DesignPayload.brief` + `DraftResource.brief`, prompt («destila, conserva, no inventes»), `RESPONSE_SCHEMA`, fake adapter con brief de demo, topes en `validateDesign` (tests del gate primero)
- [x] TASK-03 — Estudio: signal `brief` en `DesignStore` (`mutate`/`applyExternal`/`exportJson`/`importJson`), panel plegable «Contexto del negocio» sobre el chat, `brief` de entidad en el inspector
- [x] TASK-04 — Cruce al generador: `buildAppFile` copia `design.brief`; `draftToResource` copia el de entidad al `ResourceDefinition` (test de la frontera)
- [x] TASK-05 — Emisión: `CLAUDE.md` en la raíz de la app generada (markdown construido en `generator.ts`, plantilla tonta; sin brief → sin fichero). Gate: fixtures actuales sin brief → diff vacío
- [x] TASK-06 — Fixture de oro nueva CON brief (commit propio de re-baseline, skill `golden-diff`)
- [x] TASK-07 — Validación final: `/golden-diff` completo, suites de `@acc/schema` + generadores + estudio verdes, verificación manual con bridge: contar negocio → recargar → el turno siguiente no repregunta
      · 2026-08-08, desbloqueada por la spec 21 (persistencia): e2e en navegador con el
        chat fake — contar el negocio deja brief, el autosave lo escribe, tras RECARGAR
        el panel lo muestra intacto y el turno siguiente lo lleva en la petición real
        (interceptada y verificada). Golden 6/6 vacíos y suites verdes ese mismo día
      · HECHO (2026-08-07): suites verdes — schema 108, estudio 234 (jest) + 204 (vitest); los 6
        golden vacíos en la parte de esta spec (los diffs restantes al correr eran el RED en vuelo
        de la spec 29 de la sesión concurrente, no de aquí)
      · PENDIENTE y por qué: la mitad «recargar» de la verificación con bridge depende de la
        persistencia de la spec 21 (historial de diseños), que resultó NO estar implementada — la
        spec 21 sólo tiene REQUIREMENTS.md. El brief sí viaja en cada turno, sobrevive a
        applyExternal y va en el export; lo que no existe es la restauración tras recarga (de NADA,
        tampoco del diseño). Decidir: implementar la spec 21 primero o rebajar el criterio

## Regla del juego

- Implementar UNA, commitear, esperar revisión, siguiente.
- Si una tarea supera ~1h o ~150 líneas, partirla antes de empezar.
- Dependencia oculta no contemplada → PARA y reporta.
