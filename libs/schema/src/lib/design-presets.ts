/**
 * Presets de diseño (spec 37).
 *
 * Por qué existe esta ranura: cambiar de librería de componentes NO cambia la app. Medido el
 * 2026-08-09 generando la misma app con spartan y con material — 12 ficheros distintos de ~750,
 * y el listado y el diálogo IDÉNTICOS byte a byte, porque las pantallas consumen los contratos
 * neutrales del ADR-003. Lo que sí se percibe al abrir la app es el SHELL (dónde vive la
 * navegación), la DENSIDAD y el cromo. Eso es lo que parametriza un preset.
 *
 * Un preset aporta tres cosas y ninguna más:
 *   1. `files`  — su carpeta de override, copiada DESPUÉS del esqueleto (gana su app.component)
 *   2. `tokens` — los tokens DEL TEMA que pisa; se inyectan dentro de `:root .theme-x`
 *   3. `css`    — sus reglas y sus tokens propios, añadidos al final del styles.css del tema
 *
 * La LETRA no la pone la piel (decisión de Alfonso, 2026-08-25): las tres escriben con la
 * tipografía del tema. La identidad la dan la forma, la densidad y el cromo — y una fuente por
 * piel obligaba además a arrastrar su paquete a cada app.
 *
 * Por qué `tokens` va aparte de `css` (spec 67): el bloque `css` se añade al final del fichero,
 * y ahí `:root { --radius: 0 }` es CSS MUERTO. El tema declara ese mismo token en
 * `:root .theme-x`, que es más específico (0,2,0 contra 0,1,0) y además vive en el <body>, más
 * cerca del contenido. Ningún selector estable lo bate desde fuera — `:root body` es (0,1,1) y
 * `body[class*='theme-']` también. Lo que sí es estable es el orden de declaración dentro del
 * mismo bloque, así que los tokens del preset entran ahí, detrás de los del tema. Se detectó
 * el 2026-08-25: cabina llevaba dos semanas aplanando esquinas a mano, selector por selector,
 * porque su `--radius: 0px` no se aplicaba a nada.
 *
 * No aporta componentes: los emitidos siguen siendo los mismos, con sus mismos tests.
 */
export interface DesignPreset {
  id: string
  label: string
  description: string
  /** Carpeta de override relativa a app/, o undefined si no cambia el esqueleto */
  files?: string
  /** Declaraciones que pisan tokens del tema, inyectadas dentro de su bloque; '' si ninguna */
  tokens: string
  /** Bloque CSS del preset; '' si se conforma con los tokens del tema */
  css: string
}

/**
 * Tokens del tema que pisa cabina. Los cinco radios se declaran uno a uno a propósito: los del
 * tema son `calc(var(--radius) - 4px)`, y pisar sólo `--radius` los dejaría en -4px.
 */
const CABINA_TOKENS = `  /* preset «cabina»: esquinas vivas en toda la app, no sólo en los componentes vestidos.
     La LETRA no la toca: decisión de Alfonso (2026-08-25) — las tres pieles escriben con la
     tipografía del neutro, y la identidad la dan la forma, la densidad y el cromo. */
  --radius: 0px;
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;`

/**
 * Cromo de Cabina. Es un centro de operaciones: barra lateral a contraste y tabla apretada.
 * Los dos temas se declaran a la vez — la piel NO impone modo oscuro, respeta el ThemeService
 * igual que el resto de la app (por eso `.dark` redefine los mismos tokens en vez de fijarlos).
 */
const CABINA_CSS = `
/* ── preset «cabina»: centro de operaciones ─────────────────────────────── */
:root {
  --shell-bg: oklch(0.97 0.004 240);
  --shell-fg: oklch(0.42 0.02 240);
  --shell-fg-strong: oklch(0.22 0.03 240);
  --shell-border: oklch(0.9 0.008 240);
  --shell-active: oklch(0.93 0.012 240);
  --row-height: 1.75rem;
  --table-font-size: 0.78rem;
}

.dark {
  --shell-bg: oklch(0.17 0.012 240);
  --shell-fg: oklch(0.68 0.02 240);
  --shell-fg-strong: oklch(0.96 0.008 240);
  --shell-border: oklch(0.26 0.016 240);
  --shell-active: oklch(0.23 0.02 240);
}

/* Sin @layer a propósito: el CSS sin capa gana a las utilidades de Tailwind, que viven en
   @layer utilities. Dentro de @layer components estas reglas perdían contra el padding del
   DataTable y la tabla salía con la densidad de siempre (visto en navegador, 2026-08-10). */
.app-shell-main table td {
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
  font-size: var(--table-font-size);
}

.app-shell-main table th {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-shell-main table {
  font-variant-numeric: tabular-nums;
}

/* ── componentes y tipografía (profundización 2026-08-10): shell+densidad seguía dejando
   los presets indistinguibles a un metro de distancia. Cabina es instrumentación: esquinas
   vivas, texto condensado y cifras tabulares en toda la pantalla — vía tokens y selectores
   de directiva ([hlmbtn], [hlmbadge]…), nunca tocando los componentes emitidos. */
.app-shell-main {
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

/* los titulares se aprietan, pero con la letra de la app */
.app-shell-main h1,
.app-shell-main h2 {
  letter-spacing: -0.02em;
}

/* el badge de la maqueta skindemo: etiqueta OUTLINE uppercase con color semántico por
   variante — fondo fuera, borde al color del texto. El hue por variante lo fija el preset
   (verde=default, ámbar=secondary, azul=outline, rojo=destructive) en los dos temas.

   Cada selector de directiva lleva su contrato neutro al lado (spec 67): [hlm*] sólo existe
   en data-table y kpi-card; el resto de las pantallas emite [appbtn]/[appinput]/[appbadge],
   y sin ellos la piel se quedaba en las tablas. Las clases de variante coinciden en los dos
   contratos (bg-primary, bg-secondary, bg-destructive), así que el par comparte regla. */
[hlmbadge],
[appbadge] {
  border-radius: 0;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: transparent !important;
  border: 1px solid currentColor !important;
}

[hlmbadge].bg-primary,
[appbadge].bg-primary {
  color: oklch(0.45 0.12 160);
}

[hlmbadge].bg-secondary,
[appbadge].bg-secondary {
  color: oklch(0.5 0.12 75);
}

[hlmbadge].bg-destructive,
[appbadge].bg-destructive {
  color: oklch(0.5 0.19 25);
}

[hlmbadge]:not(.bg-primary):not(.bg-secondary):not(.bg-destructive),
[appbadge]:not(.bg-primary):not(.bg-secondary):not(.bg-destructive) {
  color: oklch(0.45 0.09 250);
}

.dark [hlmbadge].bg-primary,
.dark [appbadge].bg-primary {
  color: oklch(0.78 0.14 160);
}

.dark [hlmbadge].bg-secondary,
.dark [appbadge].bg-secondary {
  color: oklch(0.8 0.13 80);
}

.dark [hlmbadge].bg-destructive,
.dark [appbadge].bg-destructive {
  color: oklch(0.72 0.17 25);
}

.dark [hlmbadge]:not(.bg-primary):not(.bg-secondary):not(.bg-destructive),
.dark [appbadge]:not(.bg-primary):not(.bg-secondary):not(.bg-destructive) {
  color: oklch(0.75 0.1 250);
}

/* los NÚMEROS de toda la app tratados igual (2026-08-25). Antes había monospace en la tabla y
   en el KPI y la sans de la app en kanban, calendario, cronograma y detalle: tres letras para lo
   mismo. Ya no hay letra propia — la de la app en todas partes — pero sí cifras TABULARES en
   todos los sitios donde vive un número; un bloque nuevo se suma añadiendo su hook a la lista. */
.app-metric,
.app-cell,
.app-chip,
.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar,
.app-shell-main table td.text-right,
[hlminput],
[appinput] {
  font-variant-numeric: tabular-nums;
}

.app-shell-main table td.text-right {
  font-size: 0.74rem;
}

[hlminput],
[appinput] {
  font-size: 0.78rem;
}

/* botones e inputs a la altura de la fila: un centro de operaciones no desperdicia alto */
[hlmbtn],
[appbtn] {
  border-radius: 0;
  box-shadow: none;
}

[hlminput],
[appinput] {
  border-radius: 0;
}

/* la tira de KPIs de la maqueta: panel PLANO fundido con la rejilla y cifra enorme. La viste
   .app-panel/.app-panel-head/.app-metric como cualquier otra superficie — antes iba por
   [hlmcard] .text-sm y p.text-2xl, clases de Tailwind: alcanzaba de paso al sufijo del valor
   y no alcanzaba nada en suite, que no repetía esos selectores. */
.app-metric {
  font-size: 2.4rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
/* ── los hooks de piel (spec 67) ─────────────────────────────────────────────
   Lo que las plantillas escriben a mano — el panel del calendario, la columna del kanban, la
   ficha de detalle — no lleva directiva ninguna, así que ningún selector del preset lo
   alcanzaba: la app era idéntica en las tres pieles salvo la tabla. Cabina lo trata como
   instrumentación: superficies planas fundidas con la rejilla y datos en monospace.
   El color sale de los tokens --shell-*, que ya tienen su valor en claro y en oscuro; por eso
   estas reglas no necesitan gemelas bajo .dark. */
/* La tarjeta de spartan no lleva borde: su contorno es ring-1 + shadow-xs, y en Tailwind el ring
   es un box-shadow. Apagar la sombra deja la superficie SIN contorno (KPIs flotando, visto en
   navegador el 2026-08-25), así que quien la apaga devuelve el contorno como borde. No se toca
   border-style: la zona de arrastre de adjuntos es discontinua a propósito. */
.app-panel {
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  border-width: 1px;
  border-color: var(--shell-border);
}

.app-panel-head {
  border-color: var(--shell-border);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--shell-fg);
}

/* El DIÁLOGO también lleva app-panel (es una superficie), y con el fondo transparente de arriba
   salía sin papel: el formulario flotaba sobre el velo negro. Medido en navegador el 2026-08-27.
   El diálogo recupera su papel; lo que se funde con la rejilla son los paneles de pantalla. */
app-dialog .app-panel {
  background: var(--card);
}

/* La etiqueta del campo, en versalitas como el resto del cromo de instrumentación (spec 69:
   hasta hoy medía 14px en las seis pieles porque nadie la alcanzaba). */
.app-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--shell-fg);
}

/* El control compuesto (disparador del select) a la altura de la fila, como los demás controles.
   Se viste junto con su button descendiente: el disparador es el hijo, no el anfitrión. */
.app-control,
.app-control button {
  border-radius: 0;
  box-shadow: none;
  font-size: 0.78rem;
}

.app-cell {
  border-color: var(--shell-border);
  font-size: 0.74rem;
}

.app-chip {
  border-radius: 0;
  box-shadow: none;
  border-color: var(--shell-border);
  font-size: 0.7rem;
  letter-spacing: 0.03em;
}

/* el toolbar viste también sus controles crudos: gantt, galería, importación y detalle
   escriben <button>/<input> sin pasar por [appbtn]/[appinput], y el buscador suelto lleva el
   hook en sí mismo (de ahí input.app-toolbar) */
.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar {
  border-radius: 0;
  box-shadow: none;
  font-size: 0.74rem;
}

`

/** Tokens del tema que pisa suite: casi recto y con la tipografía del sector. */
const SUITE_TOKENS = `  /* preset «suite»: rectangular y con el stack tipográfico corporativo */
  --radius: 2px;
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 2px;
  --radius-xl: 2px;`

/**
 * Cromo de Suite. Banda de marca corporativa y pestañas de módulo: el patrón que reconoce sin
 * explicación quien viene de un ERP. Monotema a propósito — ese sector no espera modo oscuro —
 * pero los tokens se declaran igual, así que añadir `.dark` después no exige rediseñar nada.
 */
const SUITE_CSS = `
/* ── preset «suite»: banda corporativa y pestañas de módulo ──────────────── */
:root {
  --banner-bg: oklch(0.32 0.07 250);
  --banner-fg: oklch(0.98 0.005 250);
  --banner-fg-dim: oklch(0.82 0.03 250);
  --module-bar-bg: oklch(1 0 0);
  --module-active: oklch(0.32 0.07 250);
  --grid-line: oklch(0.86 0.012 250);
  --grid-head-bg: oklch(0.91 0.014 250);
}

.dark {
  --banner-bg: oklch(0.24 0.05 250);
  --banner-fg: oklch(0.96 0.005 250);
  --banner-fg-dim: oklch(0.74 0.025 250);
  --module-bar-bg: oklch(0.2 0.012 250);
  --module-active: oklch(0.72 0.09 250);
  --grid-line: oklch(0.32 0.014 250);
  --grid-head-bg: oklch(0.26 0.016 250);
}

/* Sin @layer, misma razón que en cabina: dentro de una capa las utilidades ganarían. */
.app-shell-main table th,
.app-shell-main table td {
  border-right: 1px solid var(--grid-line);
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}

.app-shell-main table th:last-child,
.app-shell-main table td:last-child {
  border-right: 0;
}

.app-shell-main table th {
  background: var(--grid-head-bg);
}

/* ── componentes y tipografía (profundización 2026-08-10): suite es un ERP — rectangular,
   corporativo y sin sombras. Tokens y selectores de directiva, nunca componentes. */

/* los títulos de pantalla se contienen: un ERP no grita */
.app-shell-main h1 {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0;
}

/* botones rectangulares, planos y con borde: nada flota en un ERP */
[hlmbtn],
[appbtn] {
  border-radius: 2px;
  box-shadow: none;
}

[hlminput],
[appinput] {
  border-radius: 2px;
}

/* el badge es una etiqueta de estado rectangular, no una píldora */
[hlmbadge],
[appbadge] {
  border-radius: 2px;
  font-weight: 500;
}

/* la tarjeta KPI se cuadra y toma la cabecera etiquetada de la rejilla */
[hlmcard] {
  border-radius: 2px;
  box-shadow: none;
  border-color: var(--grid-line);
}
/* ── los hooks de piel (spec 67) ─────────────────────────────────────────────
   Mismo motivo que en cabina: el cromo escrito a mano en las plantillas necesita un punto de
   enganche. Suite lo trata como un ERP: casi recto, sin sombras, con la cabecera etiquetada y
   los bordes de la rejilla. Los colores salen de --grid-*, declarados en los dos temas. */
/* mismo motivo que en cabina: el contorno de la tarjeta es un ring, no un borde */
.app-panel {
  border-radius: 2px;
  box-shadow: none;
  border-width: 1px;
  border-color: var(--grid-line);
}

.app-panel-head {
  background: var(--grid-head-bg);
  border-color: var(--grid-line);
  font-weight: 600;
}

/* La cabecera etiquetada es de las superficies de PANTALLA: en el diálogo, una banda gris sobre
   el título se leía como un error. El diálogo se queda con el título a secas. */
app-dialog .app-panel-head,
app-confirm-dialog .app-panel-head {
  background: transparent;
}

/* La etiqueta del campo: en un ERP el formulario es la pantalla principal, así que la etiqueta
   pesa y se contiene (spec 69). */
.app-label {
  font-size: 0.78rem;
  font-weight: 600;
}

/* El control compuesto (disparador del select), rectangular y plano como el resto */
.app-control,
.app-control button {
  border-radius: 2px;
  box-shadow: none;
}

.app-cell {
  border-color: var(--grid-line);
}

.app-chip {
  border-radius: 2px;
  border-color: var(--grid-line);
  font-weight: 500;
}

/* como en cabina, el toolbar arrastra a sus controles crudos y al buscador suelto */
.app-toolbar button,
.app-toolbar input,
input.app-toolbar {
  border-radius: 2px;
  box-shadow: none;
}

.app-toolbar {
  border-color: var(--grid-line);
}

/* los NÚMEROS de toda la app tratados igual: un ERP no cambia de tipo entre pantallas. La letra
   es la de la app; la uniformidad la dan las cifras tabulares. */
.app-metric,
.app-cell,
.app-chip,
.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar,
.app-shell-main table td.text-right,
[hlminput],
[appinput] {
  font-variant-numeric: tabular-nums;
}

/* la cifra del KPI se contiene, como todo en esta piel */
.app-metric {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
}

`

/**
 * ── La familia «raptor» (spec 69) ─────────────────────────────────────────────────────────────
 *
 * Tres pieles con la identidad de la casa, maquetadas y aprobadas el 2026-08-27 sobre el listado
 * real emitido. Se separan de `cabina` y `suite` en dos criterios, y los dos son deliberados:
 *
 *   1. Sus superficies se DERIVAN de los tokens del tema (`color-mix` sobre --muted/--card/
 *      --border) en vez de fijar oklch a mano. Así `taller` con el tema «océano» sigue siendo
 *      coherente en vez de arrastrar un lino cálido a una app azul, y no hacen falta gemelas
 *      bajo `.dark`: los tokens del tema ya traen su valor de noche.
 *   2. El acento es `--ring`. El naranja aparece porque lo pone el tema «raptor», no porque la
 *      piel lo escriba: ninguna de las tres tiene un hex de marca dentro.
 *
 * Y por eso sus tokens van en `tokens` (dentro del bloque del tema) y no en `css`: en `:root`
 * suelto, `var(--muted)` NO resuelve —el tema se declara sobre el `<body>`—, el color-mix queda
 * inválido y la superficie cae a transparente. Es la misma trampa que costó la spec 67.
 */
const TALLER_TOKENS = `  /* preset «taller»: el marco del propio estudio — raíl de lino sobre papel cálido.
     Todo derivado del tema; el acento es el del tema, no un naranja escrito a mano. */
  --shell-bg: var(--muted);
  --shell-fg: var(--muted-foreground);
  --shell-fg-strong: var(--foreground);
  --shell-border: color-mix(in oklab, var(--border) 80%, var(--foreground) 8%);
  --shell-active: var(--card);
  --shell-accent: var(--ring);`

/**
 * Cromo de Taller. Es la piel CÓMODA de la familia: la densidad del neutro, las esquinas del
 * tema y una versalita ancha en cada cabecera. No apaga sombras ni aplana esquinas —eso es
 * cabina—; lo que la distingue es el raíl de lino, el aire y la letra de las cabeceras.
 */
const TALLER_CSS = `
/* ── preset «taller»: el marco del estudio ──────────────────────────────── */
/* Sin @layer, como el resto de los presets: dentro de una capa estas reglas perderían contra
   las utilidades de Tailwind, que es de donde sale el padding del DataTable. */
.app-shell-main {
  background: var(--background);
}

/* la cabecera de la tabla, en versalitas anchas y apagadas: la seña de la casa */
.app-shell-main table th {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

.app-shell-main table td {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* ── los contratos neutros y sus gemelos hlm (spec 67) ───────────────────── */
/* [hlm*] sólo existe en data-table y kpi-card; el resto de las pantallas emite
   [appbtn]/[appinput]/[appbadge], y sin ellos la piel se queda en las tablas. */
[hlmbtn],
[appbtn] {
  border-radius: 8px;
  font-weight: 600;
}

[hlminput],
[appinput] {
  border-radius: 8px;
}

/* la etiqueta de estado es una píldora con fondo lavado, no un rectángulo */
[hlmbadge],
[appbadge] {
  border-radius: 999px;
  font-weight: 600;
}

/* ── los hooks de piel (spec 67) ─────────────────────────────────────────── */
/* El cromo que las plantillas escriben a mano —panel del calendario, columna del kanban, ficha
   de detalle— no lleva directiva ninguna: sólo lo alcanza el hook. Los colores salen de los
   tokens del tema y de los --shell-*, que ya tienen valor en claro y en oscuro. */
.app-panel {
  border-radius: 14px;
  border-color: var(--shell-border);
}

.app-panel-head {
  border-color: var(--shell-border);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

.app-cell {
  border-color: var(--shell-border);
}

.app-chip {
  border-radius: 999px;
  border-color: var(--shell-border);
  font-weight: 600;
}

/* La etiqueta del campo, en la versalita ancha de la casa (spec 69) */
.app-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

/* El control compuesto (disparador del select): mismas esquinas que el resto de los controles.
   Se viste junto con su button descendiente: el disparador es el hijo, no el anfitrión. */
.app-control,
.app-control button {
  border-radius: 8px;
}

/* el toolbar viste también sus controles crudos: gantt, galería, importación y detalle
   escriben <button>/<input> sin pasar por [appbtn]/[appinput], y el buscador suelto lleva el
   hook en sí mismo (de ahí input.app-toolbar) */
.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar {
  border-radius: 8px;
}

/* la cifra del KPI manda en la tarjeta, con la etiqueta en versalita encima */
.app-metric {
  font-size: 1.9rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* los NÚMEROS de toda la app tratados igual: la letra es la del tema, la uniformidad la dan
   las cifras tabulares. Un bloque nuevo se suma añadiendo su hook a esta lista. */
.app-metric,
.app-cell,
.app-chip,
.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar,
.app-shell-main table td.text-right,
[hlminput],
[appinput] {
  font-variant-numeric: tabular-nums;
}
`

/**
 * Tokens de Banco. Los cinco radios uno a uno, por el mismo motivo que en cabina: los del tema
 * son `calc(var(--radius) - 4px)` y pisar sólo `--radius` los dejaría en negativo.
 */
const BANCO_TOKENS = `  /* preset «banco»: banco de trabajo — la misma casa que taller, apretada.
     Superficies derivadas del tema (ver la nota de la familia raptor) y esquinas casi rectas. */
  --radius: 6px;
  --radius-sm: 6px;
  --radius-md: 6px;
  --radius-lg: 6px;
  --radius-xl: 6px;
  --shell-bg: color-mix(in oklab, var(--muted) 92%, var(--foreground) 8%);
  --shell-fg: var(--muted-foreground);
  --shell-fg-strong: var(--foreground);
  --shell-border: color-mix(in oklab, var(--border) 70%, var(--foreground) 12%);
  --shell-active: color-mix(in oklab, var(--muted) 100%, var(--foreground) 6%);
  --shell-accent: var(--ring);`

/**
 * Cromo de Banco. Es la piel DENSA de la familia: diez filas donde taller pone seis, KPIs
 * fundidos sin tarjeta y etiquetas de estado en contorno. Se diferencia de cabina en que NO
 * invierte el raíl a contraste ni cambia de letra: es la misma casa, apretada.
 */
const BANCO_CSS = `
/* ── preset «banco»: banco de trabajo ───────────────────────────────────── */
/* Sin @layer: dentro de una capa estas reglas perderían contra las utilidades de Tailwind. */
.app-shell-main {
  font-size: 0.8rem;
}

/* la cabecera de la tabla es una BANDA de lino con versalitas, no una fila más */
.app-shell-main table th {
  background: var(--shell-bg);
  border-bottom: 1px solid var(--shell-border);
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--shell-fg);
}

.app-shell-main table td {
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
  font-size: 0.78rem;
}

/* ── los contratos neutros y sus gemelos hlm (spec 67) ───────────────────── */
[hlmbtn],
[appbtn] {
  border-radius: 6px;
  box-shadow: none;
  font-size: 0.75rem;
}

[hlminput],
[appinput] {
  border-radius: 6px;
  font-size: 0.78rem;
}

/* la etiqueta de estado es un contorno rectangular: fondo fuera, borde al color del texto.
   El color lo trae la variante desde el contrato, así que aquí sólo se cambia la forma. */
[hlmbadge],
[appbadge] {
  border-radius: 4px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: transparent !important;
  border: 1px solid currentColor !important;
}

/* ── los hooks de piel (spec 67) ─────────────────────────────────────────── */
/* La tarjeta de spartan no lleva borde: su contorno es ring-1 + shadow-xs, y en Tailwind el ring
   es un box-shadow. Quien apaga la sombra devuelve el contorno como borde (visto en navegador el
   2026-08-25: los KPIs salían flotando). */
.app-panel {
  border-radius: 6px;
  box-shadow: none;
  border-width: 1px;
  border-color: var(--shell-border);
}

/* Sin fondo a propósito: la banda de lino es de la CABECERA DE TABLA. Vestida aquí, la etiqueta
   de la tarjeta KPI salía con una tira de lino a todo lo ancho que se leía como un artefacto
   (visto en navegador el 2026-08-27). Lo que la piel le da al panel es la versalita y la línea. */
.app-panel-head {
  border-color: var(--shell-border);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--shell-fg);
}

.app-cell {
  border-color: var(--shell-border);
  font-size: 0.78rem;
}

.app-chip {
  border-radius: 4px;
  box-shadow: none;
  border-color: var(--shell-border);
  font-size: 0.7rem;
}

/* La etiqueta del campo, apretada y en versalita: en un banco de trabajo el formulario también
   es denso (spec 69) */
.app-label {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--shell-fg);
}

/* El control compuesto (disparador del select), a la altura de los demás controles */
.app-control,
.app-control button {
  border-radius: 6px;
  box-shadow: none;
  font-size: 0.78rem;
}

/* Como en cabina: el diálogo es una superficie, pero sin sombra se queda sin contorno, así que
   mantiene su borde (el de .app-panel) y recupera el papel de la tarjeta. */
app-dialog .app-panel {
  background: var(--card);
}

.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar {
  border-radius: 6px;
  box-shadow: none;
  font-size: 0.75rem;
}

/* la cifra se contiene: en un banco de trabajo caben cuatro en una tira, no tres en tarjetas */
.app-metric {
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

/* los NÚMEROS de toda la app tratados igual: cifras tabulares en todos los sitios donde vive un
   número. Un bloque nuevo se suma añadiendo su hook a esta lista. */
.app-metric,
.app-cell,
.app-chip,
.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar,
.app-shell-main table td.text-right,
[hlminput],
[appinput] {
  font-variant-numeric: tabular-nums;
}
`

/**
 * Tokens de Rótulo. Aquí está la ÚNICA excepción declarada de la familia raptor: la banda es de
 * tinta y tiene que seguir siendo de tinta de noche, y ningún token del tema es oscuro en los dos
 * modos (`--foreground` se invierte a papel). Así que la banda va en oklch literal, con su gemela
 * bajo `.dark`, como hacen cabina y suite. El ACENTO sí sale del tema: el naranja aparece cuando
 * se elige el tema «raptor», y con otro tema el logotipo y el CTA toman el de ese tema.
 */
const ROTULO_TOKENS = `  /* preset «rotulo»: la marca al frente — banda de tinta, navegación dentro de la banda y el
     acento del tema en el logotipo y en el CTA. Es la piel holgada de la familia. */
  --shell-accent: var(--ring);
  --shell-border: color-mix(in oklab, var(--border) 85%, var(--foreground) 5%);`

/**
 * Cromo de Rótulo. Holgada y de marca: la banda pesa arriba, los titulares y las cifras respiran,
 * y el CTA se va al acento (la única de la familia que lo hace: taller y banco lo dejan en
 * tinta). Los dos temas se declaran a la vez — la piel no impone modo oscuro.
 */
const ROTULO_CSS = `
/* ── preset «rotulo»: la marca al frente ────────────────────────────────── */
:root {
  --banner-bg: oklch(0.215 0.005 68);
  --banner-fg: oklch(0.985 0.003 85);
  --banner-fg-dim: oklch(0.78 0.012 70);
  --banner-active: oklch(1 0 0 / 10%);
}

.dark {
  --banner-bg: oklch(0.17 0.004 68);
  --banner-fg: oklch(0.985 0.003 85);
  --banner-fg-dim: oklch(0.74 0.012 70);
  --banner-active: oklch(1 0 0 / 12%);
}

/* Sin @layer, como el resto de los presets: dentro de una capa perderían contra las utilidades. */
.app-shell-main {
  background: var(--background);
}

/* la cabecera de la tabla se subraya con una regla gruesa en tinta: la mesa del rótulo */
.app-shell-main table th {
  border-bottom: 2px solid var(--foreground);
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
  font-weight: 600;
}

.app-shell-main table td {
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
}

/* los titulares de pantalla respiran: es la piel que grita */
.app-shell-main h1 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

/* ── los contratos neutros y sus gemelos hlm (spec 67) ───────────────────── */
/* El CTA dominante SE VA AL ACENTO, al contrario que en taller y banco. Es lo que hace a esta
   piel «de marca», y también su riesgo: el acento compite con los colores de estado.
   El button.bg-primary suelto entra a propósito: gantt, galería, importación y detalle
   escriben botones a mano sin pasar por el contrato (deuda conocida del ADR-003), y sin él el
   CTA de esas pantallas se quedaba en tinta mientras el resto iba al acento. */
[hlmbtn].bg-primary,
[appbtn].bg-primary,
.app-shell-main button.bg-primary {
  background: var(--shell-accent);
  color: var(--banner-fg);
}

[hlmbtn],
[appbtn] {
  border-radius: 8px;
  font-weight: 600;
}

[hlminput],
[appinput] {
  border-radius: 8px;
}

[hlmbadge],
[appbadge] {
  border-radius: 999px;
  font-weight: 600;
}

/* ── los hooks de piel (spec 67) ─────────────────────────────────────────── */
.app-panel {
  border-radius: 14px;
  border-color: var(--shell-border);
}

.app-panel-head {
  border-color: var(--shell-border);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

.app-cell {
  border-color: var(--shell-border);
}

.app-chip {
  border-radius: 999px;
  border-color: var(--shell-border);
  font-weight: 600;
}

/* La etiqueta del campo: versalita marcada, como la de sección (spec 69) */
.app-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

/* El control compuesto (disparador del select), con las esquinas del resto */
.app-control,
.app-control button {
  border-radius: 8px;
}

.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar {
  border-radius: 8px;
}

/* la cifra es el titular del panel: la más grande de la familia raptor. No la más grande de
   TODAS —el contador de cabina es mayor a propósito, es instrumentación— y así lo mide el smoke. */
.app-metric {
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

/* los NÚMEROS de toda la app tratados igual: cifras tabulares en todos los sitios donde vive un
   número. Un bloque nuevo se suma añadiendo su hook a esta lista. */
.app-metric,
.app-cell,
.app-chip,
.app-toolbar,
.app-toolbar button,
.app-toolbar input,
input.app-toolbar,
.app-shell-main table td.text-right,
[hlminput],
[appinput] {
  font-variant-numeric: tabular-nums;
}
`

export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: 'actual',
    label: 'Actual (neutro)',
    description: 'El shell que ya emite el acelerador: barra lateral sobria, sin identidad de sector',
    tokens: '',
    css: ''
  },
  {
    id: 'cabina',
    label: 'Cabina (centro de operaciones)',
    description: 'Barra lateral a contraste con contadores, tabla densa y cifras tabulares; tema claro y oscuro',
    files: 'files-design/cabina',
    tokens: CABINA_TOKENS,
    css: CABINA_CSS
  },
  {
    id: 'taller',
    label: 'Taller (raptor)',
    description: 'El marco del propio estudio: raíl de lino, versalitas anchas y el acento del tema; densidad cómoda',
    files: 'files-design/taller',
    tokens: TALLER_TOKENS,
    css: TALLER_CSS
  },
  {
    id: 'banco',
    label: 'Banco de trabajo (raptor)',
    description:
      'La misma casa que taller, apretada: filas densas, cabecera en banda de lino, KPIs fundidos y etiquetas en contorno',
    files: 'files-design/banco',
    tokens: BANCO_TOKENS,
    css: BANCO_CSS
  },
  {
    id: 'rotulo',
    label: 'Rótulo (raptor)',
    description:
      'La marca al frente: banda de tinta con la navegación dentro, titulares y cifras holgados y el CTA en el acento del tema',
    files: 'files-design/rotulo',
    tokens: ROTULO_TOKENS,
    css: ROTULO_CSS
  },
  {
    id: 'suite',
    label: 'Suite (ERP corporativo)',
    description: 'Banda de marca, pestañas de módulo, migas y rejilla con bordes; patrón reconocible de ERP',
    files: 'files-design/suite',
    tokens: SUITE_TOKENS,
    css: SUITE_CSS
  }
]

export const DEFAULT_DESIGN = 'actual'

/** El preset elegido, validado. Un id desconocido rompe ANTES de emitir un solo fichero. */
export function selectDesign(value: string | undefined): DesignPreset {
  const id = value ?? DEFAULT_DESIGN
  const preset = DESIGN_PRESETS.find(p => p.id === id)
  if (!preset) {
    throw new Error(`Unknown design '${id}'. Available: ${DESIGN_PRESETS.map(p => p.id).join(', ')}`)
  }
  return preset
}
