# Spec 29: Vista papelera (fase 5 · A1)

> ⚠️ **SPEC RETIRADA (2026-08-27).** La papelera se eliminó del generador por decisión de
> Alfonso: ni endpoints (`/deleted`, `/:id/restore`), ni casos de uso, ni métodos de puerto o
> adapter, ni vista, ni ruta. El borrado suave se mantiene como defecto — archiva y deja de
> verse, pero ya no vuelve. Este documento queda como registro histórico de lo que hubo.

---

## Contexto de negocio

Primera pieza de la fase 5 del ROADMAP (ampliación del catálogo de vistas, brainstorming
2026-08-07). Principio rector: **explotar lo latente** — `softDelete: true` ya emite la columna
`deletedAt` y el borrado lógico en los dos motores, pero ningún usuario puede VER lo borrado ni
recuperarlo. La papelera cierra ese ciclo: listado de registros borrados + acción de restaurar.

Es una vista DERIVADA de un flag existente: el resource-schema no aprende nada nuevo. Si un
modelo declara `softDelete: true` (y su listado tiene borrado), la papelera se emite entera;
si no, no existe ni un byte de ella en el código generado.

## User stories (formato EARS)

- WHEN el usuario borra un registro de un recurso con `softDelete: true` THEN el registro
  desaparece del listado pero aparece en la papelera del recurso
- WHEN el usuario abre `<ruta>/papelera` THEN ve un listado paginado de los registros borrados,
  con las mismas columnas que el listado normal
- WHEN el usuario pulsa «Restaurar» en una fila de la papelera THEN el registro vuelve al
  listado normal y desaparece de la papelera
- IF el recurso NO declara `softDelete` THEN el generador no emite papelera: ni endpoint, ni
  ruta, ni botón, ni métodos de repositorio
- IF el recurso declara `softDelete` pero su lista no tiene `features.delete` THEN tampoco se
  emite (sin borrado no hay nada que restaurar)
- WHILE la papelera carga THEN se muestra el mismo estado de carga del DataTable del listado

## Criterios de aceptación

- [ ] `GET /api/v1/<plural>/deleted` devuelve paginado SOLO lo borrado (ambos motores)
- [ ] `POST /api/v1/<plural>/:id/restore` devuelve 204 y el registro vuelve a `matching`
- [ ] El listado emitido muestra un enlace «Papelera» que navega a `<ruta>/papelera`
- [ ] La papelera lista lo borrado con acción «Restaurar» por fila (sin crear/editar/borrar)
- [ ] Un modelo sin `softDelete` genera EXACTAMENTE el mismo código que antes de esta spec
- [ ] Los tests emitidos cubren el use case de restore y la integración del repositorio
- [ ] Golden diff: license y project (softDelete) incorporan la papelera vía re-baseline
      deliberado; customer y contract (sin softDelete) quedan byte a byte igual

## Referencias (proyecto de referencia y diseño)

- No hay canon en `docs/referencia/` (sap-licenses no tiene papelera): es la primera vista de
  «nuevo territorio» de la fase 5. El patrón de emisión imita al par search/remove existente.
- ROADMAP §Fase 5 (decisiones del brainstorming 2026-08-07).

## Reglas de negocio aplicables

- Restaurar no pide confirmación (es la operación segura; la peligrosa era borrar).
- La papelera no expone `deletedAt` en el DTO: el dominio no conoce ese campo y no se
  contamina por una columna de UI (ver fuera de scope).

## Fuera de scope (deliberado)

- Columna «Borrado el» en la papelera: exigiría subir `deletedAt` del ORM al DTO atravesando
  el dominio. Si un cliente lo pide, se decide entonces cómo (¿DTO enriquecido en el mapper?).
- Borrado definitivo (purga) desde la papelera.
- Vaciado masivo («vaciar papelera») y restauración masiva.
- Exponer `softDelete` en el estudio (drafts): la papelera llega hoy vía modelos escritos a
  mano; el tramo de diseño visual irá en una spec del estudio si se necesita.
- Papelera para hijos de composición (los `licenses` de un `contract` soft-borrados por diff
  del agregado): la papelera es del agregado raíz.
