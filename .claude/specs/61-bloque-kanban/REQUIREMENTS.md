# Spec 61: Bloque Kanban (componente 22F)

## Contexto de negocio

Cualquier tabla con un campo enum se puede ver como tablero: una columna por valor del enum y
cada registro como tarjeta en su columna. Donde el enum está **promovido a estado** (máquina de
estados, spec 43), mover una tarjeta ES disparar la transición — el tablero se convierte en la
pantalla de operación del flujo (pedidos pendiente→en curso→entregado). Estaba en el banco de
ideas del ROADMAP («kanban por enum») y es el hermano operativo del calendario (spec 59): misma
receta de BlockKind, pero con escritura.

No hay mock 22F: la esencia visual se propone siguiendo el lenguaje del 22E (cabecera con
título, columnas con contador, tarjetas con etiqueta + hasta 2 atributos, pie con el origen)
y se valida con Alfonso sobre el preview del canvas antes de congelar el oro.

## User stories (formato EARS)

- WHEN el usuario arrastra el bloque «Kanban» a una vista y elige un recurso con al menos un
  campo enum THEN el canvas pinta un tablero de columnas (una por valor, con su etiqueta
  humana) y el panel del bloque ofrece: **Columnas** (campo enum, obligatorio; por defecto el
  campo de estado si existe, si no el primer enum) y **Etiqueta** (campo de la tarjeta).
- IF el recurso no tiene ningún campo enum THEN el bloque se marca «Diseño aún no generable»
  y no cruza al app-schema (mismo patrón que el calendario sin fecha).
- WHEN se genera la app THEN existe la pantalla `/{ruta}/tablero` sobre el endpoint de listado
  existente, con una columna por valor del enum y las tarjetas del recurso.
- IF el enum elegido es el campo de la máquina de estados THEN arrastrar una tarjeta a otra
  columna dispara la transición correspondiente vía su endpoint; las columnas SIN transición
  legal desde el estado actual no aceptan el drop (se señalan al arrastrar).
- IF el enum NO es de estado THEN arrastrar la tarjeta actualiza el campo vía el update
  existente.
- IF entre dos estados hay más de una transición THEN v1 usa la primera declarada (el caso
  canónico es una); lo raro se opera desde la ficha.
- WHEN el backend rechaza el movimiento (transición ilegal, permisos) THEN la tarjeta vuelve a
  su columna y se muestra el error (toast).
- WHEN el usuario pulsa una tarjeta THEN navega a la ficha si existe (igual que tabla/galería).

## Criterios de aceptación

- [ ] `BlockKind` incluye `kanban`; generable solo con campo enum (patrón calendario).
- [ ] Paleta con icono `lucideSquareKanban` + preview de canvas fiel al lenguaje 22x + panel
      del bloque (Columnas / Etiqueta) reutilizando el patrón de `calendar-config`.
- [ ] `KanbanDefinition { field, label? }` en el resource-schema con validación (enum existe).
- [ ] Generador: `files-kanban/` + ruta `/tablero` antes de `:id` + sufijo `· tablero`;
      drag con transiciones (enum-estado) o update (enum normal); typecheck emitido 0 errores.
- [ ] Frontera: draft flag + cruce + descarte sin campo enum.
- [ ] Golden: un modelo de oro gana kanban; `/golden-diff` limpio en el resto.
- [ ] Suites del estudio y del plugin en verde.

## Referencias del proyecto de referencia

- Receta BlockKind end-to-end: spec 59 (`.claude/specs/59-bloque-calendario/`) y spec 48.
- Máquina de estados y sus endpoints de transición: spec 43.
- Lenguaje visual: mock 22E (`docs/style/Captura … 21.44.44.png`).

## Reglas de negocio aplicables

- Sin backend nuevo: lectura por el listado; escritura por los endpoints que YA existen
  (transición o update). El kanban no inventa reglas: si la máquina veta un salto, el tablero
  lo veta.
- «Generar, no interpretar»: swimlanes, WIP-limits y orden manual de tarjetas quedan fuera;
  se editan a mano sobre lo emitido si un cliente los pide.

## Fuera de scope (deliberado)

- Reordenar tarjetas dentro de una columna (el orden es el del listado).
- Swimlanes, límites WIP, agregados por columna (sumas).
- Crear registros desde el tablero.
- Elegir QUÉ transición usar cuando hay varias entre dos estados (v1: la primera declarada).
