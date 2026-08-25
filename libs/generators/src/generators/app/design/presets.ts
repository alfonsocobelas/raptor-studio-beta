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
const CABINA_TOKENS = `  /* preset «cabina»: esquinas vivas en toda la app, no sólo en los componentes vestidos */
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

/* el badge de la maqueta skindemo: etiqueta OUTLINE uppercase con color semántico por
   variante — fondo fuera, borde al color del texto. El hue por variante lo fija el preset
   (verde=default, ámbar=secondary, azul=outline, rojo=destructive) en los dos temas. */
[hlmbadge] {
  border-radius: 0;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: transparent !important;
  border: 1px solid currentColor !important;
}

[hlmbadge].bg-primary {
  color: oklch(0.45 0.12 160);
}

[hlmbadge].bg-secondary {
  color: oklch(0.5 0.12 75);
}

[hlmbadge].bg-destructive {
  color: oklch(0.5 0.19 25);
}

[hlmbadge]:not(.bg-primary):not(.bg-secondary):not(.bg-destructive) {
  color: oklch(0.45 0.09 250);
}

.dark [hlmbadge].bg-primary {
  color: oklch(0.78 0.14 160);
}

.dark [hlmbadge].bg-secondary {
  color: oklch(0.8 0.13 80);
}

.dark [hlmbadge].bg-destructive {
  color: oklch(0.72 0.17 25);
}

.dark [hlmbadge]:not(.bg-primary):not(.bg-secondary):not(.bg-destructive) {
  color: oklch(0.75 0.1 250);
}

/* los DATOS van en monospace, como en la maqueta: cifras de tabla, buscador y paginación */
:root {
  --font-mono-cabina: ui-monospace, 'SF Mono', 'Cascadia Mono', 'JetBrains Mono', Menlo, monospace;
}

.app-shell-main table td.text-right {
  font-family: var(--font-mono-cabina);
  font-size: 0.74rem;
}

[hlminput] {
  font-family: var(--font-mono-cabina);
  font-size: 0.78rem;
}

/* botones e inputs a la altura de la fila: un centro de operaciones no desperdicia alto */
[hlmbtn] {
  border-radius: 0;
  box-shadow: none;
}

[hlminput] {
  border-radius: 0;
}

/* la tira de KPIs de la maqueta: panel PLANO fundido con la rejilla (fondo fuera, borde
   del shell), etiqueta uppercase pequeña y cifra enorme en monospace tabular */
[hlmcard] {
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  border-color: var(--shell-border);
}

[hlmcard] .text-sm {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--shell-fg);
}

[hlmcard] p.text-2xl {
  font-size: 2.4rem;
  line-height: 1.1;
  font-family: var(--font-mono-cabina);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
`

/** Tokens del tema que pisa suite: casi recto y con la tipografía del sector. */
const SUITE_TOKENS = `  /* preset «suite»: rectangular y con el stack tipográfico corporativo */
  --radius: 2px;
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 2px;
  --radius-xl: 2px;
  --font-sans: 'Segoe UI', Tahoma, Verdana, ui-sans-serif, system-ui, sans-serif;`

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
[hlmbtn] {
  border-radius: 2px;
  box-shadow: none;
}

[hlminput] {
  border-radius: 2px;
}

/* el badge es una etiqueta de estado rectangular, no una píldora */
[hlmbadge] {
  border-radius: 2px;
  font-weight: 500;
}

/* la tarjeta KPI se cuadra y toma la cabecera etiquetada de la rejilla */
[hlmcard] {
  border-radius: 2px;
  box-shadow: none;
  border-color: var(--grid-line);
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
