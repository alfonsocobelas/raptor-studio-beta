# 28 · DESIGN — Flujos de negocio

_Aprobado en brainstorming 2026-08-07. El editor reutiliza los gestos de la
fase 4 de la spec 15, ya cerrada (arrastre con `overlayLayout` + pointer
capture, flecha fantasma de `startLink`, selección/borrado con Supr, helpers
puros de `model-diagram.ts`): esta spec NO los reimplementa, los consume.
Piezas concretas a reutilizar: `autoLayout`/`overlayLayout`/`nodeBox`/
`nodeAt`/`edgeLine` de `@app/shared/domain` y el patrón de pointer events de
`model-view.component.ts` (`setPointerCapture` sobre el handle, coordenadas
vía `surface.getBoundingClientRect()`)._

## 1. Contrato (`@acc/schema`, app-types.ts)

```ts
export type FlowNodeKind = 'start' | 'step' | 'decision' | 'end'

export interface FlowNode {
  id: string          // único dentro del flujo; slug corto ('llega-pedido')
  kind: FlowNodeKind
  text: string        // lo que se lee dentro del nodo
  entity?: string     // nombre de recurso al que alude el paso (opcional)
}

export interface FlowEdge {
  from: string        // id de nodo existente
  to: string          // id de nodo existente
  label?: string      // obligatoria en salidas de decision ('sí', 'no', …)
}

export interface BusinessFlow {
  name: string        // 'Alta de pedido'
  description?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface AppDefinition { …; flows?: BusinessFlow[] }
```

**Gate estructural en `defineApp`** (todo con error accionable):

- ids de nodo únicos dentro del flujo; nombres de flujo únicos en la app.
- toda arista referencia nodos existentes; sin aristas duplicadas (from+to+label).
- exactamente UN `start` por flujo; al menos un `end`.
- `decision` → ≥2 salidas, todas con `label`; `step`/`start` → exactamente 1
  salida; `end` → 0 salidas.
- todos los nodos alcanzables desde el `start` (BFS); lo inalcanzable es un
  error, no un aviso.
- auto-bucle (`from === to`) rechazado. Los ciclos entre nodos distintos son
  legales (reintentos existen en los procesos reales).
- **Topes** (mismo motivo que el brief: el diseño se reenvía en cada turno):
  `flows` ≤ 10 · `nodes` ≤ 30 por flujo · `edges` ≤ 60 · `text` ≤ 120 ·
  `name` ≤ 60 · `label` ≤ 20 · `description` ≤ 300.

`entity` NO se valida en `defineApp` (no conoce los recursos, igual que
`widget.resource`): se valida en la frontera (`validateDesign` del studio-api
y `buildAppFile`), contra los nombres de recurso del diseño.

## 2. Estudio

### DesignStore

**Decisión de implementación (2026-08-07, TASK-03).** El gate completo de
`defineApp` (aridad por kind, alcanzabilidad) haría imposible la edición
incremental: un nodo recién soltado de la paleta aún no tiene salidas y
`mutate()` lo revertiría. Se sigue el precedente `DraftResource`: el store
aplica un **gate ligero** en cada mutación (nombres/ids únicos, aristas a
nodos existentes, sin auto-bucle, topes) y el **gate completo** se aplica en
la frontera (chat `validateDesign`, wizard/generación), donde los flujos ya
deben estar terminados. Consecuencia asumida: un export a mitad de dibujo
puede llevar un flujo incompleto — el generador lo rechaza con el error
accionable del gate.

Signal `flows` con mutaciones que pasan por `mutate()`:

- `addFlow(name)` / `removeFlow(name)` / `renameFlow(name, next)`
- `addFlowNode(flow, kind, text)` — id derivado del texto (slug + sufijo si colisiona)
- `updateFlowNode(flow, id, patch)` / `removeFlowNode(flow, id)` — quitar un
  nodo quita sus aristas (como `removeField` con las columnas)
- `addFlowEdge(flow, from, to, label?)` / `removeFlowEdge(flow, from, to, label?)`
- `exportJson`/`importJson`/`applyExternal` incluyen `flows` → spec 21 gratis.

### Vista Flujos

- El conmutador del lienzo pasa a tres posiciones: **Vistas / Modelo / Flujos**
  (mismo signal local de `studio-canvas.component`, un valor más).
- Cabecera de la vista: selector del flujo activo + «nuevo flujo» + paleta de
  nodos (paso, decisión, inicio, fin). La paleta añade el nodo al flujo; el
  usuario lo coloca arrastrando.
- Cajas por `kind`: `start`/`end` píldora, `step` rectángulo, `decision` rombo
  (CSS transform del contenedor, texto sin rotar). Doble clic edita el texto
  in situ; `entity` se asigna desde un pequeño desplegable en la caja.
- Flechas: mismo `<svg>` superpuesto y misma geometría de anclajes que la
  vista de modelo; la `label` de la arista se pinta a mitad de camino.
  Conectar = arrastre con flecha fantasma (gesto de TASK-08.5); si el origen
  es `decision`, al soltar se pide la etiqueta. Seleccionar + borrar arista o
  nodo = gesto de TASK-08.6 (botón + Supr).

### Layout

`flowLayout(flow)` — helper puro nuevo: niveles por BFS desde el `start`
(capas verticales, orden estable por id dentro de la capa). Determinista:
mismo flujo, mismas posiciones. El arrastre corrige encima, solo en memoria.

### Chat

- `DesignPayload.flows` viaja en cada turno; `RESPONSE_SCHEMA` admite `flows`
  en la respuesta estructurada; el prompt instruye «cuando el usuario describa
  un proceso con ramas, propón o corrige un flujo; conserva los existentes».
- Fake adapter: un caso de demo que devuelve un flujo válido.
- `validateDesign` aplica el gate completo + existencia de `entity`.

## 3. La frontera y el aterrizaje

- `buildAppFile` copia `design.flows` al `.app.json` (con la validación de
  `entity` contra los recursos del diseño).
- **Render en `CLAUDE.md`** (depende de spec 22 TASK-05, que crea el fichero):
  `renderFlows(flows)` — función pura en el generador, testeada sola. Forma
  elegida: **esquema numerado con ramas**, no ASCII-art de cajas (dibujar
  grafos arbitrarios en ASCII es un proyecto en sí mismo y la IA lee mejor la
  forma estructurada — YAGNI):

```markdown
## Procesos de negocio

### Alta de pedido
1. [inicio] llega un pedido            (entidad: pedido)
2. ¿hay stock?                         (entidad: producto)
   - sí → 3
   - no → 4
3. reservar stock → FIN
4. pedir al proveedor; pedido en espera → FIN
```

  Numeración por orden BFS (el mismo del layout: una sola fuente de orden).
  Sin flujos → `renderFlows` devuelve `''` y la sección no se emite.

## 4. Qué NO hace esta spec

- No genera código desde el flujo (regla 7). Ni casos de uso, ni guards, ni
  validaciones: contexto puro.
- No persiste posiciones ni estilo del diagrama.
- No introduce dependencias nuevas (ni de layout ni de diagramas).

## 5. Gate de la spec

- Tests vitest de contrato (`defineApp`), store, `flowLayout` y `renderFlows`
  (TDD, rojo primero).
- `/golden-diff` vacío: los modelos de oro no declaran flujos, así que ninguna
  fixture cambia. La emisión del `CLAUDE.md` con flujos se cubre con test
  unitario del generador + e2e.
- e2e con captura: dibujar un flujo en el estudio → generar → el `CLAUDE.md`
  de la app contiene el proceso.

## Anotado para el futuro (no ahora)

- **Máquina de estados por entidad**: `kind: 'state-machine'` con estados,
  transiciones y guardas, ligada al campo `status` del recurso. Vive mejor
  como vocabulario segundo sobre esta misma infraestructura de vista.
