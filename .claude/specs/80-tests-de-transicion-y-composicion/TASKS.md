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

- [ ] **TASK-04** — `files-tests/__fileName__.aggregate.test.ts.template`.
      Redondeo `create() → toPrimitives()`, y con máquina: cada transición mueve al destino y
      rechaza desde el estado ilegal. Podado cuando no hay nada que afirmar.

- [ ] **TASK-05** — Cierre: `typecheck:emitted --suite` (la suite emitida en VERDE, no solo
      compilando), re-baseline definitivo de las seis fixtures, ROADMAP (fila 14 a ✅) y memoria.

---

## Regla del juego

Implementar UNA tarea, commit, seguir. El gate de oro se corre en cada tarea que toque
plantillas; el `typecheck:emitted --suite` se corre en la TASK-05 (es lento, ~2 min por app) y
también en la TASK-02 la primera vez que un test emitido nuevo se ejecuta de verdad — un test
que no compila no puede esperar al final.
