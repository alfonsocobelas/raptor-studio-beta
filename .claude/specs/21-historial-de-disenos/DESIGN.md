# 21 · DESIGN

_Las decisiones de fondo viven en REQUIREMENTS (gate manda, YAGNI: un fichero
por diseño, slug saneado en el borde, activo en localStorage). Aquí solo el
encaje técnico, decidido 2026-08-08._

## Piezas

### Backend — contexto `designs` (hermano de `generate`)

`apps/studio/libs/backend/src/contexts/studio/designs/`:

- `design-files.ts` — capa de ficheros PURA respecto a Nest (testeable sola):
  - raíz `.studio/designs/` bajo el workspace (mismo descubrimiento de raíz que
    usa `generate`); se crea al primer uso.
  - `assertSlug(slug)` — `^[a-z0-9][a-z0-9-]*$` o error; es la ÚNICA puerta a
    una ruta de fichero.
  - `listDesigns()` → `{ slug, appName, updatedAt }[]` leyendo solo lo mínimo
    (appName con un `JSON.parse` del fichero; los cuerpos no viajan en la lista).
  - `readDesign(slug)` → contenido o error limpio si no existe/corrupto (el
    fichero NUNCA se borra por estar corrupto).
  - `writeDesign(slug, design)` — atómica: tmp en el mismo directorio + rename.
  - `deleteDesign(slug)`.
- `studio-designs.controller.ts` — REST bajo `/api/v1/studio/designs`:
  - `GET /` lista · `GET /:slug` cuerpo · `PUT /:slug` guarda · `DELETE /:slug`.
  - `PUT` pasa el diseño por `validateDesign` (el gate del chat, reutilizado):
    400 con el mensaje del gate si no pasa; el fichero previo queda intacto.
  - Renombrar = `PUT` nuevo slug + `DELETE` viejo, orquestado por el cliente
    (YAGNI: sin endpoint propio).
- `studio-designs.module.ts` — registrado en `main.ts` del studio-api.

### Frontend

- `design-history.service.ts` (junto a `design-store.ts`):
  - HTTP crudo contra los endpoints (mismo estilo que `studio-chat.service`).
  - **autosave**: `effect` sobre el diseño completo del store con reposo de
    ~1 s (debounce por `setTimeout`); emite UNA escritura por ráfaga. Estado
    `saving | saved | error` para el indicador.
  - **restauración**: al arrancar, lee el slug activo de `localStorage`
    (`studio.activeDesign`), `GET` y `applyExternal` — el diseño solo entra por
    el gate. Fichero corrupto/no pasa → lienzo vacío + `lastError`, sin tocar
    el fichero.
  - cambiar de diseño = guardar pendiente → cargar nuevo → activo a localStorage.
- Selector en la cabecera del lienzo (zona izquierda, junto al conmutador):
  desplegable con los diseños (`appName · slug`), acciones nuevo/renombrar/
  borrar, y el indicador de guardado (punto que se apaga solo).

## Detalles con intención

- **El slug nace del appName** (`kebab`), editable al renombrar. Dos diseños con
  el mismo appName → sufijo numérico al crear.
- **Qué se persiste**: el `Design` completo del store (appName, resources,
  pages, flows, brief) — la MISMA forma que `applyExternal` acepta. Sin
  traducciones: lo que entra por el gate es lo que se guarda.
- **updatedAt** = mtime del fichero; no viaja dentro del JSON.
- **Sin golden**: no se toca `libs/generators/`.

## Gate de cierre

Los criterios de aceptación de REQUIREMENTS + e2e en navegador: editar →
recargar → restaurado idéntico; y con ello desbloquear la verificación final
de la spec 22 (T07).
