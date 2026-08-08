# Spec 30: Vista Gantt / cronograma (fase 5 · A2)

---

## Contexto de negocio

Segunda pieza de la fase 5 (explotar lo latente). El schema ya sabe decir que un recurso vive
en un intervalo temporal (`period: { start, end }`, spec del agregado con Period VO) y ningún
componente lo dibuja. El cronograma pinta cada registro como una barra en el tiempo — vigencia
de contratos, ventanas de proyectos — 100% derivable, sin que el backend cambie.

Como la galería (spec 17), es OTRA proyección del mismo listado: comparte servicio, búsqueda
y paginación. Su PRESENCIA en el schema (`gantt: {}`) es lo que la emite.

## User stories (formato EARS)

- WHEN un modelo declara `gantt` (y tiene `period`) THEN la app emite `<ruta>/cronograma` con
  una entrada de menú «<plural> · cronograma»
- WHEN el usuario abre el cronograma THEN ve una barra por registro de la página, situada
  entre la fecha menor y la mayor de lo cargado, con las divisiones de mes
- WHEN un registro no tiene fechas (period sin valor) THEN su fila aparece con la etiqueta
  «sin fechas» y sin barra
- IF el modelo declara `gantt` sin `period` THEN `defineResource` lo rechaza con un error claro
- IF el modelo no declara `gantt` THEN no se emite ni un byte del cronograma
- WHILE se busca o pagina THEN el eje se recalcula con lo visible (misma lectura del listado)

## Criterios de aceptación

- [ ] `gantt: {}` en un modelo con `period` emite componente + ruta + nav
- [ ] `defineResource` rechaza `gantt` sin `period` y `gantt.title` con campo inexistente
- [ ] La barra se etiqueta con `gantt.title` (por defecto, el primer texto buscable)
- [ ] Un modelo sin `gantt` genera exactamente el mismo código que antes
- [ ] `contract` (period en el oro) estrena la vista vía re-baseline deliberado
- [ ] El emitido compila (typecheck-emitted 0 errores) y e2e con captura en navegador

## Referencias

- Molde: la galería (spec 17) — `files-gallery`, página `cards` en `composeFlat`, ruta
  `<ruta>/galeria` antes de `:id`.
- Sin canon en `docs/referencia` (sap-licenses no tiene cronograma): nuevo territorio
  acordado en el brainstorming de la fase 5 (2026-08-07).

## Fuera de scope (deliberado)

- Drag de barras para editar fechas (el cronograma es lectura; editar es del diálogo).
- Dependencias entre barras, hitos, agrupaciones por campo.
- Zoom/escalas configurables: una escala (min→max de la página) con marcas de mes.
- Cargar TODOS los registros: se pagina como el listado (sin endpoint nuevo).
