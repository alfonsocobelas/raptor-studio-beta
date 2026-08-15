# Spec: Máquina de estados de la entidad

> Aprobada en brainstorming 2026-08-14/15. Primera de las categorías de reglas de negocio
> que el emitido pierde frente a la referencia (ver DESIGN §0): la única que combina alto
> valor, derivación 100% determinista desde un dibujo y editor visual ya casi construido.

---

## Contexto de negocio

Las entidades emitidas por el generador no llevan ninguna regla de negocio: comparado con la
referencia (`docs/referencia/.../contracts/domain/contract.ts`), el emitido pierde los métodos
de ciclo de vida (`archive`, `markSeenInSync`…) y sus guardas. Esta spec ataca la categoría
más valiosa: el **ciclo de vida de la entidad como máquina de estados** — un campo enum
promovido a estado, transiciones dibujadas como flechas, y todo el salto emitido determinista
de punta a punta (VO con predicados → método con guarda → caso de uso → endpoint → botón).

La regla de negocio se declara como **flecha que existe o no existe**: "un pedido enviado no
se puede cancelar" es la ausencia de la flecha `enviado → cancelado`. Nada que interpretar:
dado el dibujo, el código se deriva mecánicamente. La IA solo interviene en el borde que ya
tenemos: el chat del estudio propone la máquina a partir del texto del diseñador.

## User stories (formato EARS)

### Contrato y gate

- WHEN un recurso declara `state` (campo enum + `initial` + `transitions`) THEN `defineApp`
  valida la máquina completa con errores accionables (ver DESIGN §1)
- IF una transición referencia un valor que no existe en el enum, o el campo no es enum,
  o hay nombres duplicados THEN `defineApp` rechaza con error accionable
- IF un valor del enum queda inalcanzable desde `initial` THEN `validateDesign` lo señala
  como **warning**, nunca como error (el diseño puede estar a medias)

### Estudio

- WHEN el diseñador cuenta el ciclo de vida en el chat ("una muestra se recoge, se analiza
  y se certifica o se rechaza") THEN el chat propone el enum + la máquina en el diseño
- WHEN un recurso tiene `state` THEN su vista en el canvas pinta el diagrama: valores como
  nodos, transiciones como flechas con su label, `initial` distinguido
- WHEN el diseñador arrastra desde el borde de un estado hasta otro THEN se crea una
  transición con nombre propuesto y label editable inline
- WHEN el diseñador selecciona una flecha y pulsa Supr THEN la transición se borra
- WHEN el diseñador marca «Es el estado de la entidad» en un campo enum THEN nace `state`
  con `initial` = primer valor; al desmarcar (con confirmación) se elimina con sus transiciones

### Emitido — backend

- WHEN se genera la app THEN el VO del campo estado gana factorías semánticas y predicados
  (`ClienteEstado.aprobada()`, `isAprobada()`), y el agregado un método por transición con
  guarda: re-aplicar en destino es no-op; origen ilegal lanza error de dominio con el label
- WHEN nace la entidad THEN el campo vale `initial` y no se pide en el alta; `updateDetails`
  no lo toca (sale de los props de update)
- WHEN se invoca `POST /{plural}/:id/{transicion}` THEN caso de uso de tres líneas
  (cargar → transicionar → guardar) → 204; guarda rechazada → **409** con el mensaje del
  dominio; id inexistente → 404

### Emitido — frontend

- WHEN la ficha carga una entidad THEN muestra un botón por transición legal desde el estado
  actual, y solo esas (computed sobre el estado cargado)
- WHEN se pulsa un botón THEN disabled+spinner → POST → reload → los botones se recalculan
- IF el servidor responde 409 THEN toast con el mensaje y recarga (la ficha se cura sola)
- WHILE el recurso tiene máquina THEN el campo estado no aparece en alta ni edición, pero
  sigue en listado/ficha/filtros como badge

## Criterios de aceptación

- [ ] `defineApp` acepta la máquina válida y rechaza cada infracción con error accionable
- [ ] El chat del estudio propone `state` desde una descripción en lenguaje natural
- [ ] El canvas pinta la máquina y los gestos crean/editan/borran transiciones
- [ ] La app de oro gana una máquina y `/golden-diff` queda vacío
- [ ] En la demo generada: aprobar/descartar desde la ficha viendo aparecer y desaparecer
      botones; re-aplicar y transición ilegal responden 204-noop y 409
- [ ] Suite completa verde + `npm run web:build`

## Referencias

- `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/domain/contract.ts`
  — patrón `archive()`/`markSeenInSync()` (guarda de estado, no-op, timestamp) y el par
  `status` editable vs `lifecycleStatus` gobernado por máquina
- Editor de grafos: spec 15 (gestos, `autoLayout`/`overlayLayout`/`nodeBox`/`edgeLine`),
  specs 28/39 (flujos: contrato, gate, JSDoc del proceso)

## Reglas de negocio aplicables

- «Generar, no interpretar» (CLAUDE.md regla 7): la máquina cubre guardas **de estado**;
  las guardas que miran otros campos son otra categoría y NO se retuercen aquí
- «Plantillas tontas, lógica en generator.ts» (regla 8)
- IA solo en los bordes: el chat propone; el generador solo lee el JSON validado

## Fuera de scope (deliberado)

- **Guardas extra-estado** («no se archiva un MANUAL»): categoría 3/5, quedan para el hueco
  `@ai:domain-extra` o edición manual — meterlas en el diagrama es el inner-platform effect
- **Convergencia flujos↔transiciones** (paso de flujo con `transition` emite cuerpo real +
  endpoint; encadenar el relleno de huecos como fase visible de la pantalla de obra —
  decisión «opción b» 2026-08-15): spec siguiente. Aquí solo se declara y valida
  `FlowNode.transition` para no romper el contrato dos veces
- Más de una máquina por recurso; acciones de transición en las filas del listado; diálogo
  de confirmación antes de transicionar; efectos declarables (timestamps) en la transición
