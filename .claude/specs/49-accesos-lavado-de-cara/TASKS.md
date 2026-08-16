# Tareas atómicas: Accesos — lavado de cara + granularidad CRUD

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.
> Orden TDD: test fallido primero; para plantillas EJS el test es el diff de oro.

---

## Fase 1 — Schema (el contrato)

- [x] **TASK-01**: `@raptor/schema` — `AccessDefinition` gana `create/edit/delete` (con `manage`
      como azúcar legado) y `resolveAccess` resuelve la granularidad. Tests en `access.spec.ts`:
      defectos sin `access`, solo `manage`, granular gana a `manage`, transiciones intactas.

## Fase 2 — Estudio: lógica derivada (pura)

- [x] **TASK-02**: `access-table.ts` en `apps/studio/libs/shared/domain` — `accessRows`,
      `toggleCapability`, `roleSummary`, `applyColumn` con sus tests. La matriz resultante es
      siempre explícita y sin `manage`.
- [x] **TASK-03**: `access-diagram.ts` — elipses Ver/Crear/Editar/Borrar + transiciones con
      roles granulares; tests de `access-diagram.spec.ts` actualizados.
- [x] **TASK-04**: `design-store-access.spec.ts` extendido al shape nuevo (persistencia de la
      matriz granular vía `setResourceAccess`; sin cambios de API en el store si no hacen falta).

## Fase 3 — Estudio: la pestaña nueva

- [x] **TASK-05**: `AccessUiService` (rol, pivote, búsqueda, filtro, entidad) + reescritura de
      `access-sidebar.component.ts` como raíl de roles con conmutador Rol|Entidad|Diagrama y
      nota de admin. Gate AOT `npm run web:build`.
- [x] **TASK-06**: `access-table.component.ts` — pivote Rol completo: tabla entidad×capacidad,
      celdas-botón con `aria-pressed`, guion «sin permiso» con contraste, búsqueda, filtro
      Todas|Con acceso, subtítulos derivados, pie «N de M entidades», fila admin solo lectura.
- [x] **TASK-07**: `access-summary.component.ts` — resumen derivado + barra + acciones de
      columna (Todo ver, Nada editar, Copiar de {rol}); oculto/informativo con admin.
- [x] **TASK-08**: pivote Entidad en `access-table.component.ts` (filas de rol, selector de
      entidad) y extracción del lienzo a `access-diagram-view.component.ts`; `access-view`
      queda como conmutador de los tres pivotes. Estados vacíos conservados.
- [x] **TASK-09**: repaso visual contra 30A/31B en claro y oscuro (temas, espaciados, activo
      del raíl) y actualización de `tools/smoke-access.ts` + capturas `smoke-access-*.png`.

## Fase 4 — Generador (fontanería)

- [x] **TASK-10**: `build-entrypoints.ts` — `writeRoles` → `createRoles/updateRoles/deleteRoles`
      (tests de `access-roles.spec.ts` primero) y plantillas backend: controller principal,
      composición, adjuntos según el mapa del DESIGN. Gate `/golden-diff` + re-baseline.
- [ ] **TASK-11**: frontend emitido — `__fileName__-access.ts` parte `CAN_MANAGE_ROLES` en las
      tres constantes; `list` y `trash` las consumen por acción. Golden + re-baseline.
- [ ] **TASK-12**: verificación de punta a punta — regenerar una demo, suite verde, revisar
      que los guards emitidos y la visibilidad de botones respetan una matriz con
      create≠edit≠delete. Cierre de spec.

---

> Backlog fuera de spec (ya anotado en memoria): «+ Nuevo rol», «Ver la app como {rol}»,
> regla por filas, contadores de personas.
