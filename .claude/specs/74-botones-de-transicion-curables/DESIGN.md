# DESIGN — Spec 74: Botones de transición curables en la ficha

> Diseño aprobado en brainstorming (2026-08-29). Enfoque A: la curación vive en la
> transición de la máquina de estados. Contrato mínimo: un solo campo nuevo.

## Contrato

`StateTransition` (`libs/schema/src/lib/resource-types.ts:363`) gana:

```ts
interface StateTransition {
  name: string
  label: string
  from: string[]
  to: string
  hidden?: boolean   // ← NUEVO: sin botón en la ficha; endpoint/use case/kanban intactos
}
```

- Renombrar = editar `label` (ya existe).
- Reordenar = orden del array `transitions` (ya es el orden emitido; pasa a ser contrato, R2).
- Ocultar = `hidden: true`.
- El draft del estudio (`DraftResource`) transporta el mismo campo; `draftToResource` lo copia.

## Flujo del dato

```
inspector (estudio)          DesignStore           draftToResource        build-entrypoints
ocultar/renombrar/reordenar ──> resource.state ──> state.transitions ──> entry.transitions
                                (autosave)          (con hidden)          (filtra hidden
                                                                           SOLO en la ficha)
        │                                                                        │
        └──> canvas-detail deriva los botones del draft ────────────────────────┘
             (misma regla: visibles, en orden, con label)      plantilla files-detail: sin cambios
```

Punto clave: la lista de botones de la ficha se construye en `build-entrypoints.ts:204`
(`entry.transitions`); ahí se filtra `hidden`. El cableado de endpoints
(`transitionWires`, `build-entrypoints.ts:171`), `files-transition`, el kanban
(`build-substitutions.ts:1184`) y `flow-process.ts` leen `state.transitions` SIN filtrar.

## Estudio

- **canvas-detail**: nueva sección de acciones bajo la cabecera, derivada de
  `resource.state?.transitions` filtrando `hidden`, botones con el cromo del emitido
  (mismos hooks de piel de la spec 67/68). Sin lógica de habilitación por estado en la
  preview (el registro de muestra no tiene estado real; los botones se pintan todos los
  visibles). Guard de deriva: spec tipo `design-hooks-canvas.spec.ts` que compara la regla
  de derivación del canvas con la de `build-entrypoints` (misma entrada → misma lista).
- **inspector**: con el bloque ficha seleccionado, sección «Acciones» que lista los botones
  derivados; ojo para `hidden`, edición inline del `label`, reordenar con ↑/↓ (drag no:
  el precedente de reordenación del inspector usa flechas). Escribe en el draft vía
  DesignStore; el diagrama de ciclo de vida no cambia (R5) — como mucho, la transición
  oculta se pinta atenuada (decisión estética, no funcional).
- Componentes nuevos del estudio con test: `@Input()`/`@Output()` clásicos (limitación JIT
  del runner, idea 5 del backlog); gate real = `npm run web:build`.

## Generador

- `build-entrypoints.ts:204`: el mapeo de `entry.transitions` parte de
  `state.transitions.filter(t => !t.hidden)`. Nada más: la plantilla de la ficha ya itera
  `entry.transitions` y no se toca (plantillas tontas, regla 8).
- Métodos del componente de ficha: hoy se emite un método por transición; los de las ocultas
  pueden seguir emitiéndose (muertos) o filtrarse con la misma lista — se filtran con la
  misma lista para no dejar código muerto. El use case y el handler NO se filtran.
- Fixture de oro: una transición `hidden: true` en uno de los 4 modelos congelados
  (candidato: el que ya tenga máquina) y re-baseline consciente vía `/golden-diff`.

## Errores y bordes

- Máquina sin transiciones visibles (todas `hidden`): la ficha emite el bloque de acciones
  vacío exactamente igual que hoy un recurso sin máquina (el `@if` existente ya lo cubre).
- Transición referenciada por un paso de flujo convergido y además `hidden`: legal — el
  endpoint existe; solo desaparece el botón. La frontera no avisa (decisión de UI).
- Diseños guardados sin `hidden`: campo opcional, `undefined` = visible. Sin migración.

## Testing

1. Unit (TDD): `state-machine-detail.spec.ts` — `hidden` fuera de `entry.transitions`;
   orden y label respetados; endpoint/use case presentes con `hidden`.
2. Guard de deriva canvas↔build-entrypoints (estudio).
3. Golden: fixture con transición oculta, diff vacío tras re-baseline.
4. E2E manual (TASK-04): regenerar inmobiliaria con `retirar` oculto y comprobar por
   navegador ficha (sin botón), kanban (drag sigue) y endpoint (POST responde).
