# 19 — Código de negocio · TASKS

> Cada tarea = un commit atómico en develop. TDD: test rojo primero.
> Toca plantillas → gate de oro antes de cada commit (los modelos de oro NO declaran
> `code`, así que el diff debe quedar vacío hasta el modelo que lo estrene).

- [x] TASK-01 — `code` en el resource-schema + validación (`CodeDefinition` en
      `resource-types.ts` + guard en `define-resource.ts`; ya estaba hecho, solo
      no marcado)
- [x] TASK-02 — puerto `CodeSequencePort` + adapter TypeORM (`nextval`) + módulo Nest.
      Los nombres de secuencia se derivan del registro al generar, así que ni el dominio
      ni el adapter conocen la convención. Solo se emite si algún modelo declara `code`;
      `client` (demo del concesionario) lo estrena. Commit `0261c9e`.
      · **falta el formateo** `<PREFIJO>-<relleno>`: va con TASK-04, donde se usa
- [x] TASK-03 — migración: `CREATE SEQUENCE` por entidad + columna `code VARCHAR(50)` con
      `UNIQUE`; `DROP SEQUENCE` en el down. Ancho holgado a propósito: un código importado
      no sigue nuestro formato. Guard `code` + mongo (no hay secuencias) antes de emitir.
      Commit `c1c03a4`.
- [ ] TASK-04 — el alta pide el código **solo si el input no lo trae** (§2.bis:
      `code` opcional en `RegisterInput`); el update nunca lo toca
- [ ] TASK-05 — import (spec 33): la plantilla CSV incluye `code` como columna
      opcional y el importador respeta el que venga; colisión → 409 por fila
- [ ] TASK-06 — frontend: columna en listado y fila en ficha, nunca en el formulario
- [ ] TASK-07 — estudio: declarar código y que el chat lo proponga
- [ ] TASK-08 — e2e: alta desde el navegador con código correlativo + import de un
      CSV con códigos externos que se respetan
