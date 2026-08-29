# Spec 74 — Botones de transición curables en la ficha

> Origen: idea 36 del ROADMAP (2026-08-29). Brainstorming cerrado en sesión con Alfonso:
> alcance «solo transiciones», gesto «derivados + curación», ubicación «solo ficha».

## Problema

Los botones de acción de la app emitida (Publicar, Retirar… en inmobiliaria) nacen de la
máquina de estados y se pintan SIEMPRE todos en la ficha. Dos carencias:

1. **El lienzo miente por omisión**: `canvas-detail` no pinta ningún botón de transición.
   El diseñador nunca ve las acciones hasta generar (misma familia de defecto que
   `presetChrome()` y el espejo manual del shell).
2. **No hay gesto de curación**: no se puede ocultar un botón, renombrarlo ni reordenarlos
   desde el estudio.

## Decisiones de alcance (cerradas en brainstorming)

- **Solo transiciones**: el botón siempre referencia una transición de la máquina de estados
  (doctrina idea 9: el botón referencia una operación emitida entera). Los pasos de flujo sin
  `transition` NO dan botón — sigue vigente «nada de fachadas sobre huecos» (spec 44).
- **Derivados + curación**: el canvas pinta por defecto lo que la app emite; el gesto manual
  es curar (ocultar / renombrar / reordenar), nunca colocar desde cero.
- **Solo ficha**: el listado (acciones por fila) queda fuera; entrará por regla de los dos.
- **Ocultar es decisión de UI, no de API**: una transición `hidden` no pinta botón en la
  ficha, pero su endpoint, use case y el arrastre del kanban (spec 61) siguen emitidos.
- **La curación vive en la transición** (`StateTransition`), no en la página: la ficha
  emitida es por-recurso y la máquina ya tiene `label` y el orden del array como orden de
  botones. Único campo nuevo del contrato: `hidden?: boolean`.

## User stories (EARS)

- **R1** — WHEN el generador emite la ficha de un recurso con máquina de estados, THE SYSTEM
  SHALL omitir el botón de toda transición con `hidden: true`, manteniendo intactos su
  endpoint, su use case y su participación en kanban y pasos convergidos.
- **R2** — WHEN el generador emite la ficha, THE SYSTEM SHALL pintar los botones en el orden
  del array `state.transitions` y con el `label` de cada transición (comportamiento actual,
  ahora contado como contrato).
- **R3** — WHEN el lienzo del estudio muestra un bloque de ficha de un recurso con máquina,
  THE SYSTEM SHALL derivar y pintar los botones de transición visibles (orden y label de la
  máquina del draft), con el mismo cromo que la app emitida.
- **R4** — WHEN el diseñador selecciona la ficha en el lienzo, THE SYSTEM SHALL ofrecer en el
  inspector la lista de botones derivados con gestos de ocultar/mostrar, renombrar el label y
  reordenar, escribiendo sobre `resource.state.transitions` (autosave existente).
- **R5** — WHEN una transición está oculta, THE SYSTEM SHALL seguir mostrándola en el
  diagrama de ciclo de vida del estudio (la máquina no cambia; solo la ficha).
- **R6** — WHEN se regenera una app existente con curación, THE SYSTEM SHALL producir el
  mismo resultado en cada pasada (idempotencia, mismas substitutions).

## Fuera de alcance

- Acciones por fila en el listado emitido.
- Botones para pasos de flujo sin transición (huecos IA).
- Curación por-vista (dos fichas del mismo recurso con curaciones distintas).
- Habilitación del botón por precondiciones de datos (idea 24/14 del backlog).

## Referencia de oro

- Emisión actual: `libs/generators/src/generators/resource/files-detail/frontend/__fileName__-detail.component.ts.template` (líneas de `entry.transitions`).
- Máquina: `libs/schema/src/lib/state-machine.ts` + specs 43/44/46.
- Precedente de guard de deriva canvas↔plantilla: `design-hooks-canvas.spec.ts` (spec 68).

## Prioridad y dependencias

- Prioridad: siguiente spec activa tras el cierre de la 73.
- Depende de: nada abierto. Se apoya en specs 43 (máquina), 44 (convergencia), 61 (kanban), 68 (piel en canvas).
