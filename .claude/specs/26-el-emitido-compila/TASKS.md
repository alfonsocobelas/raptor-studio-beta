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
- [x] **TASK-03**: el `seed.ts` emitido sólo importa lo que existe. La condición se extrae a
      `resource/emits.ts` (`emitsAggregate` / `emitsWrites` / `emitsSeeder`) para que el generador de
      recurso y el ensamblador **no puedan discrepar**: el bug nació de que cada uno decidía por su
      cuenta.
      · medido: **72 → 69 errores**, y los `TS2307` quedan en 49 = exactamente la familia A
      · re-baseline del `seed.ts` de la fixture mongo (desaparecen los 4 imports de `license`)

## Familia B — el fallback, para todos los campos

- [ ] **TASK-04**: `fromPrimitives` aplica `?? null` a los campos crudos cuyo primitive es opcional y
      cuyo agregado los exige `Nullable<…>`. Tests sobre `project` (5 campos) y `license` (2).

## Cierre

- [x] **TASK-05**: medición final. La app de las 4 entidades de oro baja de **75 a 49** errores y
      **todos** los restantes son `TS2307` de familia A: 7 módulos que el emitido importa y nadie
      emite — la capa **shared del contexto**. No queda ni un error de tipos.

      | módulo que falta                                   | sitios | canon (líneas) |
      | -------------------------------------------------- | -----: | -------------: |
      | `shared/domain/value-objects/customer-name.vo`      |     12 |            111 |
      | `shared/domain/value-objects/contract-number.vo`    |     11 |             31 |
      | `shared/domain/value-objects/contract-date.vo`      |      9 |             19 |
      | `shared/domain/value-objects/period.vo`             |      6 |             25 |
      | `shared/domain/value-objects/sync-timestamp.vo`     |      4 |             28 |
      | `shared/domain/value-objects/phone.vo`              |      4 |             32 |
      | `shared/domain/constants`                           |      3 |              5 |

      Dos hallazgos que acortan la spec 27:
      · el kernel **ya emite** todo lo que estas piezas necesitan por debajo (`DateValueObject`,
        `StringValueObject`, `spanish-title-case`, `errors`, `types`): falta sólo la capa de contexto
      · `period.vo` arrastra `shared/domain/period-error.ts`, que no aparece en el recuento porque
        nadie más lo importa (251 líneas en total, 8 ficheros)

      La app de demo (`--app=boutique`) sigue compilando con **0 errores**: el gate no ha aflojado.
