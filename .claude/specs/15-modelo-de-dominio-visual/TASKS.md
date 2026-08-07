# 15 — Relaciones · TASKS

## Fase 1 — el contrato admite relaciones
- [x] TASK-01 — `DraftField` tipo `ref` + expansión al par canónico en draftToResource
- [x] TASK-02 — gate del diseño: rechaza referencias a entidades inexistentes
- [x] TASK-03 — el chat (prompt + fake adapter) declara relaciones
- [x] TASK-04 — editor de columna del lienzo: tipo «referencia a → entidad»

## Fase 2 — se nota en la app
- [x] TASK-05 — la tabla del lienzo muestra la columna del padre (mockup fiel)
- [x] TASK-06 — e2e: selector en el formulario, columna en el listado, FK en la migración

## Fase 3 — la ficha se llena
- [x] TASK-07 — bloque «registros relacionados» en la ficha (drill-down derivado)

## Fase 4 — el diagrama (diseño aprobado 2026-08-07, ver DESIGN.md)
- [ ] TASK-08.1 — helpers puros: `modelEdges` + `autoLayout` + geometría de anclajes (TDD)
- [ ] TASK-08.2 — `DesignStore.addRelation`: colisión de nombres con sufijo, auto-ref rechazada (TDD)
- [ ] TASK-08.3 — conmutador Vistas/Modelo + diagrama solo lectura (cajas y flechas derivadas)
- [ ] TASK-08.4 — arrastre de cajas (posiciones solo en memoria)
- [ ] TASK-08.5 — crear relación arrastrando de caja a caja (flecha fantasma)
- [ ] TASK-08.6 — seleccionar y borrar flecha (botón + tecla Supr)
- [ ] TASK-08.7 — e2e con captura: la relación dibujada aparece en la app generada
