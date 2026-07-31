# Spec: studio-editing (Fase C del editor visual)

## Contexto de negocio

Tercera fase de `docs/vision-editor-visual-schema.md`: el visor se vuelve **editable**. Toda
interacción muta el **app-schema** (nunca el DOM ni un estado de diseño propio) y el lienzo se
re-deriva. Alcance deliberado: mutaciones a nivel de app-schema (páginas y widgets); los
resource-schemas siguen siendo de solo lectura (editarlos es fase D/futuro).

## User stories (formato EARS)

- WHEN paso el cursor sobre un componente del lienzo (tarjeta KPI, tabla/página) THEN se
  resalta y aparece una cruz para eliminarlo.
- WHEN elimino una tarjeta KPI THEN desaparece su widget del dashboard del app-schema y el
  lienzo se re-renderiza; si era el último widget, desaparece la página dashboard entera.
- WHEN elimino una página THEN sale del app-schema, del nav y del lienzo.
- WHEN arrastro páginas en el nav (drag&drop) THEN cambia su orden en el app-schema (y por
  tanto el orden de rutas/nav de la app final).
- WHEN abro la paleta THEN veo los componentes disponibles del catálogo: recursos sin página,
  widgets KPI de recursos sin tarjeta, y "Dashboard" si no existe; añadir uno muta el schema.
- WHEN abro el panel "Schema" THEN veo el app-schema resultante (JSON) tal y como lo consumiría
  el generador — la prueba de que el estado ES el schema.
- IF una mutación produjera un app-schema inválido (p. ej. quedarse sin páginas) THEN la
  operación se bloquea con aviso, no se aplica a medias.

## Criterios de aceptación

- [ ] `app-mutations.ts` puro: remove/add/move de páginas y widgets, validado con `defineApp`.
- [ ] Store de señales: `AppDefinition` como única fuente; la composición se deriva computed.
- [ ] Hover-highlight + cruz de borrado en KPI cards y páginas; drag&drop de orden en el nav (CDK).
- [ ] Paleta con los elementos añadibles derivados del catálogo (nunca inventados).
- [ ] Panel con el JSON del app-schema vivo.
- [ ] Tests puros verdes (mutaciones + store) y smoke Playwright de las interacciones clave.

## Referencias del proyecto de referencia

- `docs/vision-editor-visual-schema.md` §1 (flujo de mutación), §4 fase C.
- CDK drag-drop (ya presente vía Spartan/CDK en el workspace studio).

## Reglas de negocio aplicables

- Lienzo schema-driven: prohibido estado de diseño que no sea el propio `AppDefinition`.
- Paleta = catálogo del generador (regla 7): solo recursos registrados y widgets emitibles.
- Toda mutación pasa por `defineApp` (gate estructural) antes de aceptarse.

## Fuera de scope (deliberado)

- Editar resource-schemas (columnas, campos) — el lienzo los muestra read-only.
- Undo/redo, persistencia a disco del schema editado — fase D/E (el chat y el wizard lo harán).
- Crear recursos nuevos desde la paleta (requiere editor de resource-schema).
