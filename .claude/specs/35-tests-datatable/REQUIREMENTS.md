# Spec 35: Tests del DataTable emitido

> Rescate nº 4 (parcial) del backlog post-auditoría: el runner vitest ya se emite y corre
> (verificado en `iamdemo`: `npm run test:front` en verde), pero el **DataTable — el componente
> más complejo del kernel (~1.000 líneas)** viaja sin un solo test. La referencia tiene 887
> líneas de specs que nunca se rescataron, y el DataTable emitido ha evolucionado por encima
> del canon (server-side, badges/valueMap, acciones ocultables por fila, columnas sticky).

## Contexto de negocio

Cada app generada apoya TODOS sus listados en el DataTable compartido. Hoy una regresión ahí
(un filtro que deja de filtrar, la paginación server-side que pierde la página) solo la vería
una demo manual. La suite emitida convierte cada app generada en su propio arnés.

## User stories (formato EARS)

- WHEN se genera una app (piel spartan) THEN `libs/frontend/src/shared/components/data-table.spec.ts`
  se emite y `npm run test:front` la pasa en verde sin tocar nada
- IF la piel es material THEN no se emite este spec (la piel material está congelada y su DOM
  difiere; se rescatará con su propia suite si la piel se descongela)
- WHILE los tests corren THEN no tocan red ni backend: datos en memoria, modo cliente y
  servidor simulados con inputs/outputs del componente

## Criterios de aceptación

- [ ] Cobertura de: renderizado de columnas/filas, búsqueda local, filtros por columna, orden,
      paginación cliente, modo server-side (eventos page/pageSize/sort/search), badges con
      badgeMap, valueMap, booleanos Sí/No, acciones (click y `hidden` por fila), export CSV
      (client-side), estado vacío
- [ ] La suite emitida pasa en una app real fuera del árbol (demo)
- [ ] Golden: re-baseline deliberado con el spec nuevo en la fixture `app`
- [ ] La suite del plugin fija que el spec se emite con spartan y no con material

## Referencias

- `docs/referencia/libs/frontend/src/shared/components/data-table.spec.ts` (887 líneas, canon de estilo)
- Emitido: `frontend-kernel/files-ui/spartan/shared/components/data-table.ts.template`

## Fuera de scope (deliberado)

- Suite para la piel material (congelada por decisión 2026-07-31)
- Tests e2e en navegador del DataTable (los cubren las demos por spec)
- Specs de los demás componentes del kernel (KpiCard, dialogs…): otra tanda si esta funciona
