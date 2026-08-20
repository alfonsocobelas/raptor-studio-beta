# Tareas atómicas: El panel es una secuencia de bloques

> Cada tarea = un commit atómico en develop. Las que tocan plantillas/generator llevan gate de
> `/golden-diff`; las que tocan plantilla Angular llevan `web:build`. El criterio de aceptación del
> refactor completo es el **gate de oro vacío**: un diseño sin `half` debe emitir el mismo byte.

---

- [x] **TASK-01**: contrato — `BlockWidth`, `DashboardBlock`, `DashboardPage.blocks`; se retiran
      `PageWidget` y `tables`. `validateDashboard` recorre bloques conservando sus reglas (duplicado
      por `kind:recurso:campo`, campos obligatorios por kind, `width` acotado). Tests en
      `define-app.spec.ts`. El repo NO compila al terminar esta tarea (los app-schemas siguen en
      `widgets`): se cierra con la 02 antes de dar nada por verde.

- [x] **TASK-02**: los cuatro app-schemas del repo (`golden`, `boutique`, `demo`, `solaris`) pasan a
      `blocks`, y `composeFlat` emite su bloque `metrics`. En `solaris` las dos métricas estaban
      intercaladas entre los analíticos: se agrupan, porque la plantilla siempre las emitió juntas y
      primero — así el emitido no se mueve.
      **Corrección del plan**: el repo NO vuelve a compilar aquí, sino tras la 03 — `composeApp`
      también lee `widgets`/`tables` y su reescritura es la 03. El tramo sin compilar cubre 01→03.

- [x] **TASK-03+04 (fusionadas)**: composición — `ComposedDashboardBlock` y `dashboardBlocks` sustituyen a
      `kpiModels`/`analytics`/`dashboardTables`; el ancho se resuelve a `'full'`; las validaciones de
      la spec 32 se mueven sin cambiar de significado. Tests de composición.

- [x] **TASK-05**: frontera del estudio — `designPagesToAppPages` emite bloques en orden con su
      ancho; se conservan las dos reglas de la spec 52. Suite del estudio + AOT.

- [x] **TASK-06**: verificado en la demo `taller`: reiniciado el `studio-api` (la trampa de la 52) y
      regenerado — el panel emite la rejilla de tres tarjetas y debajo `<app-ordenes-list
      [embedded]="true" />`, con el menú intacto. Gates de la app emitida: `web:build`, `typecheck` y
      174/174. ROADMAP y memoria actualizados.
      Pendiente NO bloqueante: el `half` dibujado se respeta según los tests de la frontera y del
      renderizador, pero no hay diseño real que lo use todavía; se verá en la primera pantalla que lo
      pida (candidata: la de pestañas + tabla relacionada).

---

## Orden y por qué

La 01, la 02 y la 03 son un tramo: la ruptura seca del contrato deja el repo roto entre medias, y es
deliberado — así nadie puede olvidarse de migrar un consumidor. La 03 y la 04 van detrás porque
consumen el contrato ya migrado, y la frontera (05) va al final porque es el único consumidor que
puede vivir con el modelo viejo mientras tanto.
