# Diseño técnico: Bloque Formulario (estudio + generador)

> Aprobado REQUIREMENTS.md el 2026-08-16. Patrón guía: el bloque `form` imita pieza a pieza el
> camino ya construido del bloque `cards`/galería (bloque → page kind + flag del resource → plantilla
> condicional + ruta), que es el único camino verificado de punta a punta.

---

## El viaje completo (ASCII)

```
ESTUDIO                          FRONTERA                        GENERADOR
-------                          --------                        ---------
paleta: «Formulario»
   │ drag/click
   ▼
DesignBlock {kind:'form',        designPagesToAppPages:          composeApp:
             resource}       ──► block 'form' ──►                page {kind:'form'} ──► nav + ruta
   │ addBlock                    page {kind:'form', resource}       │
   ▼                                                                ▼
DraftResource.form = true    ──► draftToResource:               resource generator:
   │                             ResourceDefinition.form = {}   model.form ──► emite
   ▼                                                            __fileName__-form-page.component
canvas: <studio-canvas-form>                                    rutas: /{ruta}/formulario
(parrilla de la parte A)                                               /{ruta}/formulario/:id
```

---

## 1. Contrato compartido (apps/studio/libs/shared/domain)

### design-page.ts

- `BlockKind` (`:7`) += `'form'`.
- `GENERABLE_BLOCKS` (`:99`) += `'form'` — nace generable, no hay fase «diseño · aún no generable».
- Sin preset de vista nuevo: el bloque se añade a vistas existentes o a una vista en blanco
  (un preset «Solicitud» sería azúcar; YAGNI hasta que se pida).

### draft-resource.ts

- `DraftResource` += `form?: boolean` (mismo rango que `gallery`/`detail`).
- `draftToResource`: `...(draft.form ? { form: {} } : {})` — mismo patrón `gallery: {}`.

### design-to-app.ts

- `designPagesToAppPages`: el bloque `form` cruza como página `{ kind: 'form', resource }`
  (hoy la línea 37 lo descartaría en silencio). Igual que `cards`, deduplicado por `(kind, resource)`.

## 2. Estudio (apps/studio/libs/frontend — design/)

### Derivación de flags en DesignStore

- `addPage` / `addBlock`: bloque `form` → `r.form = true` (junto a las ramas de `cards`/`fields`).
- `removeBlock`: última instancia del bloque → `form = false` (mismo espejo que el resto).

### Componente de canvas

- **Extraer** de `canvas-form-dialog.component.ts` la parrilla de controles (el `@switch` por
  `formControlFor`) a `canvas-form-fields.component.ts` (input: `resource: DraftResource`,
  `row?: Record<string, unknown> | null`). El diálogo de la parte A pasa a consumirla.
- **Nuevo** `canvas-form.component.ts` (bloque): tarjeta con el título de alta
  (`formDialogTitle(draft, 'create')`), la descripción de alta, la parrilla compartida vacía y los
  botones Cancelar/Guardar decorativos. Sin overlay: es un bloque del lienzo, no un diálogo.
- `canvas-page.component.ts` (`@switch` de `:81-132`): caso `form` → `<studio-canvas-form>`.

### Paleta e iconos

- `views-sidebar.component.ts` `BLOCK_TOOLS` (`:70-76`): entrada «Formulario» (icono lucide de
  formulario, p.ej. `lucideClipboardList`) y actualizar el comentario de `:65-69` (ya no promete
  código que nadie escribe).
- `view-icon.ts` y `block-drop.ts` (`blockFor`): rama `form` (con `resource` del contexto, misma
  resolución vista → inspector → primera entidad).

## 3. Esquema del generador (libs/schema)

- `resource-types.ts` (`ResourceDefinition`, zona `:453-459`): `form?: Record<string, never>`
  (objeto vacío como `detail`/`gallery`, reservado para opciones futuras).
- `app-types.ts`: `PageDefinition` admite `kind: 'form'`. `GENERABLE_PAGE_KINDS` hoy no se usa en
  validación — se actualiza por coherencia documental, sin añadirle enforcement en esta spec.
- `define-app.ts` `validatePages`: sin cambios (la unicidad `(kind, resource)` ya cubre `form`).

## 4. Generador de app (libs/generators/src/generators/app)

- `composition.ts` `composeApp`: la página `form` resuelve su `resource` contra el registro y
  acumula el modelo (misma rama genérica que `cards`).
- `app.ts`:
  - `pathOf`: `form` → `${routeOf(model)}/formulario`.
  - `formRoute(model)`: DOS entradas lazy al mismo componente —
    `${ruta}/formulario` (alta) y `${ruta}/formulario/:id` (edición) — insertadas en el bucle de
    `shellSubstitutions` **antes** de `detailRoute` (`:id` va siempre al final o capturaría
    `formulario`; mismo motivo que la nota de `:766-771`).
  - `wantsForm = Boolean(model.form)` en el bucle por modelo (patrón `wantsGallery`).
  - `navItems`: la página `form` entra en el menú como cualquier página, con `navRolesOf` existente.

## 5. Generador de resource (libs/generators/src/generators/resource)

- `resource.ts`: `if (model.form)` → emitir `files-form/` (patrón exacto de `files-detail`,
  `:166-168`).
- `files-form/frontend/__fileName__-form-page.component.ts.template`: página standalone con el
  MISMO formulario reactivo que el diálogo — consume las sustituciones ya calculadas
  (`formSections`, `formValueLines`, validadores, `createLabel`, `dialogEditTitle`,
  descripciones con género). Comportamiento:
  - Sin `:id` → modo alta con el título/descripción de alta.
  - Con `:id` → carga el registro vía el service del recurso (mismo patrón de carga y estado
    loading/error que el detail emitido) y precarga el form.
  - Guardar → `create()`/`update()` del service + toast del canon + `router.navigate` al listado.
  - Error de guardado → el form conserva los datos y muestra el error (patrón del diálogo).
  - Guard de escritura: mismo `canWrite()` que gobierna el diálogo — quien no puede escribir ve
    la página deshabilitada/redirigida según el patrón de acceso existente.
- `files-form/frontend/__fileName__-form-page.component.spec.ts.template` (como el detail).
- `build-substitutions.ts`: solo añadidos mínimos (p.ej. la ruta del listado para el navigate
  post-submit, si no existe ya como sustitución). Toda lógica nueva vive aquí, jamás en la plantilla.

## 6. Estrategia de tests (el orden es el de TASKS)

| Capa | Test |
| --- | --- |
| Contrato estudio | vitest de `design-page`/`draft-resource`/`design-to-app` (flag, expansión, cruce de página) |
| Store | vitest de `design-store` (derivación add/remove, export con `form`) |
| Canvas | los componentes con `input()` no montan en vitest → smoke Playwright nuevo (`tools/smoke-form-block.ts`) + build AOT |
| Schema | vitest de `define-app`/tipos (página `form` válida) |
| Generador | specs existentes de `app`/`composition` ampliados (ruta, orden ante `:id`, nav) + spec del resource generator (emisión condicional) |
| Golden | `/golden-diff`: fixtures actuales con diff VACÍO; se añade `form` a una fixture congelada para baselinar la página nueva (commit propio de re-baseline) |
| Emitido | el spec.template de la página se ejecuta en la app demo generada (runner vitest de apps emitidas) |

## 7. Decisiones técnicas

| Decisión | Opción elegida | Razón |
| --- | --- | --- |
| Ruta de la página | `/{ruta}/formulario` y `/{ruta}/formulario/:id` | No colisiona con la ficha `/{ruta}/:id`; orden de registro antes de `:id` |
| Nav | La vista-formulario entra en el menú | Es una vista diseñada, mismo trato que galería/listado |
| Reutilización emitida | Plantilla nueva, diálogo intacto | Regla de los dos; goldens existentes con diff vacío |
| Reutilización lienzo | Extraer `canvas-form-fields` compartida | Ya hay DOS consumidores reales (diálogo parte A + bloque) |
| Flag del schema | `form?: {}` objeto vacío | Mismo patrón que `detail`/`gallery`; hueco para opciones futuras |
| Gate de kinds | No se añade validación de `BlockKind` en el gate | Hoy ningún kind se valida; endurecerlo es otra tarea (apuntada como riesgo) |

## 8. Riesgos identificados

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| Colisión/orden de rutas (`formulario` vs `:id`) | media | alto | Test explícito del orden en el spec del app generator |
| Kinds desconocidos se descartan en silencio (`design-to-app.ts:37`) | media | medio | El caso `form` queda cubierto por test de cruce; endurecer el gate queda apuntado como mejora futura |
| Extraer `canvas-form-fields` rompe el smoke de la parte A | baja | bajo | Re-correr `smoke-form-dialog.ts` tras la extracción |
| Re-baseline de golden mezclado con otra cosa | media | medio | El re-baseline de la fixture con `form` es SIEMPRE commit propio |
| Sesiones concurrentes en el worktree | media | medio | `git add` solo de ficheros propios; avisar antes de commitear |

---

> ⚠️ **STOP**: no proceder a `TASKS.md` hasta aprobación explícita de este diseño.
