# Tareas atómicas: Accesos y diagrama de casos de uso

> Cada tarea = un commit atómico en develop. Las de plantillas/generator llevan gate de
> `/golden-diff`; las de estudio que tocan plantilla Angular llevan `npm run web:build`.
> ⚠️ Hay WIP de Alfonso sin commitear (flow-*, model-sidebar, views-sidebar…): revisar
> `git status` antes de cada commit y NO arrastrar su WIP (add selectivo, nunca amplio).

## Bloque A — contrato

- [ ] **TASK-01**: TDD + `AccessDefinition`/`AccessRole` + `access?` en `ResourceDefinition`,
      gate en `defineResource` (roles legales, duplicados, verbos existentes, transitions
      sin máquina = error, array vacío legal) y `resolveAccess()` exportada con los
      defectos de la política actual.

## Bloque B — emisión backend

- [ ] **TASK-02**: `/golden-diff` + los `@Roles(...)` del CRUD y satélites (export/import,
      adjuntos, historial, papelera, composición) se calculan en `generator.ts` con
      `resolveAccess` y las plantillas solo interpolan. Fixture de suite con matriz
      no-default; el golden no se mueve.

- [ ] **TASK-03**: `/golden-diff` + los endpoints de transición (43) y los pasos de proceso
      convergidos (44) usan `transitionRoles[verbo]`.

## Bloque C — emisión frontend

- [ ] **TASK-04**: `/golden-diff` + `typecheck:emitted` + constantes de roles por dominio y
      botones condicionados por rol de sesión («Nuevo», editar/borrar, import, botones de
      transición) + la nav oculta la entrada sin Ver. Sin auth (dev-auth admin) nada cambia.

## Bloque D — estudio

- [ ] **TASK-05**: TDD + `access-diagram.ts` en dominio compartido: derivación pura
      diseño → diagrama de casos de uso (actores, cajas de sistema por entidad, elipses de
      capacidad, aristas según matriz efectiva).

- [ ] **TASK-06**: TDD + `DraftResource.access` + `draftToResource` lo copia +
      `setResourceAccess` en `DesignStore` con autosave + `validateDesign` reenvía el gate
      con mensaje accionable.

- [ ] **TASK-07**: `access-sidebar.component`: matriz de checkboxes por entidad (Usuario/
      Consulta editables, Admin fijo atenuado; transiciones solo si hay máquina; estado
      vacío que manda al Modelo). `npm run web:build`.

- [ ] **TASK-08**: `access-view.component` en el lienzo (solo lectura, viewport) sustituyendo
      el placeholder del modo `access` en `studio-canvas`. `npm run web:build` + smoke.

## Validación

- [ ] **TASK-09**: Suite completa + `web:build` + `/golden-diff` + navegador: matriz editada
      en el estudio (viewer sin Ver en una entidad, transición restringida), app generada
      con auth, y en vivo: viewer sin «Nuevo» ni entrada de nav, 403 real en la API, botón
      de transición solo para quien toca. Capturas a `docs/style/`.

---
