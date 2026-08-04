# Tareas atómicas: el emitido compila

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde antes de cada commit.

---

## El gate primero (la red antes del trapecio)

- [x] **TASK-01**: `tools/typecheck-emitted.sh` + target `generators:typecheck-emitted` + script
      `npm run typecheck:emitted`. Genera, mueve FUERA del árbol, instala y compila; limpia siempre.
      · verde con la app de demo: **0 errores**
      · **verificado que sabe fallar**: inyectando en la plantilla del logger el mismo import roto
      que se nos escapó en la spec 24, el gate lo caza (1 × TS2307) con el fichero y la línea
      · acepta argumentos, así que sirve para cualquier combinación:
      `bash tools/typecheck-emitted.sh --app=boutique --infra=azure`

## Familia C — el generador deja de contradecirse

- [x] **TASK-02**: el mapper se emite siempre. `skipEmit` **desaparece del contrato del modelo**
      (`libs/schema`) porque no era una decisión del modelo sino del gate: ahora las rutas no
      comparadas viven en `tools/golden-skip.txt`, con el motivo escrito al lado, y `golden-diff.sh`
      las salta (también en la comprobación inversa).
      · medido: la app de las 4 entidades de oro baja de **75 a 72** errores
      · `customers` pasa de 77 a 78 ficheros emitidos y `licenses` de 43 a 44
- [ ] **TASK-03**: Los imports del `seed.ts` emitido se filtran a los modelos que de verdad emiten
      seeder (`entry.emit && app.writes`). Test con `license`, que no escribe.

## Familia B — el fallback, para todos los campos

- [ ] **TASK-04**: `fromPrimitives` aplica `?? null` a los campos crudos cuyo primitive es opcional y
      cuyo agregado los exige `Nullable<…>`. Tests sobre `project` (5 campos) y `license` (2).

## Cierre

- [ ] **TASK-05**: Medición final: la app de las 4 entidades de oro baja de **75 a 49** errores y
      **todos** los restantes son de familia A (clasificación adjunta). Anotar el resultado aquí y
      abrir la spec 27 con la familia A ya medida.
