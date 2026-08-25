/**
 * Vocabulario de hooks de piel (spec 67).
 *
 * Por qué existe: los presets sólo sabían vestir selectores de directiva ([hlm*], [app*]) y
 * `table`. Todo el cromo que las plantillas escriben a mano — el panel del calendario, la
 * columna del kanban, la ficha de detalle — quedaba fuera de su alcance, y cada bloque nuevo
 * nacía neutro. Estas cinco clases son el punto de enganche: la plantilla NOMBRA, el preset
 * VISTE. Ninguna de las dos partes conoce a la otra.
 *
 * Se AÑADEN a las utilidades Tailwind que ya lleva la plantilla, nunca las sustituyen: sin
 * preset (piel `actual`) la app se ve exactamente igual que antes de existir el vocabulario.
 *
 * Cinco y no más, a propósito. Si un bloque necesita un hook nuevo, la pregunta es si su cromo
 * no es en realidad uno de estos cinco con otro nombre.
 */
export const DESIGN_HOOKS = [
  /** superficie contenedora de un bloque: fondo, borde, radio, sombra */
  'app-panel',
  /** cabecera de esa superficie: título y controles */
  'app-panel-head',
  /**
   * tira de controles o pie de vista; el preset viste también sus button/input descendientes.
   * Sobre un control SUELTO que no pasa por [appinput]/[appbtn] (el buscador del cronograma o
   * de la galería, escritos con Tailwind a mano), el hook va en el propio control: por eso el
   * preset lista además `input.app-toolbar`. Que esas plantillas deberían usar los contratos
   * neutros es un defecto aparte, anotado como backlog en la spec 67.
   */
  'app-toolbar',
  /** pastilla de dato: evento del calendario, tarjeta del kanban, etiqueta */
  'app-chip',
  /** celda de una rejilla que NO es <table>: día del calendario, fila del cronograma */
  'app-cell',
  /**
   * la cifra protagonista de una tarjeta KPI. Sexto hook, añadido el 2026-08-25 con motivo:
   * cabina vestía el KPI por `.text-sm` y `p.text-2xl` — clases de Tailwind — y suite no lo
   * vestía en absoluto, así que la tira de KPIs salía neutra o casi. Es el único elemento
   * cuyo trabajo entero es un número, y las dos pieles lo quieren tratar distinto.
   */
  'app-metric'
] as const
