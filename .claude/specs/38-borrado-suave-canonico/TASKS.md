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
- [x] **TASK-07**: ~~adapter Mongoose~~ (entró con TASK-04). Lo que quedaba —probar el arrastre
      contra una BD real por el camino Mongoose— se **cerró en la spec 76** (2026-08-31, demo
      `apps/licencias`): DELETE del padre por HTTP ⇒ 204, las dos hijas marcadas con el MISMO
      `deletedOp` (una transacción del replSet, verificado con mongosh contra la base) y fuera
      de los listados. El restore ya no aplica: la papelera se retiró el 2026-08-28 (spec 29
      fuera del generador). TASK-12 había verificado solo Postgres (Solaris).

## Frontend

- [x] **TASK-08**: copy del diálogo en listado y ficha, con género del modelo y aviso
      genérico de arrastre. `173096b` + re-baseline `94eb816` (project, el único de oro que
      borra).
- [x] **TASK-09**: auditoría escrita como 7 tests. Verdes a la primera: toda superficie lee
      por el mismo endpoint paginado → matching/count → exclusión del repositorio base. No
      hizo falta arreglar nada; lo que hacía falta era fijarlo. `6517153`

## Gates finales

- [x] **TASK-10**: gates verdes en cada tarea: 591 tests del generador, typecheck emitido 0
      errores, 6 árboles de oro vacíos, y la suite EMITIDA de Solaris 185 ✓.
- [x] **TASK-11**: re-baseline hecho por tarea (01, 03, 04, 08), cada uno revisado a mano y
      en su commit `chore(golden)` propio.
- [x] **TASK-12**: Solaris regenerada y verificada contra Postgres real:
      · borrar cliente con obra y parte vivos → **204** (antes 500) y caen los tres niveles (1,1,1)
      · restaurar → vuelven exactamente esos tres; el parte borrado APARTE sigue en la papelera
      · material (escotilla física) borra sin papelera
      · copy real: «Se archivará el cliente "Cerámicas Duero S.L." y sus registros relacionados»
      Capturas e2e-32/33/34. Absorbe la verificación que quedaba de TASK-07 (postgres);
      mongo queda pendiente de una pasada con su replSet.
