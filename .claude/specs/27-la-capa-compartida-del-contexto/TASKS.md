# Tareas atómicas: la capa compartida del contexto

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde antes de cada commit.

---

## El guard primero (que un `voShared` sin declarar sea suite roja, no un import roto)

- [ ] **TASK-01**: tipo `SharedVoDefinition` en `libs/schema` y registro `models/shared-vos.ts` con las
      6 declaraciones **medidas del canon** (no inventadas: cada campo con la línea que lo justifica).
      Test del plugin que recorre los modelos registrados, recoge cada `voShared.name` y exige que
      exista en el registro. Todavía no se emite nada.
      · RED: el test cae si se borra una entrada del registro

## Lo derivado antes que lo copiado

- [ ] **TASK-02**: `constants.ts` derivado del registro (unión de `constraintKey` → MIN/MAX de los VOs
      realmente emitidos) + el ensamblador emite la carpeta `<contexto>/shared/domain/`. Fixture de app
      con el fichero del canon primero (RED).

## Un kind por tarea, del más simple al más caro

- [ ] **TASK-03**: `kind: 'date'` y `kind: 'timestamp'` → `contract-date.vo.ts` y `sync-timestamp.vo.ts` + sus tests emitidos (33 y 34 líneas en el canon). 13 de los 49 errores desaparecen.
- [ ] **TASK-04**: `kind: 'string'` con las variantes del canon (min/max por `constraintKey`,
      `noInnerWhitespace`, `charset`, `normalize: collapse-whitespace`) → `contract-number.vo.ts` y
      `phone.vo.ts` + sus tests (89 y 100 líneas). 15 errores más.
- [ ] **TASK-05**: `kind: 'period'` → `period.vo.ts` + `period-error.ts` + test (44 líneas). 6 errores.
- [ ] **TASK-06**: `spanish-legal-name.ts` en el **kernel** (el algoritmo de las 71 líneas, con las
      tablas del cliente como argumento) + `normalize: 'spanish-legal-name'` → `customer-name.vo.ts` + su test (216 líneas, el que de verdad demuestra la normalización). 12 errores, los últimos.
      · entrada en `golden-skip.txt` con el motivo: el algoritmo se mudó al kernel

## Cierre

- [ ] **TASK-07**: los tests emitidos **se ejecutan** en la app generada y pasan; el gate
      `typecheck-emitted.sh` pasa a medir la app de oro por defecto (`--models=customer,contract,
    license,project`) y sale **0 errores**. Re-baseline de las fixtures de app y app-mongo con las
      piezas nuevas. Anotar aquí la medición final.
