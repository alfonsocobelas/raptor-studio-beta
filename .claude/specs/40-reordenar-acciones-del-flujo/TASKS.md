# Tareas atómicas: Reordenar las acciones de un flujo

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: dominio → estado → vista → generador → golden.
> Toda tarea que toque plantillas o `generator.ts` pasa por `/golden-diff` antes del commit.

## Bloque A — el gesto

- [x] **TASK-01**: Tests + `flow-reorder.ts`: `reorderFlowStep(flow, stepId, toIndex)` recablea
      la cadena de la tarjeta. Casos: mover al medio, a la cabeza (la rama viaja con su
      etiqueta), a la cola (la salida se traslada), no-op (misma identidad), `toIndex` fuera
      de rango, y una acción que es tarjeta de una sola fila.
- [x] **TASK-02**: Test + `DesignStore.reorderFlowStep`: delega en el dominio, sustituye el
      flujo solo si cambió y el nuevo orden sobrevive al guardado.
- [x] **TASK-03**: Tests + asa de arrastre y guía en `flow-view.component.ts`: arrastrar la
      fila reordena y renumera; soltar en el sitio no cambia nada; el gesto no selecciona ni
      abre la edición ni mueve la tarjeta.

## Bloque B — la garantía

- [x] **TASK-04**: Test rojo del caso de ramas desiguales (el fin numerado antes de las
      acciones) + `bfsOrder` pasa a orden topológico. Suite del generador en verde sin tocar sus
      expectativas salvo las que documentaban el orden viejo.
      > Resuelto como **`flowOrder`: Kahn con pila, ignorando las aristas que cierran bucle**, no
      > como nivel por camino más largo: el camino más largo diverge en cuanto el flujo tiene una
      > vuelta atrás («subsanar → revisar»), que es una forma legítima y ya presente en la fixture
      > de oro. La pila, además, es lo que mantiene las acciones de una tarjeta seguidas.
      > Renombrada de `bfsOrder` porque el nombre habría quedado mintiendo.
- [x] **TASK-05**: Test en `flow-process.spec.ts`: las acciones de una tarjeta emiten métodos
      seguidos y en el orden de la cadena; reordenar la cadena cambia el orden emitido.
- [x] **TASK-06**: `/golden-diff`: re-baseline de las fixtures cuyo orden emitido cambie
      (commit propio), y comprobación de que las demás siguen dando diff vacío.

## Validación

- [x] **TASK-07**: Suite completa del workspace + del estudio en verde, y comprobación a mano
      en el estudio (arrastrar una fila, guardar, recargar, regenerar la demo).

> **TASK-06 (2026-08-13)**: `/golden-diff` en verde **sin re-baseline** — las 6 fixtures dan diff
> vacío. La fixture `app` incluye un flujo con vuelta atrás (`7 → 5`) y su clase de proceso sale
> byte a byte igual, así que el cambio de orden no altera el canon emitido de hoy: solo arregla
> los flujos con ramas de distinta longitud, que ninguna fixture tenía.

> **TASK-07 (2026-08-13)**: verde la suite del estudio (491) y la del workspace (14 proyectos,
> 692 del generador), `/golden-diff` vacío, y el gesto comprobado en el navegador con
> `tools/smoke-flows.ts` (capturas del arrastre y del orden nuevo). Y app generada de verdad
> (`nx g @acc/generators:app --appFile`) con un flujo de ramas desiguales: el fin sale numerado
> **5** —detrás de las dos acciones— y los métodos salen en el orden de la cadena; al invertirla
> se invierten (`cerrar, avisar`). Con el orden viejo el fin era el 3 y los pasos, 4 y 5.
