# Diseño técnico: Reordenar las acciones de un flujo

## Capa de dominio compartido (estudio)

### `flow-reorder.ts` (nuevo, en `apps/studio/libs/shared/domain/src/studio/`)

Una sola función pura, sin Angular y sin geometría:

```ts
reorderFlowStep(flow: BusinessFlow, stepId: string, toIndex: number): BusinessFlow
```

Recompone la tarjeta a la que pertenece `stepId` (la que devuelve `flowGroups`) como lista de
ids en el nuevo orden y reescribe **solo tres cosas**:

```
antes:  X ─(rama sí)→ [A → B → C] ─→ Y        mover C a la cabeza
después:X ─(rama sí)→ [C → A → B] ─→ Y

aristas que se tocan:  X→A  ⇒ X→C  (conserva label «sí»)
                       A→B, B→C   ⇒ C→A, A→B
                       C→Y        ⇒ B→Y
```

Invariantes: no se crea ni se borra ningún nodo; el número de aristas no cambia; las aristas
ajenas a la tarjeta se copian tal cual; `toIndex` fuera de rango se recorta al rango válido;
si el orden resultante es igual al de partida se devuelve **el mismo objeto** (identidad), que
es lo que permite al store no marcar el diseño como sucio.

Va en su propio fichero, no dentro de `flow-groups.ts`: ese fichero deduce y mide, este
muta. Reutiliza `flowGroups()` para no duplicar la definición de «qué es una tarjeta».

## Capa de estado

### `DesignStore.reorderFlowStep(flowName, stepId, toIndex)`

Delega en la función de dominio y sustituye el flujo en la señal solo si el objeto cambió.
Misma forma que las demás mutaciones de flujo (`updateFlowNode`, `removeFlowEdge`), así que
hereda el autosave sin tocarlo.

## Capa de vista

### `flow-view.component.ts`

- **Asa**: un `⣿` (mismo lenguaje que el asa de conexión) a la izquierda del número, oculto
  y visible con `group-hover/row`. `data-testid="flow-step-grip-<id>"`.
- **Arrastre**: `pointerdown` en el asa guarda `{ stepId, groupId, fromIndex, startY }` y
  captura el puntero. `pointermove` calcula
  `toIndex = clamp(round((clientY - startY) / FLOW_GROUP.rowHeight) + fromIndex, 0, n-1)`
  —dividido por el zoom del viewport, como el resto de los gestos del lienzo—.
- **Guía**: una línea de 2px entre filas en la posición `toIndex`
  (`data-testid="flow-step-drop-guide"`), pintada solo mientras hay arrastre.
- **Soltar**: `pointerup` llama al store y limpia el estado. `pointercancel` limpia sin
  llamar (mismo patrón que el arrastre de flechas, que ya cubre este caso).
- El asa lleva `(click)="$event.stopPropagation()"` para no seleccionar la fila al soltar.

## Capa del generador — la garantía

### `bfsOrder` → orden topológico por camino más largo (`brief-doc.ts`)

El nombre se mantiene (lo consumen `flow-process.ts` y `renderFlows`), pero el nivel deja de
ser «profundidad del primer descubrimiento» y pasa a ser «camino más largo desde el inicio»:

```
nivel(inicio) = 0
nivel(n)      = 1 + max(nivel(p) para toda arista p→n alcanzable)
```

Se calcula relajando niveles hasta punto fijo (`|nodos|` pasadas como tope, que también corta
los ciclos: un flujo con ciclo no es un DAG y basta con que el resultado sea determinista y
no cuelgue). Desempate alfabético por id, igual que hoy. Los nodos inalcanzables siguen al
final. Con eso, un nodo nunca precede a un predecesor y las acciones de una tarjeta salen
seguidas, porque cada eslabón de la cadena sube exactamente un nivel.

Cambia la salida del generador para diseños con ramas de distinta longitud ⇒ `/golden-diff`
y re-baseline en **commit propio**.

## Testing

| Qué                                              | Dónde                             |
| ------------------------------------------------ | --------------------------------- |
| Recableado (medio, cabeza, cola, no-op, rangos)  | `flow-reorder.spec.ts` (dominio)  |
| Renumeración y guía al arrastrar                 | `flow-view.component.spec.ts`     |
| Persistencia del nuevo orden                     | `design-store.spec.ts`            |
| Orden topológico y ramas desiguales              | `brief-doc.spec.ts`               |
| Métodos emitidos en el orden de la cadena        | `flow-process.spec.ts`            |
| Diff de oro                                      | `/golden-diff`                    |

## Riesgos

- **El gesto compite con los que ya hay** en la fila (clic, doble clic, arrastre de tarjeta).
  Mitigado limitando el arrastre al asa, que es zona muerta para los demás.
- **jsdom no trae PointerEvent**: los tests usan `MouseEvent` con nombre de pointer, como ya
  hace `flow-view.component.spec.ts`.
- **El cambio de `bfsOrder` toca la spec 39 ya cerrada**: sus tests son la red: si alguno se
  pone rojo, el orden nuevo rompe algo que se decidió allí y hay que decidir cuál manda.
