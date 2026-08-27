# Verificación — TASK-07 (2026-08-27)

## Cómo se hizo

Dos gates, porque la spec toca dos sitios:

1. **El emitido compila fuera del monorepo** — `tools/typecheck-emitted.sh --models=customer,contract
--design=<piel>` para las tres pieles nuevas. Se genera fuera del árbol a propósito: dentro, el
   `node_modules` del acelerador resuelve por hoisting lo que el `package.json` emitido no declara.
   **taller, banco y rotulo: 0 errores.** (Es la clase de defecto que cazó la spec 67, cuando el
   emitido entero no compilaba y ni el golden ni la suite del plugin lo veían.)

2. **El cromo, medido en navegador** — `apps/studio/tools/smoke-69-raptor.ts` conduce el lienzo del
   estudio, que desde la spec 68 inyecta el CSS REAL del preset, y mide con `getComputedStyle`
   las seis pieles bajo el tema «raptor». Doce comprobaciones, todas verdes, cero errores de
   consola. Capturas en `docs/style/smoke-69-<piel>.png`.

## Medida objetiva (mismas pantallas, seis pieles, tema raptor)

|                   | actual | cabina    | **taller** | **banco**         | **rotulo**         | suite            |
| ----------------- | ------ | --------- | ---------- | ----------------- | ------------------ | ---------------- |
| esquina del panel | 14px   | 0px       | 14px       | 6px               | 14px               | 2px              |
| sombra del panel  | sí     | no        | sí         | no                | sí                 | no               |
| cifra del KPI     | 24px   | 38,4px    | 30,4px     | 22,4px            | 35,2px             | 28px             |
| celda de tabla    | 14px   | 12,48px   | 14px       | 12,48px           | 14px               | 14px             |
| cabecera de tabla | normal | VERSALITA | VERSALITA  | VERSALITA + banda | normal + regla 2px | normal + rejilla |
| shell             | raíl   | raíl      | raíl       | raíl + ruta       | **banda**          | banda            |
| CTA dominante     | tinta  | tinta     | tinta      | tinta             | **acento**         | tinta            |

El tema «raptor» pinta `--background: oklch(0.985 0.003 85)` (el papel cálido de la casa) y
`--ring: oklch(0.656 0.197 32)` (el naranja de marca) — leídos del lienzo, no del fichero.

## Defectos que cazó la verificación

1. **El raíl de `taller` no se veía**: `color-mix(--muted 55%, --card)` sobre el papel cálido daba
   un lino indistinguible del fondo. → el raíl toma `var(--muted)` a secas; el de `banco`, un paso
   más oscuro.
2. **Banda de lino suelta dentro de la tarjeta KPI en `banco`**: vestir `.app-panel-head` con fondo
   le ponía una tira a todo lo ancho que se leía como un artefacto. La banda es de la CABECERA DE
   TABLA. → el panel se queda con la versalita y la línea.
3. **El CTA de `rotulo` no llegaba a los botones sin contrato**: la regla hablaba sólo `[hlmbtn]`/
   `[appbtn]`, y gantt, galería, importación y detalle escriben `<button>` a mano (deuda conocida
   del ADR-003). → entra también `.app-shell-main button.bg-primary`.
4. **Afirmación falsa en un comentario del preset**: «la cifra más grande de las cinco pieles». El
   contador de cabina (38,4px) es mayor a propósito. → corregido a «de la familia raptor», y el
   smoke lo mide dentro de la familia.
5. **Dos errores propios de método**, anotados porque volverán: un backtick dentro del literal de
   plantilla del CSS rompió el fichero (y el `ng serve` siguió sirviendo bundle viejo, así que el
   smoke medía CSS de antes), y en el guion el ámbito `.preview-scope` sólo se pegaba al primer
   selector de una lista, midiendo un botón del chrome del estudio.

## Veredicto

Seis pieles y siete temas, y a un metro se distinguen: la familia raptor comparte la paleta de la
casa y se reparte el registro — `taller` cómoda, `banco` de trabajo, `rotulo` de marca. Criterio
de la spec cumplido.

## Pendientes anotados (no incluidos)

- El raíl de «filtros guardados» de la maqueta C se quedó fuera: el emitido no tiene filtros
  guardados y ponerlo habría sido inventar una función para que cuadrara un dibujo.
- La paginación del mock del lienzo no usa `bg-primary`, así que en el lienzo la píldora activa de
  `rotulo` no se ve en el acento (en el emitido sí: es `[appbtn]`). Espejo, no emitido.
- `cabina` y `banco` compiten como pieles densas. Las descripciones las separan, pero si a la
  vista resultan redundantes, retirar `cabina` es una conversación real.
