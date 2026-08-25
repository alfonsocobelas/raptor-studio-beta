/**
 * Presets de diseño (spec 37).
 *
 * Por qué existe esta ranura: cambiar de librería de componentes NO cambia la app. Medido el
 * 2026-08-09 generando la misma app con spartan y con material — 12 ficheros distintos de ~750,
 * y el listado y el diálogo IDÉNTICOS byte a byte, porque las pantallas consumen los contratos
 * neutrales del ADR-003. Lo que sí se percibe al abrir la app es el SHELL (dónde vive la
 * navegación), la DENSIDAD y el cromo. Eso es lo que parametriza un preset.
 *
 * Un preset aporta cuatro cosas y ninguna más:
 *   1. `files`  — su carpeta de override, copiada DESPUÉS del esqueleto (gana su app.component)
 *   2. `fonts`  — sus tipografías, self-hosted: dependencia + @import, como las del tema
 *   3. `tokens` — los tokens DEL TEMA que pisa; se inyectan dentro de `:root .theme-x`
 *   4. `css`    — sus reglas y sus tokens propios, añadidos al final del styles.css del tema
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
  /**
   * Fuentes que trae la piel, self-hosted igual que la del tema: su paquete entra en el
   * package.json de la app y su `@import` en el styles.css. Vacío = la pila del sistema.
   */
  fonts: { package: string; family: string }[]
  /** Declaraciones que pisan tokens del tema, inyectadas dentro de su bloque; '' si ninguna */
  tokens: string
  /** Bloque CSS del preset; '' si se conforma con los tokens del tema */
  css: string
}

/**
 * Tokens del tema que pisa cabina. Los cinco radios se declaran uno a uno a propósito: los del
 * tema son `calc(var(--radius) - 4px)`, y pisar sólo `--radius` los dejaría en -4px.
 */
const CABINA_TOKENS = `  /* preset «cabina»: esquinas vivas en toda la app, no sólo en los componentes vestidos */
  /* y letra condensada: en un centro de operaciones cabe más dato por línea. Los TITULARES
     van en la mono de los datos — lo que distingue una piel de otra a un metro es el
     esqueleto de la letra grande, no cuál de las dos sans neutras se eligió */
  --font-sans: 'Roboto Condensed Variable', 'Roboto Condensed', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'JetBrains Mono Variable', ui-monospace, 'SF Mono', Menlo, monospace;
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

/* los titulares en la mono: un centro de operaciones rotula como una consola */
.app-shell-main h1,
.app-shell-main h2 {
  font-family: var(--font-display);
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

:root {
  --font-numeric: 'JetBrains Mono Variable', ui-monospace, 'SF Mono', Menlo, monospace;
}

/* los NÚMEROS de toda la app en la misma letra (2026-08-25). Antes había mono en la tabla y en
   el KPI y la sans de la app en kanban, calendario, cronograma y detalle: tres letras para lo
   mismo. Un token y UNA regla con todos los sitios donde vive una cifra; un bloque nuevo se
   suma añadiendo su hook a esta lista. */
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
  font-family: var(--font-numeric);
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
.app-panel {
  border-radius: 0;
  box-shadow: none;
  background: transparent;
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
  font-family: var(--font-mono-cabina);
  font-size: 0.74rem;
}

`

/** Tokens del tema que pisa suite: casi recto y con la tipografía del sector. */
const SUITE_TOKENS = `  /* preset «suite»: rectangular y con el stack tipográfico corporativo */
  --radius: 2px;
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 2px;
  --radius-xl: 2px;
  --font-sans: 'IBM Plex Sans Variable', 'IBM Plex Sans', 'Segoe UI', Tahoma, ui-sans-serif, sans-serif;
  --font-display: 'Source Serif 4 Variable', 'Source Serif 4', Georgia, 'Times New Roman', serif;`

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

/* los títulos de pantalla se contienen: un ERP no grita. Y van en serif: es lo que separa
   esta piel de cabina de un vistazo, sin tener que comparar dos sans parecidas. */
.app-shell-main h1,
.app-shell-main h2 {
  font-family: var(--font-display);
}

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
.app-panel {
  border-radius: 2px;
  box-shadow: none;
  border-color: var(--grid-line);
}

.app-panel-head {
  background: var(--grid-head-bg);
  border-color: var(--grid-line);
  font-weight: 600;
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

:root {
  --font-numeric: var(--font-sans);
}

/* los NÚMEROS de toda la app en la misma letra: un ERP no cambia de tipo entre pantallas.
   Aquí no hay monospace — la uniformidad la dan la sans del cuerpo y las cifras tabulares. */
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
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
}

/* la cifra del KPI se contiene, como todo en esta piel, y va en la serif de los titulares */
.app-metric {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
}

`

export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: 'actual',
    label: 'Actual (neutro)',
    description: 'El shell que ya emite el acelerador: barra lateral sobria, sin identidad de sector',
    fonts: [],
    tokens: '',
    css: ''
  },
  {
    id: 'cabina',
    label: 'Cabina (centro de operaciones)',
    description: 'Barra lateral a contraste con contadores, tabla densa y cifras tabulares; tema claro y oscuro',
    files: 'files-design/cabina',
    fonts: [
      { package: '@fontsource-variable/roboto-condensed', family: 'Roboto Condensed Variable' },
      { package: '@fontsource-variable/jetbrains-mono', family: 'JetBrains Mono Variable' }
    ],
    tokens: CABINA_TOKENS,
    css: CABINA_CSS
  },
  {
    id: 'suite',
    label: 'Suite (ERP corporativo)',
    description: 'Banda de marca, pestañas de módulo, migas y rejilla con bordes; patrón reconocible de ERP',
    files: 'files-design/suite',
    fonts: [
      { package: '@fontsource-variable/ibm-plex-sans', family: 'IBM Plex Sans Variable' },
      { package: '@fontsource-variable/source-serif-4', family: 'Source Serif 4 Variable' }
    ],
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
