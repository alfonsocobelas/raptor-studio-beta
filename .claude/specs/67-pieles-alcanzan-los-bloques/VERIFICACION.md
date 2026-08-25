# Verificación — TASK-13 (2026-08-25)

## Cómo se hizo

Tres apps generadas con los mismos modelos (`customer,contract,project`) y `--dashboard`, una
por piel, construidas de verdad (`nx build frontend-app`) y servidas estáticas. El API se
simula EN EL NAVEGADOR con `page.route`, así que no hace falta backend ni base de datos: lo que
se comprueba es el CSS que construye Tailwind, que es justo donde vivía el defecto.

Seis pantallas por piel: panel de KPIs, listado, calendario, kanban, cronograma, ficha y
formulario. Cero errores de consola en las tres.

## Medida objetiva (mismas pantallas, tres pieles)

| Medida (calendario)   | actual         | cabina                 | suite                   |
| --------------------- | -------------- | ---------------------- | ----------------------- |
| radio del panel       | 10px           | 0px                    | 2px                     |
| letra del cuerpo      | -apple-system  | Roboto Condensed       | IBM Plex Sans           |
| letra de los titulares| -apple-system  | JetBrains Mono         | Source Serif 4          |
| letra de las cifras   | -apple-system  | JetBrains Mono         | IBM Plex Sans           |
| cifras tabulares      | normal         | tabular-nums           | tabular-nums            |
| radio de la pastilla  | 6px            | 0px                    | 2px                     |
| cabecera de panel     | sin transformar | MAYÚSCULAS            | banda etiquetada        |

Capturas congeladas en `docs/style/smoke-67-{panel,calendario}-{actual,cabina,suite}.png`.

## Defectos que cazó la verificación (todos arreglados en el generador)

1. **La app emitida no compilaba** (`TS2345` en cada diálogo y página-formulario con un campo
   opcional): `initialValue` se tipaba con el FormValue de salida, cuyos opcionales son
   nullables. Ajeno a esta spec, y el peor defecto posible. → `<Entity>FormInitial`.
2. **La letra no cambiaba en ninguna piel**: nadie consumía `--font-sans`. El bloque del tema
   vive en el `<body>` y la preflight de Tailwind resuelve la suya en `<html>`. La fuente del
   TEMA (spec 20 fase 3) llevaba latente el mismo defecto. → una línea en `@layer base`.
3. **Los KPIs flotaban sin tarjeta**: la card de spartan no tiene borde — su contorno es
   `ring-1` + `shadow-xs`, y el ring es un box-shadow, así que `box-shadow: none` se lo llevaba.
   → quien apaga la sombra devuelve el contorno como borde de 1px.
4. **El `<form>` no es una superficie**: con `app-panel` el borde quedaba pegado a los campos.
   → el formulario conserva sólo cabecera de sección y botonera.
5. **Token huérfano** `--font-mono-cabina` tras renombrarlo a `--font-numeric`, más el test que
   lo habría cazado.

## Veredicto

A un metro, las tres pantallas son tres productos distintos: el neutro es un panel de gestión
sobrio, cabina un centro de operaciones (plano, cuadrado, monospace) y suite un ERP (banda de
marca, pestañas, rejilla, serif). Criterio de la spec cumplido.

Pendiente anotado como backlog, no incluido: gantt, galería, importación y detalle escriben
`<button>`/`<input>` a mano en vez de pasar por `[appbtn]`/`[appinput]` (violan el ADR-003); la
piel los alcanza hoy por descendencia desde `.app-toolbar`.
