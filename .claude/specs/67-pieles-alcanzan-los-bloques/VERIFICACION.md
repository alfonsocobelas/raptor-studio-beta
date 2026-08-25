# Verificación — TASK-13 (2026-08-25)

## Cómo se hizo

Tres apps generadas con los mismos modelos (`customer,contract,project`) y `--dashboard`, una
por piel, construidas de verdad (`nx build frontend-app`) y servidas estáticas. El API se
simula EN EL NAVEGADOR con `page.route`, así que no hace falta backend ni base de datos: lo que
se comprueba es el CSS que construye Tailwind, que es justo donde vivía el defecto.

Seis pantallas por piel: panel de KPIs, listado, calendario, kanban, cronograma, ficha y
formulario. Cero errores de consola en las tres.

## Medida objetiva (mismas pantallas, tres pieles)

La letra es la MISMA en las tres (decisión de Alfonso, 2026-08-25): la identidad la dan forma,
densidad y cromo. Lo que sí cambia, medido con `getComputedStyle` sobre la app construida:

| esquinas de…            | actual | cabina | suite |
| ----------------------- | ------ | ------ | ----- |
| tarjeta KPI             | 14px   | 0px    | 2px   |
| panel del calendario    | 10px   | 0px    | 2px   |
| columna del kanban      | 10px   | 0px    | 2px   |
| tarjeta del kanban      | 8px    | 0px    | 2px   |
| pastilla de evento      | 6px    | 0px    | 2px   |
| botón primario          | 8px    | 0px    | 2px   |
| buscador / input        | 8px    | 0px    | 2px   |
| badge de estado         | 26px   | 0px    | 2px   |
| diálogo de alta         | 10px   | 0px    | 2px   |
| desplegable (popover)   | 8px    | 0px    | 1.6px |
| ítem activo del menú    | 8px    | 0px    | 1.6px |
| tarjeta KPI (t. oscuro) | 14px   | 0px    | 2px   |

Más: cifras tabulares en cabina y suite (normal en el neutro), cabecera de panel en MAYÚSCULAS
en cabina y banda etiquetada en suite, y fondo de panel transparente en cabina (opaco en las
otras dos), también en tema oscuro.

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
