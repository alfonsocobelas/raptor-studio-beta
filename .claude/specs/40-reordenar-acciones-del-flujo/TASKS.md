# Tareas atómicas: Reordenar las acciones de un flujo

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: dominio → estado → vista → generador → golden.
> Toda tarea que toque plantillas o `generator.ts` pasa por `/golden-diff` antes del commit.

## Bloque A — el gesto

- [ ] **TASK-01**: Tests + `flow-reorder.ts`: `reorderFlowStep(flow, stepId, toIndex)` recablea
      la cadena de la tarjeta. Casos: mover al medio, a la cabeza (la rama viaja con su
      etiqueta), a la cola (la salida se traslada), no-op (misma identidad), `toIndex` fuera
      de rango, y una acción que es tarjeta de una sola fila.
- [ ] **TASK-02**: Test + `DesignStore.reorderFlowStep`: delega en el dominio, sustituye el
      flujo solo si cambió y el nuevo orden sobrevive al guardado.
- [ ] **TASK-03**: Tests + asa de arrastre y guía en `flow-view.component.ts`: arrastrar la
      fila reordena y renumera; soltar en el sitio no cambia nada; el gesto no selecciona ni
      abre la edición ni mueve la tarjeta.

## Bloque B — la garantía

- [ ] **TASK-04**: Test rojo del caso de ramas desiguales (el fin numerado antes de las
      acciones) + `bfsOrder` pasa a nivel topológico por camino más largo. Suite del generador
      en verde sin tocar sus expectativas salvo las que documentaban el orden viejo.
- [ ] **TASK-05**: Test en `flow-process.spec.ts`: las acciones de una tarjeta emiten métodos
      seguidos y en el orden de la cadena; reordenar la cadena cambia el orden emitido.
- [ ] **TASK-06**: `/golden-diff`: re-baseline de las fixtures cuyo orden emitido cambie
      (commit propio), y comprobación de que las demás siguen dando diff vacío.

## Validación

- [ ] **TASK-07**: Suite completa del workspace + del estudio en verde, y comprobación a mano
      en el estudio (arrastrar una fila, guardar, recargar, regenerar la demo).
