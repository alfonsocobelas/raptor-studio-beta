# Spec 64: Calendario interactivo (alta y edición desde el bloque calendario)

## Contexto de negocio

El bloque calendario (spec 59) nació como lectura pura: la misma página del listado pintada
por días, sin endpoint propio. La demo veterinaria (2026-08-24) lo puso en evidencia: quien
mira un calendario de citas espera OPERAR sobre él — crear una cita en el hueco de un día y
abrir/editar la que ya existe — igual que el kanban (spec 61) pasó de ver el enum a disparar
transiciones. Es el hermano de escritura del calendario: misma receta, sin backend nuevo
(el alta y la edición usan el diálogo CRUD y los endpoints que ya emite el listado).

Detectado en la demo veterinaria; se arregla en el generador, nunca en la app emitida
(doctrina «las demos detectan, no se parchean»). El enlace al detalle NO es parte de esta
spec: ya existe condicionado a `detail` (en la demo se resolvió activando `detail` en cita).

## User stories (formato EARS)

- WHEN el usuario pulsa sobre un día del calendario (celda de mes/semana, o el botón de alta
  en la vista de día) THEN se abre el diálogo de alta del recurso (el mismo
  `<recurso>-dialog` del listado) con el campo fecha (`dateField`) precargado con ese día.
- WHEN el usuario guarda el alta THEN el calendario se recarga (mismo `resource()` compartido
  con el listado) y la tira nueva aparece en su día.
- WHEN el usuario pulsa sobre una tira THEN: IF el recurso tiene `detail` THEN navega a la
  ficha (comportamiento actual, se conserva); IF NO tiene `detail` THEN se abre el diálogo de
  edición con el registro cargado (hoy la tira es inerte — ese es el defecto n.º 3 de la demo).
- IF el usuario no tiene la capacidad de crear sobre el recurso (accesos granulares, spec 49)
  THEN el gesto de alta no se ofrece; IF no puede editar THEN la tira sin `detail` queda
  como hoy (solo lectura).
- WHEN el backend rechaza el alta o la edición THEN el diálogo muestra el error como en el
  listado (mismo manejo, cero código nuevo de errores).

## Criterios de aceptación

- [ ] Clic/Enter en un día abre el diálogo de alta con `dateField` precargado; al guardar,
      la tira aparece sin recargar la página.
- [ ] Clic en tira: detalle si hay `detail`, diálogo de edición si no lo hay. Nunca inerte.
- [ ] Los gestos de escritura respetan las capacidades emitidas (create/edit por rol).
- [ ] Cero endpoints nuevos: todo pasa por el CRUD existente del recurso.
- [ ] Golden diff en verde tras re-baseline deliberado (el oro del calendario cambia).
- [ ] La demo veterinaria regenerada permite crear una cita desde el calendario y abrirla.

## Alcance

- **Frontend emitido**: plantilla `files-calendar/frontend/__plural__-calendar.component.ts.template`
  (importar/abrir el diálogo CRUD, gesto de alta por día, gesto de edición por tira).
- **Generador**: `generator.ts`/build-substitutions del bloque calendario (decidir qué gestos
  emitir según `detail`, capacidades y si el recurso tiene formulario de alta).
- **Estudio**: sin cambios de panel previstos (la config del bloque no crece); revisar solo
  si el preview del canvas debe insinuar el gesto de alta.
- **Backend**: sin cambios.

## Referencia (patrón de oro)

- `libs/generators/src/generators/resource/files-calendar/` (plantilla actual, spec 59).
- El diálogo CRUD que ya emite el listado (`<recurso>-dialog.component`) — pieza a reutilizar.
- Spec 61 (kanban): precedente de bloque que escribe vía endpoints existentes y respeta
  capacidades.

## Prioridad y dependencias

- Prioridad: alta (defecto visible en demo entregable).
- Depende de: spec 59 (calendario, cerrada), spec 48 (diálogo de formulario, cerrada),
  spec 49 (accesos granulares, cerrada). Sin bloqueos.

## Preguntas abiertas (confirmar con Alfonso antes del DESIGN)

1. En vista de mes/semana, ¿el alta se dispara con clic en el hueco vacío de la celda o con
   un botón «+» que aparece al pasar por encima? (el clic desnudo choca con el clic en tira).
2. Tira sin `detail` → ¿diálogo de edición directamente, o un popover de solo lectura con
   botón «Editar»?
3. ¿Precargar solo la fecha o también la hora (si `dateField` es datetime, p. ej. 09:00)?
