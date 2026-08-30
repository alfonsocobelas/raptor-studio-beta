import { PreviewPreset } from './preview-settings'

/**
 * El shell de cada piel, como DATOS (spec 69).
 *
 * Antes vivía como un `@if (preview.preset() === …)` por piel dentro de la plantilla del lienzo:
 * ~250 líneas de marcado casi duplicado que ya derivó dos veces respecto al emitido. Aquí se
 * separa lo que CAMBIA (esto) de lo que se pinta (`canvas-shell.component.ts`).
 *
 * Con las cinco pieles retiradas (2026-08-27) queda una entrada y una forma de shell: el raíl del
 * neutro. La costura se mantiene a propósito — una piel nueva es una entrada de este mapa, más
 * los campos que necesite — pero se han retirado los campos que sólo servían a las pieles
 * borradas (forma de banda, superficie a contraste, contadores, barra de estado, densidades de
 * la familia raptor). Volver a necesitarlos es volver a escribirlos, no descomentarlos.
 *
 * Ojo: esto describe la MAQUETA del lienzo, no el emitido. El emitido tiene su propio
 * `app.component.ts.template`, que es Angular de verdad y no cabe en un descriptor.
 */
export interface ShellDescriptor {
  /** Clase de ancho de Tailwind ('w-60'): es una clase y no un número porque el JIT no ve valores */
  railWidth: string
  /** Relleno de la sección de contenido ('p-6'): también clase, por el mismo motivo que el ancho */
  padding: string
  /** El grupo desplegable «Administración» del emitido */
  adminNav: boolean
}

// El emitido usa `w-60` en su <aside> (app.component.ts.template): con w-56 el menú de sesión
// (w-56) sobresalía 32px del raíl en el lienzo, el doble que en la app real.
const ACTUAL: ShellDescriptor = {
  railWidth: 'w-60',
  padding: 'p-6',
  adminNav: true
}

export const SHELL_DESCRIPTORS: Record<PreviewPreset, ShellDescriptor> = {
  actual: ACTUAL
}

export function shellOf(preset: PreviewPreset): ShellDescriptor {
  return SHELL_DESCRIPTORS[preset] ?? ACTUAL
}
