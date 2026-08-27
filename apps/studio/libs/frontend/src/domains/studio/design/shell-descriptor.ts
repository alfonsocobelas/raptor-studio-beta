import { PreviewPreset } from './preview-settings'

/**
 * El shell de cada piel, como DATOS (spec 69).
 *
 * Antes vivía como un `@if (preview.preset() === …)` por piel dentro de la plantilla del lienzo:
 * ~250 líneas de marcado casi duplicado que ya derivó dos veces respecto al emitido. Con tres
 * pieles nuevas serían cinco ramas, así que aquí se separa lo que CAMBIA (esto) de lo que se
 * pinta (`canvas-shell.component.ts`).
 *
 * Hay dos FORMAS de shell, no cinco: `rail` (la navegación vive en una columna) y `banner` (vive
 * en una banda superior). Todo lo demás —ancho, superficie, cabecera, densidad, contadores, pie,
 * barra de estado— es un campo. Una piel nueva es una entrada de este mapa.
 *
 * Ojo: esto describe la MAQUETA del lienzo, no el emitido. El emitido sigue teniendo un
 * `app.component.ts.template` por piel, que es Angular de verdad y no cabe en un descriptor.
 */

/** La barra de estado bajo el shell: ninguna, la ruta en monospace, o la miga del ERP. */
export type ShellStatusbar = 'none' | 'path' | 'crumb'

/** De qué está hecha la superficie del raíl. */
export type ShellSurface =
  /** `bg-card` + borde: la del neutro */
  | 'card'
  /** tokens `--shell-*` que declara el preset: contraste propio, claro y oscuro */
  | 'shell'

export interface ShellRail {
  /** Clase de ancho de Tailwind ('w-56'): es una clase y no un número porque el JIT no ve valores */
  width: string
  surface: ShellSurface
  /** Cabecera del raíl: cuadro de iniciales + nombre, o nombre + versalita */
  header: 'logo' | 'eyebrow'
  /** Texto de la versalita (header: 'eyebrow') */
  eyebrow?: string
  /**
   * Densidad de las entradas de navegación. `house` es la métrica del propio estudio (13px/600,
   * radio de 7px) que usa la familia raptor; el activo se marca con el acento del tema.
   */
  navDensity: 'comfortable' | 'compact' | 'house' | 'house-tight'
  /** Contador de registros por entrada: la seña del centro de operaciones */
  counters: boolean
  /** Pie de sesión: el componente calcado del emitido, o los botones sueltos de cabina */
  footer: 'component' | 'inline'
}

export interface ShellBanner {
  /** Subtítulo junto al nombre en la banda; '' si la banda no lleva subtítulo */
  subtitle: string
  /** Pestañas de módulo bajo la banda (el patrón del ERP) */
  modules: boolean
  /** Cuadro de iniciales en el acento del tema, a la izquierda del nombre */
  mark?: boolean
  /** La navegación vive DENTRO de la banda (rotulo) en vez de en pestañas aparte (suite) */
  nav?: 'inline'
}

export interface ShellDescriptor {
  layout: 'rail' | 'banner'
  rail?: ShellRail
  banner?: ShellBanner
  statusbar: ShellStatusbar
  /** Relleno de la sección de contenido ('p-6'): también clase, por el mismo motivo que el ancho */
  padding: string
  /** El grupo desplegable «Administración» del emitido (sólo lo lleva el neutro hoy) */
  adminNav: boolean
}

const ACTUAL: ShellDescriptor = {
  layout: 'rail',
  rail: {
    width: 'w-56',
    surface: 'card',
    header: 'logo',
    navDensity: 'comfortable',
    counters: false,
    footer: 'component'
  },
  statusbar: 'none',
  padding: 'p-6',
  adminNav: true
}

/** Centro de operaciones: barra a contraste con contadores y la ruta en monospace arriba. */
const CABINA: ShellDescriptor = {
  layout: 'rail',
  rail: {
    width: 'w-56',
    surface: 'shell',
    header: 'eyebrow',
    eyebrow: 'Centro de operaciones',
    navDensity: 'compact',
    counters: true,
    footer: 'inline'
  },
  statusbar: 'path',
  padding: 'p-5',
  adminNav: false
}

/**
 * Taller: el marco del propio estudio (spec 69). Raíl de lino derivado del tema, versalita bajo
 * el nombre y la activa marcada con el acento. La densidad es la cómoda del neutro.
 */
const TALLER: ShellDescriptor = {
  layout: 'rail',
  rail: {
    width: 'w-52',
    surface: 'shell',
    header: 'eyebrow',
    eyebrow: 'Panel de gestión',
    navDensity: 'house',
    counters: false,
    footer: 'component'
  },
  statusbar: 'none',
  padding: 'p-6',
  adminNav: true
}

/**
 * Banco de trabajo: la misma casa que taller, apretada, con la ruta arriba. Se separa de cabina
 * en que el raíl no se invierte a contraste ni cambia la letra.
 */
const BANCO: ShellDescriptor = {
  layout: 'rail',
  rail: {
    width: 'w-48',
    surface: 'shell',
    header: 'eyebrow',
    eyebrow: 'Banco de trabajo',
    navDensity: 'house-tight',
    counters: false,
    footer: 'component'
  },
  statusbar: 'path',
  padding: 'p-4',
  adminNav: true
}

/**
 * Rótulo: la marca al frente (spec 69). Banda de tinta con el logotipo en el acento del tema y la
 * navegación dentro; ni raíl ni pestañas aparte. La piel holgada de la familia.
 */
const ROTULO: ShellDescriptor = {
  layout: 'banner',
  banner: { subtitle: '', modules: false, mark: true, nav: 'inline' },
  statusbar: 'none',
  padding: 'p-8',
  adminNav: false
}

/** ERP: banda de marca, pestañas de módulo y miga. */
const SUITE: ShellDescriptor = {
  layout: 'banner',
  banner: { subtitle: 'Panel de gestión', modules: true },
  statusbar: 'crumb',
  padding: 'p-4',
  adminNav: false
}

export const SHELL_DESCRIPTORS: Record<PreviewPreset, ShellDescriptor> = {
  actual: ACTUAL,
  cabina: CABINA,
  taller: TALLER,
  banco: BANCO,
  rotulo: ROTULO,
  suite: SUITE
}

export function shellOf(preset: PreviewPreset): ShellDescriptor {
  return SHELL_DESCRIPTORS[preset] ?? ACTUAL
}
