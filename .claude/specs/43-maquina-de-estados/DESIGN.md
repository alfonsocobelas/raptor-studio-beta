# Diseño técnico: Máquina de estados de la entidad

_Aprobado en brainstorming 2026-08-14/15. Enfoque elegido: **enum promovido** — la máquina
se ancla en un campo enum existente del recurso (una sola fuente de verdad para los valores);
se descartó el artefacto aparte (dos fuentes que sincronizar) y la inferencia desde los
flujos (interpretar, no generar)._

## 0. El mapa del que sale esta spec

Las reglas de negocio que el emitido pierde frente a la referencia caen en cinco categorías:

```
1 invariantes cruzadas entre campos   (ensureContractNumberConsistency)   → futura
2 transiciones de estado con guardas  (archive, markSeenInSync)           → ESTA SPEC
3 campos gobernados por actor         (updateMaintenanceFields solo sync) → futura/@ai
4 invariantes de colección hija       (un solo contacto primario)         → futura
5 lógica arbitraria                   (claimBySync)                       → hueco @ai
+ VOs semánticos (factorías/predicados) → caen gratis con la 2
```

La 2 es la única con: mucho valor (la mitad de los métodos de negocio de la referencia son
transiciones), derivación 100% determinista desde un dibujo, y editor visual ya construido.

## 1. Contrato (`@raptor/schema`) y gate

```ts
export interface StateTransition {
  name: string        // slug del verbo: 'aprobar' → método, endpoint y ruta
  label: string       // 'Aprobar' → botón en la ficha y mensajes de error
  from: string[]      // valores del enum desde los que es legal
  to: string          // valor del enum destino
}

export interface StateMachine {
  field: string       // nombre de un campo enum del propio recurso
  initial: string     // valor con el que nace la entidad
  transitions: StateTransition[]
}

export interface ResourceDefinition { …; state?: StateMachine }   // una por recurso máx.
```

Gate en `defineApp` (todo con error accionable):

- `field` existe y es `enum`; `initial`, cada `from[]` y `to` son valores de ese enum.
- `name` únicos en la máquina y sin colisión con rutas reservadas del CRUD.
- `from` no vacío; `to ∈ from` rechazado (el no-op ya lo da la guarda; declararlo es ruido).
- Sin duplicados de `name`. Dos nombres distintos hacia el mismo destino son legales
  («rechazar» y «descartar» pueden acabar ambas en `descartada`).
- Alcanzabilidad NO se exige (a diferencia de los flujos): estado inalcanzable = **warning**
  en `validateDesign`, nunca error — el diseño a medias no rompe el código emitido.
- Topes: `transitions` ≤ 20 · `name` ≤ 30 · `label` ≤ 40.

Consecuencias derivadas (sin declarar nada más): el campo no se pide en el alta (nace
`initial`), sale del formulario de edición, sigue en listado/ficha/filtros como enum normal.

**Costura con flujos (solo contrato en esta spec)**: `FlowNode.transition?: string`,
validado en la frontera (`validateDesign`, `buildAppFile`) contra la máquina del recurso del
paso — mismo tratamiento que `entity`. La emisión que lo consume es la spec de convergencia.

## 2. Estudio: canvas, gestos y chat

**Dónde**: en la vista de la entidad (donde vive el modelo de dominio), no pestaña nueva.
Si el recurso tiene `state`, se pinta el diagrama: valores del enum como nodos, transiciones
como flechas etiquetadas con `label`, `initial` distinguido (anillo/punto de entrada, como
el `start` de los flujos). Pintado con las piezas de la spec 15 (`autoLayout`, `nodeBox`,
`edgeLine`).

**Gestos** (se consumen los del editor de flujos — spec 15/28 —, no se reimplementan):

- Crear transición: arrastre desde el borde de un estado a otro (flecha fantasma de
  `startLink`); al soltar, nombre propuesto (`a-{destino}`) y label editable inline.
- Editar: clic en flecha → seleccionar → editar label/nombre; Supr borra.
- `from` múltiple = varias flechas con el mismo `name`; el estudio agrupa al guardar
  (mismo `name` → merge de orígenes). Sin UI especial.
- Los estados NO se crean en el diagrama: son los valores del enum y se editan en el campo.
  Un valor nuevo aparece como nodo suelto; el warning de alcanzabilidad lo señala sin bloquear.
- Marcar inicial: acción contextual en el nodo → «Estado inicial».
- Promover/despromover: conmutador «Es el estado de la entidad» en el campo enum. Crear →
  `state` con `initial` = primer valor y sin transiciones. Quitar → confirmación (tira las
  transiciones).

**Chat**: el prompt aprende a proponer `state` (como aprendió `flows`): de «una muestra se
recoge, se analiza y se certifica o se rechaza» sale el enum + la máquina. El chat es también
el editor de respaldo: corregir una flecha se puede pedir con texto.

## 3. Plantillas backend (todo en `generator.ts`, plantillas tontas)

Ejemplo guía: `cliente` con `estado: pendiente | aprobada | descartada | cerrada`,
`initial: pendiente`, transiciones aprobar/descartar/cerrar.

1. **VO enriquecido** (misma plantilla de VO enum + piezas):

```ts
export class ClienteEstado extends EnumValueObject {
  static initial(): ClienteEstado { return ClienteEstado.create('pendiente') }
  static aprobada(): ClienteEstado { return ClienteEstado.create('aprobada') }  // por valor
  isAprobada(): boolean { return this.value === 'aprobada' }                    // por valor
}
```

2. **Método por transición en el agregado** (patrón `archive()` de la referencia):

```ts
/** Transición «Aprobar»: pendiente → aprobada. */
aprobar(): void {
  if (this._estado.isAprobada()) {
    return                                        // re-aplicar es no-op
  }
  if (!this._estado.isPendiente()) {              // OR de los from si hay varios
    throw new ClienteInvalidTransitionError(
      `No se puede aprobar un cliente en estado "${this._estado.value}"`)
  }
  this._estado = ClienteEstado.aprobada()
}
```

`register()` deja de recibir el campo (nace `ClienteEstado.initial()`); sale de
`UpdateProps` y `updateDetails` no lo toca.

3. **Caso de uso por transición** (tres líneas):
   `findByIdOrFail(id)` → `cliente.aprobar()` → `save(cliente)`.

4. **Endpoint**: `POST /clientes/:id/aprobar` → 204. Guarda rechazada →
   `ClienteInvalidTransitionError` mapeado a **409 Conflict** por tipo (no por string) —
   la petición es válida, es el estado quien la rechaza. Id inexistente → 404.

Persistencia: las transiciones guardan por el `save()` existente — TypeORM y Mongo valen
sin trabajo. Papelera: sin interacción (entidad borrada no muestra ficha ni acciones).

## 4. Plantillas frontend

1. **Servicio**: un método por transición
   (`aprobar(id)` → `POST {baseUrl}/{id}/aprobar`).

2. **Ficha**: fila de botones de acción en la cabecera — uno por transición cuyo `from`
   incluye el estado actual, el resto ni se pinta (la UI enseña la máquina):

```
┌─ Cliente: Ayuntamiento de Tudela ────────────────────────────┐
│  Estado: ● Pendiente          [ Aprobar ]  [ Descartar ]     │
└──────────────────────────────────────────────────────────────┘
   tras Aprobar → reload → Estado: ● Aprobada   [ Cerrar ]
```

Pulsar → disabled+spinner → POST → `reload()` del `resource()` → botones se recalculan
(`computed`). 409 (carrera con otro usuario) → toast con el mensaje del dominio + recarga.
Sin diálogo de confirmación (una transición es reversible dibujando la flecha de vuelta).

3. **Formulario**: el campo desaparece de alta y edición (mecanismo de exclusión existente).

4. **Listado**: sin cambios (badge + filtro como cualquier enum).

5. **Tests emitidos**: servicio (POST correcto), ficha (botones según estado, 409 → toast
   + recarga) — al nivel del resto de fixtures.

## 5. Validación

- La app de oro (`tools/golden-fixtures/app`) gana una máquina (p. ej. contrato:
  `borrador → firmado → archivado`) — `/golden-diff` es el gate de cada tarea de plantillas.
- Suite completa + `npm run web:build` (AOT; la suite JIT deja pasar errores de plantilla).
- Demo en navegador: diseñar la máquina en el estudio (chat + gestos), generar, ejercitar
  aprobar/descartar viendo botones aparecer/desaparecer; re-aplicar (204 no-op) y transición
  ilegal (409 + toast). Capturas a `docs/style/`.

## Decisiones técnicas

| Decisión                        | Elegida                          | Razón                                            |
| ------------------------------- | -------------------------------- | ------------------------------------------------ |
| Anclaje de la máquina           | enum promovido del recurso       | una fuente de verdad; gate trivial               |
| Re-aplicar transición           | no-op                            | patrón `archive()` referencia; idempotencia HTTP |
| Guarda rechazada                | error de dominio → 409           | la petición es válida; el estado la rechaza      |
| Estados en el diagrama          | no creables (son el enum)        | el diagrama es vista, el campo es la verdad      |
| Alcanzabilidad                  | warning, no error                | diseño a medias no rompe el emitido              |
| Guardas extra-estado            | fuera (hueco @ai)                | evitar inner-platform effect (regla 7)           |
| Edición                         | chat + gestos desde el día 1     | decisión Alfonso 2026-08-15                      |

## Riesgos identificados

| Riesgo                                                        | Prob. | Impacto | Mitigación                                                   |
| ------------------------------------------------------------- | ----- | ------- | ------------------------------------------------------------ |
| Colisión de `name` de transición con rutas CRUD emitidas       | media | alto    | lista de reservados en el gate de `defineApp`                 |
| El merge de flechas mismo-`name` confunde al guardar           | media | medio   | tests del helper de agrupado; la selección muestra la flecha, no la transición |
| El chat propone máquinas triviales o sobredimensionadas        | media | bajo    | ejemplos en el prompt + el gate poda; el diagrama lo hace visible |
| Formularios emitidos con enum-estado rompen fixtures existentes | baja  | medio   | `/golden-diff`: solo cambian las apps que declaren `state`    |
