# Tareas atómicas: El panel admite tablas

> Cada tarea = un commit atómico en develop. Las que tocan plantillas/generator llevan gate de
> `/golden-diff`; las que tocan plantilla Angular llevan `npm run web:build` de la app emitida.

---

- [ ] **TASK-01**: `DashboardPage.tables` en `@raptor/schema` + validación en `defineApp`
      (recurso inexistente y repetido dentro del panel), con tests. Sin consumidores todavía.

- [ ] **TASK-02**: frontera `designPagesToAppPages`: la tabla de una vista con `kpis` viaja a
      `tables` del panel; la clave del `listed` pasa a `dashboard:<r>` / `resource:<r>` para que la
      misma tabla en su propia vista siga emitiendo su pantalla **con su título**. Tests en
      `design-to-app.spec.ts` incluido el caso de la demo taller (Panel + Órdenes).

- [ ] **TASK-03**: modo embebido del listado emitido — `embedded = input(false)` y la cabecera de
      pantalla bajo `@if (!embedded())`. Gate de oro (los cuatro recursos cambian una línea) +
      `web:build`.

- [ ] **TASK-04**: el panel emitido renderiza los listados declarados: bindings en `generator.ts`
      (imports, selectores, orden), plantilla del dashboard, y la app de oro estrena panel con la
      tabla de `contract`. Re-baseline comparado línea a línea + `web:build`.

- [ ] **TASK-05**: estudio — aviso de tabla duplicada en la misma vista (dos del mismo recurso
      colapsan al emitir). Suite del estudio + `web:build` del estudio.

- [ ] **TASK-06**: verificación en la demo: devolver la tabla al Panel de `taller`, regenerar,
      levantar y comprobar en navegador que el panel lleva KPIs + listado y que «Órdenes» sigue en
      el menú con su título. Capturas a `docs/style/`.

---

## Notas

- El orden dentro del panel es fijo: widgets → listados → hueco `@ai dashboard-extra`.
- TASK-03 y TASK-04 se pueden partir si el re-baseline sale ruidoso, pero en ese orden: primero el
  componente sabe callarse la cabecera, después el panel lo usa.
