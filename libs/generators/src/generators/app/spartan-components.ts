/**
 * Componentes helm que usa el esqueleto emitido. Viajan VENDORIZADOS en
 * files-skeleton-ui/spartan/libs/ui: son código materializado (el CLI de
 * Spartan los copia, no los instala), así que copiarlos nosotros evita 16
 * arranques de Nx y la dependencia de red al generar (defecto 13).
 */
export const SPARTAN_COMPONENTS = [
  'alert-dialog',
  'badge',
  'button',
  'card',
  'checkbox',
  'dialog',
  'field',
  'input',
  'label',
  'popover',
  'select',
  'separator',
  'sonner',
  'table',
  'tooltip',
  'utils'
]
