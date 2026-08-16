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
- [x] **TASK-05**: extraer `canvas-form-fields.component.ts` (parrilla de controles) de
      `canvas-form-dialog.component.ts`; el diálogo la consume. Gate: `smoke-form-dialog.ts` 9/9 + AOT.
      _Commit `13771e42` (2026-08-16)._
- [x] **TASK-06**: bloque en el lienzo — `canvas-form.component.ts`, caso `form` en `canvas-page`,
      entrada en `BLOCK_TOOLS`, `view-icon`, `block-drop`. Gate: smoke nuevo `tools/smoke-form-block.ts` + AOT.
      _Commit `217d561b` (2026-08-16)._

## Generador — app

- [x] **TASK-07**: `composeApp` resuelve la página `form`; `pathOf` → `/{ruta}/formulario`;
      `formRoute()` emite `/{ruta}/formulario` y `/{ruta}/formulario/:id` ANTES de `detailRoute`;
      entrada de nav. Tests del generador (incluido el orden frente a `:id`).
      _Commit `fbd3e5f3` (2026-08-16)._

## Generador — resource

- [x] **TASK-08**: sustituciones mínimas en `build-substitutions.ts` + `files-form/` con la plantilla
      en MODO ALTA + emisión condicional `if (model.form)` en `resource.ts`. Test de emisión; golden vacío.
      _Commits `e5cc7e20` + fix `f1721d20` (2026-08-16/17). El spec.template llegó en `bbcc73ee`._
- [x] **TASK-09**: modo edición — con `:id` carga el registro, precarga el form y guarda con `update()`.
      `findOne` del service se emite ahora con `detail || formPage`. _Commit `c2f39152` (2026-08-17)._
- [x] **TASK-10**: fixture congelada con `form` (project + página en golden.app) + baseline de oro.
      _Commits `7a8c01a2` y `d11b0291` (2026-08-17)._

## Validación final

- [x] **TASK-11**: `/golden-diff` completo ✅ (6 baselines vacíos) · suite estudio 780/780 ✅ ·
      suite generators 781/781 ✅ · build AOT ✅ · smokes estudio 9/9 y 4/4 ✅ ·
      `typecheck-emitted` 0 errores ✅ · spec emitido de la página ejecutado 4/4 en app generada
      fuera del monorepo ✅. **Pendiente-bloqueado**: smoke runtime con backend (alta→toast→listado
      contra API real) — sin Docker/PostgreSQL en este entorno, misma limitación conocida de e2e.

---

## Regla del juego

- Implementar **UNA** tarea, commit, esperar aprobación, siguiente.
- Si una tarea parece > 1h o > ~150 líneas, partirla antes de empezar.
- Dependencia oculta no contemplada → **PARAR** y reportar.
- Ojo a sesiones concurrentes en el worktree: `git add` SOLO de ficheros propios.
