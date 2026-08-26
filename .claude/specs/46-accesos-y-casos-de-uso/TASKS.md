# Tareas atómicas: Accesos y diagrama de casos de uso

> Cada tarea = un commit atómico en develop. Las de plantillas/generator llevan gate de
> `/golden-diff`; las de estudio que tocan plantilla Angular llevan `npm run web:build`.
> ⚠️ Hay WIP de Alfonso sin commitear (flow-*, model-sidebar, views-sidebar…): revisar
> `git status` antes de cada commit y NO arrastrar su WIP (add selectivo, nunca amplio).

## Bloque A — contrato

- [x] **TASK-01**: TDD + `AccessDefinition`/`AccessRole` + `access?` en `ResourceDefinition`,
      gate en `defineResource` (roles legales, duplicados, verbos existentes, transitions
      sin máquina = error, array vacío legal) y `resolveAccess()` exportada con los
      defectos de la política actual.

## Bloque B — emisión backend

- [x] **TASK-02**: `/golden-diff` + los `@Roles(...)` del CRUD y satélites (export/import,
      adjuntos, historial, papelera, composición) se calculan en `generator.ts` con
      `resolveAccess` y las plantillas solo interpolan. Fixture de suite con matriz
      no-default; el golden no se mueve.

- [x] **TASK-03**: `/golden-diff` + los endpoints de transición (43) y los pasos de proceso
      convergidos (44) usan `transitionRoles[verbo]`.

## Bloque C — emisión frontend

- [x] **TASK-04**: `/golden-diff` + `typecheck:emitted` + constantes de roles por dominio y
      botones condicionados por rol de sesión («Nuevo», editar/borrar, import, botones de
      transición) + la nav oculta la entrada sin Ver. Sin auth (dev-auth admin) nada cambia.

## Bloque D — estudio

- [x] **TASK-05**: TDD + `access-diagram.ts` en dominio compartido: derivación pura
      diseño → diagrama de casos de uso (actores, cajas de sistema por entidad, elipses de
      capacidad, aristas según matriz efectiva).

- [x] **TASK-06**: TDD + `DraftResource.access` + `draftToResource` lo copia +
      `setResourceAccess` en `DesignStore` con autosave + `validateDesign` reenvía el gate
      con mensaje accionable.

- [x] **TASK-07**: `access-sidebar.component`: matriz de checkboxes por entidad (Usuario/
      Consulta editables, Admin fijo atenuado; transiciones solo si hay máquina; estado
      vacío que manda al Modelo). `npm run web:build`.

- [x] **TASK-08**: `access-view.component` en el lienzo (solo lectura, viewport) sustituyendo
      el placeholder del modo `access` en `studio-canvas`. `npm run web:build` + smoke.

## Validación

- [x] **TASK-09**: Suite completa + `web:build` + `/golden-diff` + navegador: matriz editada
      en el estudio (viewer sin Ver en una entidad, transición restringida), app generada
      con auth, y en vivo: viewer sin «Nuevo» ni entrada de nav, 403 real en la API, botón
      de transición solo para quien toca. Capturas a `docs/style/`.

      Cerrada el 2026-08-26. En el estudio (`apps/studio/tools/smoke-machine-access.ts`):
      Consulta pierde «Ver» en Recambios y a Usuario se le retira la transición `facturar`;
      la matriz explícita viaja al diseño. En la app generada con auth
      (`apps/studio/tools/validate-emitted-machine-access.ts`):

      - Consulta: sin «Recambios» en la nav, **403 real** en `GET /recambios`, sin botón de
        alta en Órdenes y **sin un solo botón de transición** en la ficha.
      - Usuario: ve «Terminar reparación» y **no** «Facturar» (retirada en el estudio) ni
        «Aprobar presupuesto» (solo admin); `POST /ordenes/:id/aprobar` → **403 real**.
      - Admin: los mismos botones sí están.

      Capturas: `docs/style/spec46-1..5-*.png`.

---
