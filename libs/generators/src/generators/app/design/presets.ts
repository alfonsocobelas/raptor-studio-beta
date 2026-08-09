/**
 * Presets de diseño (spec 37).
 *
 * Por qué existe esta ranura: cambiar de librería de componentes NO cambia la app. Medido el
 * 2026-08-09 generando la misma app con spartan y con material — 12 ficheros distintos de ~750,
 * y el listado y el diálogo IDÉNTICOS byte a byte, porque las pantallas consumen los contratos
 * neutrales del ADR-003. Lo que sí se percibe al abrir la app es el SHELL (dónde vive la
 * navegación), la DENSIDAD y el cromo. Eso es lo que parametriza un preset.
 *
 * Un preset aporta dos cosas y ninguna más:
 *   1. `files`  — su carpeta de override, copiada DESPUÉS del esqueleto (gana su app.component)
 *   2. `css`    — su bloque de tokens de cromo, añadido al final del styles.css del tema
 *
 * No aporta componentes: los emitidos siguen siendo los mismos, con sus mismos tests.
 */
export interface DesignPreset {
  id: string
  label: string
  description: string
  /** Carpeta de override relativa a app/, o undefined si no cambia el esqueleto */
  files?: string
  /** Bloque CSS del preset; '' si se conforma con los tokens del tema */
  css: string
}

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
`

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
`

export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: 'actual',
    label: 'Actual (neutro)',
    description: 'El shell que ya emite el acelerador: barra lateral sobria, sin identidad de sector',
    css: ''
  },
  {
    id: 'cabina',
    label: 'Cabina (centro de operaciones)',
    description: 'Barra lateral a contraste con contadores, tabla densa y cifras tabulares; tema claro y oscuro',
    files: 'files-design/cabina',
    css: CABINA_CSS
  },
  {
    id: 'suite',
    label: 'Suite (ERP corporativo)',
    description: 'Banda de marca, pestañas de módulo, migas y rejilla con bordes; patrón reconocible de ERP',
    files: 'files-design/suite',
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
