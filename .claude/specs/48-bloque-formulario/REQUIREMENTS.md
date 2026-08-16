# Spec: Bloque Formulario (estudio + generador)

---

## Contexto de negocio

El estudio permite diseñar vistas con bloques (tabla, KPIs, galería, ficha, adjuntos), pero el mockup
de Alfonso incluye un bloque **Formulario** que hoy no existe. La doctrina del proyecto ("el lienzo no
promete lo que no se genera") exige que el bloque nazca con su contrapartida emitida: una **página de
formulario** para una entidad — el caso «página de solicitud» — que crea registros y, con `:id` en la
ruta, los edita.

El formulario emitido ya existe como **diálogo** colgado del listado; esta spec añade la variante
**en página** sin tocar el diálogo. En el lienzo, el bloque reutiliza la parrilla de controles del
diálogo mock de la parte A (commits `a07f5c69` + `2349d78e`, 2026-08-16).

Decisiones cerradas en brainstorming (2026-08-16):

- El bloque emite **alta y edición en página** (no solo alta, no solo diseño).
- **Convive** con el diálogo del listado: «Nueva X» y el lápiz siguen abriendo su diálogo.
- Al guardar con éxito, la página **navega al listado** de la entidad con toast de confirmación.
- El modo edición (`/:id`) es alcanzable **solo por URL** de momento; enlazarlo desde ficha o tabla
  será otra tarea.
- Enfoque técnico: **plantilla EJS nueva que reutiliza las sustituciones existentes**
  (`formSections`, `formValueLines`, validadores, labels con género de `build-substitutions.ts`).
  El diálogo emitido y sus goldens quedan intactos.

## User stories (formato EARS)

### Estudio (diseño)

- WHEN el diseñador abre la paleta de componentes THEN ve el bloque «Formulario» junto a los existentes
- WHEN el diseñador arrastra (o pulsa) el bloque Formulario sobre una vista THEN el lienzo pinta el
  formulario mock de la entidad del contexto (misma resolución de entidad que el resto de bloques:
  vista → inspector → primera del modelo)
- WHEN el lienzo pinta un bloque Formulario THEN muestra los mismos controles por tipo de campo que el
  diálogo mock de la parte A (text/textarea/number/date/checkbox/select) con los rótulos del generador
- WHEN el diseño se exporta a la frontera THEN una vista con bloque `form` pasa el gate y viaja al
  generador como página de formulario
- IF la entidad del bloque cambia de campos (añadir/renombrar/borrar columna) THEN el bloque Formulario
  del lienzo refleja el cambio (misma fuente: el draft del store)

### App emitida (generador)

- WHEN el generador procesa una vista con bloque `form` de la entidad X THEN emite una página con
  formulario inline de alta (mismos campos, controles y validaciones que el diálogo de X)
- WHEN el usuario de la app navega a la ruta de la página con `:id` THEN el formulario carga el registro
  y funciona como edición
- WHEN el usuario guarda con éxito (alta o edición) THEN la app navega al listado de la entidad y
  muestra el toast de confirmación del canon
- IF el guardado falla THEN el formulario permanece con los datos introducidos y muestra el error
  (mismo patrón de error que el diálogo)
- IF la entidad tiene matriz de accesos THEN la página respeta la capacidad de escritura igual que el
  diálogo (quien no puede escribir no puede usar la página)
- WHILE el registro de `:id` está cargando THEN la página muestra el estado de carga del canon

## Criterios de aceptación

- [ ] El bloque «Formulario» aparece en la paleta del estudio y se puede soltar en una vista
- [ ] El bloque en el lienzo pinta el formulario mock con los campos reales del draft
- [ ] Un diseño con bloque `form` exporta, pasa la frontera y genera sin errores
- [ ] La app generada tiene la página de formulario con su ruta de alta y su ruta `:id` de edición
- [ ] Guardar navega al listado con toast; el diálogo del listado sigue funcionando igual que antes
- [ ] Los goldens existentes quedan con diff vacío; la página nueva tiene su golden propio
- [ ] Suite completa verde (vitest estudio + tests generador + build AOT + smoke)

## Referencias (proyecto de referencia y diseño)

- Plantilla del diálogo emitido: `libs/generators/src/generators/resource/files/frontend/__fileName__-dialog.component.ts.template`
- Sustituciones de formulario: `libs/generators/src/generators/resource/build-substitutions.ts` (`formSections`, `formValueLines`, `createLabel`, género)
- Parte A (lienzo): `apps/studio/libs/frontend/src/domains/studio/design/canvas-form-dialog.component.ts` y `form-preview.ts`
- Catálogo de bloques: `apps/studio/libs/shared/domain/src/studio/design-page.ts` (`BlockKind`, `VIEW_PRESETS`, `GENERABLE_BLOCKS`)
- Paleta: `apps/studio/libs/frontend/src/domains/studio/design/views-sidebar.component.ts` (`BLOCK_TOOLS`)
- Canon de formularios: `docs/referencia/libs/frontend/` (diálogos de customers/contracts/licenses/projects)

## Reglas de negocio aplicables

- «El lienzo no promete lo que no se genera»: el bloque entra en `GENERABLE_BLOCKS` desde el día uno
- «Plantillas tontas, lógica en generator.ts»: la plantilla nueva solo interpola sustituciones ya calculadas
- Regla de los dos: NO se extrae un `app-x-form` compartido entre diálogo y página (solo 2 consumidores; duplicación confinada al markup EJS)
- Gate de oro: cualquier cambio en plantillas exige `/golden-diff` con diffs vacíos en lo preexistente

## Fuera de scope (deliberado)

- Enlazar el modo edición desde la ficha o desde la tabla (queda solo por URL)
- Sustituir el diálogo del listado por la página («la página sustituye al diálogo» se descartó)
- Comportamientos post-submit alternativos (quedarse y vaciar, ir a la ficha)
- El bloque «Gráfico» del mockup (otro BlockKind, otra spec)
- Formularios multi-paso, secciones configurables o campos condicionales

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `DESIGN.md` hasta aprobación explícita del usuario.
