export interface NavItem {
  label: string
  route: string
}

/** Menú lateral: una entrada por recurso incluido en la app. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', route: '/dashboard' },
  { label: 'Muestras', route: '/aguas/muestras' },
  { label: 'Clientes', route: '/aguas/clientes' },
  { label: 'Puntos de muestreo', route: '/aguas/puntos' },
  { label: 'Parámetros', route: '/aguas/parametros' }
]
