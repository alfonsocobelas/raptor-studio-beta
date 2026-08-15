# Spec: Flujos de negocio (diagrama de flujo en el estudio)

**Estado:** DISEÑADA (brainstorming 2026-08-07)
**Depende de:** 15 fase 4 (gestos del diagrama — CERRADA 2026-08-07, la infra existe) · 22 (el `CLAUDE.md` emitido debe existir para el aterrizaje, TASK-05 de la 22 — SIN EJECUTAR a fecha de esta spec)

---

## Contexto de negocio

El brief de negocio (spec 22) captura reglas como prosa (`rules: string[]`).
Sirve para «el NIF es obligatorio», pero un **proceso con ramas** no cabe en
una frase: «cuando llega un pedido, si hay stock se reserva; si no, se pide al
proveedor y el pedido queda en espera» es un diagrama, no una regla.

Esta spec añade los **flujos de negocio** al contrato: diagramas de flujo
(inicio → pasos → decisiones → fines) que se dibujan en el estudio, viajan con
el diseño y aterrizan en la app generada como contexto. Su consumidor es la
**IA post-generación**: cuando el desarrollador pida implementar una regla de
negocio a mano sobre el código generado, el flujo es el contexto que le dice
qué proceso está implementando. El flujo NO genera código — es contexto, igual
que el brief (mismo precedente de metadatos-que-no-generan-código).

Decisiones cerradas en el brainstorming (2026-08-07):

- **Vocabulario**: proceso de negocio libre con cuatro tipos de nodo
  (`start`/`step`/`decision`/`end`). La **máquina de estados por entidad**
  (estados + transiciones + guardas) queda ANOTADA como evolución futura —
  más cerca del código pero no expresa procesos que cruzan entidades.
- **Autoría mixta**: el chat destila flujos de la conversación Y el usuario
  dibuja desde cero con una paleta de nodos. En ambos casos edita visualmente.
- **Schema-driven**: `AppDefinition.flows` validado por el gate `defineApp`.
  Persistencia (spec 21), export y viaje al generador salen gratis. Nada de
  artefactos de dibujo fuera del gate (decisión ancla del estudio).
- **El layout no es dato**: posiciones solo en memoria + auto-layout
  determinista, como la vista de modelo (spec 15 §4 de REQUIREMENTS).
- **Aterrizaje**: sección «Procesos de negocio» en el `CLAUDE.md` de la app
  generada (spec 22), en forma estructurada paso a paso legible por humanos
  e IA. Sin flujos → la sección no aparece.

## User stories (formato EARS)

- WHEN el usuario cuenta un proceso con ramas en el chat THEN la IA propone un
  flujo (nodos + aristas) que aparece dibujado en la vista Flujos
- WHEN el usuario pulsa «nuevo flujo» y arrastra nodos desde la paleta THEN
  construye un diagrama desde cero sin pasar por el chat
- WHEN el usuario conecta dos nodos arrastrando THEN se crea la arista; si el
  origen es una decisión, la arista pide etiqueta (sí/no/…)
- IF un flujo tiene una arista hacia un nodo inexistente, ids duplicados, una
  decisión con menos de dos salidas o supera los topes THEN `defineApp` lo
  rechaza con un error accionable
- WHEN se exporta/persiste el diseño THEN los flujos viajan en el `.app.json`
  y se restauran al recargar (spec 21, sin trabajo extra)
- WHEN se genera la app con flujos declarados THEN el `CLAUDE.md` emitido
  contiene la sección «Procesos de negocio» con cada flujo en forma
  estructurada paso a paso
- WHILE se arrastra una caja del diagrama THEN la posición cambia solo en
  memoria: recargar vuelve al auto-layout y el `.app.json` no cambia

## Criterios de aceptación

- [ ] Contrato `BusinessFlow` en `@raptor/schema` con gate estructural en `defineApp`
- [ ] Vista **Flujos** en el lienzo (conmutador Vistas / Modelo / Flujos)
- [ ] Edición visual completa: paleta, arrastre, conexión con flecha fantasma,
      etiquetas en salidas de decisión, selección y borrado
- [ ] El chat propone y modifica flujos bajo el gate (fake adapter incluido)
- [ ] `buildAppFile` copia los flujos; la existencia de `entity` referenciada
      se valida en la frontera
- [ ] `CLAUDE.md` de la app generada incluye los flujos (render determinista,
      función pura con tests)
- [ ] Golden diff vacío (los modelos de oro no declaran flujos)
- [ ] e2e con captura: flujo dibujado en el estudio → visible en el `CLAUDE.md`
      de la app generada

## Referencias (proyecto de referencia y diseño)

- Spec 15 `DESIGN.md` fase 4 — infraestructura del diagrama (cajas, SVG, drag)
- Spec 22 — brief de negocio y emisión de `CLAUDE.md`
- `docs/vision-editor-visual-schema.md` — decisión ancla schema-driven

## Reglas de negocio aplicables

- Regla 7 (generar, no interpretar): el flujo es contexto, nunca fuente de
  generación de código. No se «compila» el diagrama.
- Regla 8: el render a markdown se calcula en `generator.ts`; plantilla tonta.
- Topes como el brief: el contrato pone límites para no degradar el prompt.

## Fuera de alcance

- Máquina de estados por entidad (anotada como spec futura).
- Generar código desde el flujo (casos de uso, validaciones…): inner-platform.
- Validación semántica del proceso (alcanzabilidad de todos los nodos se
  valida; que el proceso «tenga sentido» no).
- Persistir posiciones del layout.
- Subprocesos, carriles (swimlanes), eventos temporales: BPMN no cabe aquí.
