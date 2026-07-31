export interface NavItem {
  label: string
  route: string
}

/** Menú lateral: una entrada por recurso incluido en la app. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', route: '/' },
  { label: 'Vehículos', route: '/dealership/vehicles' },
  { label: 'Clientes', route: '/dealership/clients' },
  { label: 'Ventas', route: '/dealership/sales' }
]
