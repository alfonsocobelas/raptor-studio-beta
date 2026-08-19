# Tareas atómicas: El panel admite tablas

> Cada tarea = un commit atómico en develop. Las que tocan plantillas/generator llevan gate de
> `/golden-diff`; las que tocan plantilla Angular llevan `npm run web:build` de la app emitida.

---

- [x] **TASK-01**: `DashboardPage.tables` en `@raptor/schema` + validación en `defineApp`
      (recurso inexistente y repetido dentro del panel), con tests. Sin consumidores todavía.

- [x] **TASK-02**: frontera `designPagesToAppPages`: la tabla de una vista con `kpis` viaja a
      `tables` del panel; la clave del `listed` pasa a `dashboard:<r>` / `resource:<r>` para que la
      misma tabla en su propia vista siga emitiendo su pantalla **con su título**. Tests en
      `design-to-app.spec.ts` incluido el caso de la demo taller (Panel + Órdenes).

- [x] **TASK-03**: modo embebido del listado emitido — `embedded = input(false)` y la cabecera de
      pantalla bajo `@if (!embedded())`. Gate de oro (los cuatro recursos cambian una línea) +
      `web:build`.

- [x] **TASK-04**: el panel emitido renderiza los listados declarados: bindings en `generator.ts`
      (imports, selectores, orden), plantilla del dashboard, y la app de oro estrena panel con la
      tabla de `contract`. Re-baseline comparado línea a línea + `web:build`.

- [x] **TASK-05**: estudio — aviso de tabla duplicada en la misma vista (dos del mismo recurso
      colapsan al emitir). Suite del estudio + `web:build` del estudio.

- [x] **TASK-06**: verificación en la demo: la tabla vuelve al Panel de `taller`, regenerado y
      levantado. Emitido comprobado: el panel importa y monta `<app-ordenes-list [embedded]="true" />`
      y el menú recupera «Órdenes» (antes decía «Órdenes de reparación», el plural por defecto, con
      la vista perdida). Gates de la app emitida: `web:build`, `typecheck` y 174/174.
      **Trampa cazada aquí**: el `studio-api` corre con `ts-node` y NO recarga — generar desde el
      estudio con la frontera recién cambiada emite con la vieja. Reiniciarlo antes de generar.
      Capturas del navegador: pendientes de que Alfonso las quiera (queda revisión visual).

---

## Notas

- El orden dentro del panel es fijo: widgets → listados → hueco `@ai dashboard-extra`.
- TASK-03 y TASK-04 se pueden partir si el re-baseline sale ruidoso, pero en ese orden: primero el
  componente sabe callarse la cabecera, después el panel lo usa.
