# Tareas atómicas: La columna de texto largo no ensancha la tabla

> Cada tarea = un commit atómico en develop. Implementar UNA, commit, esperar revisión.
> Las que tocan plantillas llevan gate de `/golden-diff`; las que tocan plantilla Angular, `web:build`.

---

- [ ] **TASK-01**: pintado — `ColumnDef.maxWidth` y la rama del techo en `cellTpl`
      (`block truncate` + `[style.max-width.px]` + `[hlmTooltip]` + `tooltipDisabled`), más el caso en
      la suite emitida (`data-table.spec.ts.template`): una columna con `maxWidth` corta y una sin
      `maxWidth` se pinta como hoy. Nadie produce `maxWidth` todavía, así que el emitido no cambia de
      comportamiento: la tabla solo aprende a obedecer un techo que aún no recibe.
      **Gate**: `/golden-diff` con diff esperado y declarado en `data-table.ts` + `data-table.spec.ts`
      de las fixtures `app` y `app-mongo` (re-baseline revisado línea a línea) + `web:build` de una app
      emitida — es el único que valida `@let` y el binding de `tooltipDisabled`.

- [ ] **TASK-02**: política — `FieldTable.maxWidth` en `libs/schema`, `LONG_TEXT_MAX_WIDTH = 280` y la
      derivación `control: 'textarea'` → techo en `renderFrontendColumns`, con el escape del modelo
      ganando. Test rojo primero en `long-text-column.spec.ts` (calco de `boolean-column.spec.ts`):
      derivado, explícito gana, columna normal intacta, `virtualColumns` sin techo.
      **Gate**: `/golden-diff` **vacío** — ningún modelo del gate tiene columna de texto largo, así
      que si algo se mueve aquí es un defecto, no un cambio esperado.

- [ ] **TASK-03**: el mock del lienzo — `whitespace-nowrap` en celdas y en el `span` de la cabecera
      (NO en el `<th>`: dentro vive el popover del editor de columna), techo + `truncate` +
      `[hlmTooltip]` para los campos `text`, y `LONG_TEXT_COL_MAX_PX = 280` con la referencia cruzada
      al generador. Test primero en `canvas-table.component.spec.ts`: campo `text` acotado y truncado,
      campo `string` intacto, ninguna celda envolviendo.
      **Gate**: suite del estudio (`vitest` con cwd en `apps/studio`) + `web:build` del estudio.

- [ ] **TASK-04**: verificación en la demo y cierre — regenerar `taller` **reiniciando antes el
      `studio-api`** (trampa de la spec 52), y capturar las dos pantallas: el lienzo de Órdenes (5
      filas de una línea, avería cortada, nada partido) y el listado de la app emitida (columnas de
      importe y garantía otra vez en pantalla). Gates de la app emitida: `web:build`, `typecheck` y su
      suite. ROADMAP (el defecto de `stickyLeftOffsets`, la copia del DataTable del estudio sin
      regenerar) y memoria. De paso, la línea huérfana `- [ ] TASK-04` de la spec 53, que se fusionó
      en la `TASK-03+04` y hace que `/spec-status` señale una tarea inexistente.

---

## Orden y por qué

La plantilla va **antes** que la política, al revés de lo que pide el instinto: si la política
llegase primero, los listados emitirían `maxWidth: 280` contra un `ColumnDef` que no conoce la clave
y la app `solaris` dejaría de compilar entre dos commits. Con este orden, cada tarea deja el repo
verde por sí sola: la 01 enseña a la tabla a obedecer un techo que nadie le da todavía, y la 02 se lo
empieza a dar.

La 03 va después de la 02 porque el mock replica al emitido, y replicar algo que aún no existe es
copiar una decisión no tomada. La 04 es la única que puede desmentir a las tres: hasta que no hay
captura del lienzo con las cinco filas en una línea, esto no está hecho.
