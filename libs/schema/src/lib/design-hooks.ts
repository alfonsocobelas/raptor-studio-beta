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
 * Pocos y con motivo. Si un bloque necesita un hook nuevo, la pregunta es si su cromo no es en
 * realidad uno de los que ya hay con otro nombre.
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
  'app-metric',
  /**
   * La etiqueta de un campo de formulario. Séptimo hook, añadido el 2026-08-27 con motivo
   * medido: la etiqueta salía a 14px en las SEIS pieles porque nadie la alcanzaba — vive dentro
   * de `app-form-field`, con la directiva de la librería (`hlmFieldLabel`), y ninguna piel habla
   * ese selector. Es el elemento que más se repite en un formulario.
   */
  'app-label',
  /**
   * Un control COMPUESTO: el disparador de `app-select` (y cualquier control futuro que no sea
   * un `<input>` a secas). Los contratos `[appinput]`/`[appbtn]` cubren el control simple; este
   * cubre el que la librería monta por dentro, donde el preset no llega. El preset lo viste
   * junto con su `button` descendiente, porque el disparador es el hijo, no el anfitrión.
   */
  'app-control',
  /**
   * Superficie FLOTANTE: el diálogo y el desplegable del lookup. Octavo hook, añadido el
   * 2026-08-27 porque el defecto que lo pide es real y estaba vivo: cabina funde sus paneles con
   * la rejilla (`.app-panel { background: transparent }`) y el diálogo lleva ese mismo hook, así
   * que el formulario salía SIN PAPEL, flotando sobre el velo negro.
   *
   * No es «un app-panel con otro nombre»: un panel de pantalla puede fundirse con el fondo, y
   * uno que flota sobre un velo no puede — necesita papel y contorno propios. Va siempre JUNTO a
   * `app-panel` (la superficie sigue siendo una superficie), detrás en el CSS del preset.
   */
  'app-float'
] as const
