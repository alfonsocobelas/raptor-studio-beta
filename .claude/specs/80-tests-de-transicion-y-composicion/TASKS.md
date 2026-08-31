# Tareas atómicas: el emitido testea también lo que tiene guardas

> Cada tarea = un commit en develop. TDD: test rojo primero (en el generador), y para lo que
> toca plantillas el gate es el **diff de oro**.
> Orden: primero los datos que necesitan las plantillas, luego una familia por tarea.

- [x] **TASK-01+02** — `TransitionBinding` gana `from`, `to`, `illegalFrom` y `stateField`, y
      nace `files-tests-transition/` cableada en el bucle que ya emitía las transiciones.
      **Las dos tareas se fusionaron**: los campos derivados no son observables sin la plantilla,
      y el idioma de los tests del repo es generar y afirmar sobre lo emitido (no hay
      `build-entrypoints.spec.ts`; el vecino es `state-machine-endpoint.spec.ts`).
      · `illegalFrom` sale de la máquina del modelo: `terminate` (from active|expiring) debe
        rechazar `expired`; `expire` (from expiring) debe rechazar `active`. Si la transición
        admite todos los valores es `null` y el caso no se emite.
      · Gates: generador 134 suites / 1154 ✅ · **suite del emitido 443 backend + 124 front
        ejecutándose fuera del acelerador** ✅ · oro vacío tras re-baseline (contract 79→81
        ficheros, app 810→812, app-mongo 631→633), **solo adiciones**.

- [x] **TASK-03** — `files-tests-composition/` con los tres tests de la hija, emitidos solo si el
      recurso declara composición. `customers` los emite; `contracts` no emite ninguno.
      · **Defecto latente destapado**: los campos de la hija no declaran columna, así que caían al
        literal genérico de `builderDefault` (`'<Campo> 1'`) — y eso REVIENTA en cuanto el VO tiene
        formato: `ContactEmail` valida email y el `Phone` compartido solo admite dígitos y
        símbolos (`^[0-9+()\-/.\s]+$`), así que `'Email 1'` y `'Phone 1'` no pasaban. No se veía
        antes porque ningún campo del PADRE en los 4 modelos de oro es un formato sin
        `column.default`. Arreglado con `childSample()`: el opcional de tipo texto va a `''`, que
        es el valor que el propio caso de uso emitido ya usa (`input.contact.email ?? ''`).
      · El doble de `TransactionManager` EJECUTA el trabajo (`work()`): uno que no lo hiciera
        dejaría pasar los tests sin correr una línea del cuerpo. Hay un test del generador que lo
        fija, para que nadie lo simplifique a `jest.fn()`.
      · Gates: generador 135 suites / 1161 ✅ · suite del emitido **449** backend (+6) y 124 front,
        ejecutándose fuera del acelerador ✅ · oro vacío tras re-baseline (customer 82→85,
        app 812→815, app-mongo 633→636), solo adiciones.

- [x] **TASK-04** — el test del agregado, en **carpeta propia** `files-tests-domain/`.
      · No pudo ir en `files-tests/`: la recolocación del generador de app manda TODO lo de
        `backend-tests/` a `domain/mothers/` salvo el mock, y el agregado pertenece a `domain/`
        (además la profundidad de import cambia: 4 niveles y no 5).
      · Afirma el **redondeo de primitivos** (`fromPrimitives(p).toPrimitives()` === p), que es lo
        que se rompe al añadir un campo y olvidarlo en el mapeo, y —si hay máquina— que cada verbo
        mueve al destino y es rechazado desde `illegalFrom`. Un recurso sin máquina emite solo el
        redondeo, sin sección de transiciones.
      · Gates: generador 136 suites / 1167 ✅ · suite del emitido **457** backend (+8) ✅ ·
        oro vacío (contract 81→82, customer 85→86, license 48→49, project 77→78, app 815→818,
        app-mongo 636→639).

- [x] **TASK-05** — Cierre: el gate del emitido se corrió en CADA tarea (no solo al final), las
      seis fixtures quedan vacías y el ROADMAP recoge la fila 14 como cerrada.

---

## Resultado

El emitido pasa de **37 a 54 tests de backend** por app de oro (443 → 457 ejecutándose de verdad
fuera del acelerador). Las tres familias que iban sin red —transición, composición y agregado— ya
la tienen, y el CRUD sigue como estaba.

Un defecto latente cazado de paso: `builderDefault` producía literales inválidos para VOs con
formato (email, charset de Phone). No se veía porque ningún campo del padre en los cuatro modelos
de oro es un formato sin `column.default`.

---

## Regla del juego

Implementar UNA tarea, commit, seguir. El gate de oro se corre en cada tarea que toque
plantillas; el `typecheck:emitted --suite` se corre en la TASK-05 (es lento, ~2 min por app) y
también en la TASK-02 la primera vez que un test emitido nuevo se ejecuta de verdad — un test
que no compila no puede esperar al final.
