# Tareas atómicas: Bloque Formulario (estudio + generador)

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.
> Orden: contrato (schema → estudio) → store → canvas → generador app → generador resource → golden.
> El schema va PRIMERO: `draftToResource` devuelve `ResourceDefinition` y en strict no puede emitir
> `form: {}` hasta que el tipo exista.

---

## Contrato

- [x] **TASK-01**: `libs/schema` — `form?: Record<string, never>` en `ResourceDefinition`, kind `'form'`
      en `PageDefinition`, actualizar `GENERABLE_PAGE_KINDS`. Test: `defineApp` acepta una página `form`.
      _Commit `526964ea` (2026-08-16)._
- [x] **TASK-02**: estudio shared/domain — `'form'` en `BlockKind` y `GENERABLE_BLOCKS`
      (`design-page.ts`), `form?: boolean` en `DraftResource` y `form: {}` en `draftToResource`. Tests vitest.
      _Commit `97a607d0` (2026-08-16)._
- [x] **TASK-03**: `design-to-app.ts` — el bloque `form` cruza como página `{ kind: 'form', resource }`,
      deduplicado por `(kind, resource)`. Tests vitest.
      _Commit `315913f9` (2026-08-16)._

## Estudio

- [x] **TASK-04**: `design-store` — `addBlock` enciende `r.form`, `removeBlock` lo apaga, y el export
      lleva `form: {}` en el resource. (`addPage` no aplica: ningún preset trae bloques form.) Tests vitest.
      _Commit `13e4ad11` (2026-08-16)._
- [ ] **TASK-05**: extraer `canvas-form-fields.component.ts` (parrilla de controles) de
      `canvas-form-dialog.component.ts`; el diálogo la consume. Gate: `smoke-form-dialog.ts` 9/9 + AOT.
- [ ] **TASK-06**: bloque en el lienzo — `canvas-form.component.ts`, caso `form` en `canvas-page`,
      entrada en `BLOCK_TOOLS`, `view-icon`, `block-drop`. Gate: smoke nuevo `tools/smoke-form-block.ts` + AOT.

## Generador — app

- [ ] **TASK-07**: `composeApp` resuelve la página `form`; `pathOf` → `/{ruta}/formulario`;
      `formRoute()` emite `/{ruta}/formulario` y `/{ruta}/formulario/:id` ANTES de `detailRoute`;
      entrada de nav. Tests del generador (incluido el orden frente a `:id`).

## Generador — resource

- [ ] **TASK-08**: sustituciones mínimas en `build-substitutions.ts` (ruta del listado post-submit,
      textos de la página) + `files-form/` con la plantilla en MODO ALTA (crear + toast + navigate al
      listado) + su spec.template + emisión condicional `if (model.form)` en `resource.ts`. Test de
      emisión; `/golden-diff` de lo existente VACÍO.
- [ ] **TASK-09**: modo edición — con `:id` carga el registro (loading/error del canon), precarga el
      form y guarda con `update()`. Test de emisión + spec.template ampliado.
- [ ] **TASK-10**: fixture congelada con `form` habilitado + baseline de oro de la página nueva
      (commit propio de re-baseline, sin mezclar).

## Validación final

- [ ] **TASK-11**: `/golden-diff` completo, suite del estudio + generador verde, build AOT, demo
      regenerada con una vista-formulario y smoke del flujo emitido (alta por página → toast → listado;
      edición por URL).

---

## Regla del juego

- Implementar **UNA** tarea, commit, esperar aprobación, siguiente.
- Si una tarea parece > 1h o > ~150 líneas, partirla antes de empezar.
- Dependencia oculta no contemplada → **PARAR** y reportar.
- Ojo a sesiones concurrentes en el worktree: `git add` SOLO de ficheros propios.
