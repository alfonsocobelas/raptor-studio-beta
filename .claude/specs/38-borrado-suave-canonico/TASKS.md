# Tareas atómicas: Borrado suave canónico

> Cada tarea = un commit atómico en develop. Orden TDD: test del generador en rojo →
> plantilla/lógica → verde → siguiente.
>
> **Corrección sobre el plan inicial (tras TASK-01)**: el re-baseline NO se acumula al final.
> Cada tarea que cambia el canon se cierra con su propio `chore(golden)` inmediatamente
> después, para que el árbol nunca quede con el gate en rojo. Y el re-baseline se hace
> COPIANDO sin borrar (`rsync -a`, nunca `--delete`): las fixtures contienen ficheros de la
> referencia que el generador todavía no emite, y un `--delete` se llevó 87 por delante.
> Los ficheros de `tools/golden-skip.txt` (mappers con composición a mano) no se pisan.

---

## Contrato y cimientos

- [x] **TASK-01**: `softDelete` cambia su defecto a `true` (helper único `wantsSoftDelete()`
      en el schema, siete puntos de decisión unificados), `material` declara la escotilla
      física. `f27f1f1` + re-baseline `6593236` (7 ficheros: entidades de contract/customer,
      migración y esquemas mongoose).
- [x] **TASK-02**: árbol de arrastre (`drag-tree.ts`, anchura con visitados para cortar
      ciclos) y su sustitución `dragTree`. Verificado con la demo: account → [installation,
      worklog]; material (físico) → []. `9aa99e1`
- [x] **TASK-03**: columna `deleted_op` en entidad TypeORM y migración de fábrica.
      `aa0f909` + re-baseline `f364e2b`. Matiz aprendido: la cascada de COMPOSICIÓN se
      queda (hijo embebido del padre); lo que nunca cascadea es una referencia entre
      agregados, que sigue en RESTRICT.

## Backend

- [x] **TASK-04**: contrato de borrado con operación en el port y AMBOS adapters (el port es
      compartido: dejar mongoose atrás no compilaba, así que la mitad de contrato de la
      TASK-07 entró aquí). `removeDraggedBy<Fk>` por referencia + `restoreByOp`. VO
      `DeleteOperationId` en el kernel. typecheck:emitted cazó dos errores de tipos antes
      del re-baseline. `0d87db3` + `d11d9ff`.
- [x] **TASK-05**: use case transaccional con el plan renderizado al emitir; módulo del
      padre importa los de su árbol (todos exportaban ya su repo); historial dentro de la
      tx; hojas sin transacción. Plan GATEADO a `features.delete` (sin removes sería DI
      muerta) ⇒ golden vacío sin re-baseline. El rollback real queda para la integración
      de TASK-12 (el unitario emitido prueba la orquestación). `1282cd0`
- [x] **TASK-06**: restore por operación SIN tocar el API ni el DTO: el servidor resuelve
      el op de la fila archivada (`deletedOpOf`, ambos motores) y revierte el árbol en
      transacción. 404 antes de tocar nada; hojas como siempre. El «hijo borrado aparte no
      vuelve» queda garantizado por diseño (otro op) y se verifica e2e en TASK-12.
- [ ] **TASK-07**: ~~adapter Mongoose~~ (entró con TASK-04). Lo que queda —probar el arrastre
      y el restore contra una BD real— NO cabe en la integración emitida: es por entidad, y
      un hijo no puede insertarse sin su padre (la FK es real, las migraciones corren). Se
      **pliega en TASK-12**, que tiene padre, hijo y base de datos de verdad. El manager de
      transacción mongo ya existe y usa `withTransaction` sobre replSet.

## Frontend

- [x] **TASK-08**: copy del diálogo en listado y ficha, con género del modelo y aviso
      genérico de arrastre. `173096b` + re-baseline `94eb816` (project, el único de oro que
      borra).
- [ ] **TASK-09**: verificación de filtrado de borrados en TODAS las superficies (listado,
      lookup, KPIs, widgets, export, galería, gantt, related-tables) — tests de integración
      emitidos donde falten.

## Gates finales

- [ ] **TASK-10**: `typecheck:emitted` a 0 errores + suites completas (generadores, estudio).
- [ ] **TASK-11**: re-baseline deliberado del golden (4 referencias + 2 apps), diff revisado
      a mano, commit `chore(golden)` propio.
- [ ] **TASK-12**: regenerar la demo Solaris y e2e de los tres escenarios del REQUIREMENTS
      (padre arrastra · restore devuelve el arrastre exacto · material borra físico), con
      capturas e2e-3x.
