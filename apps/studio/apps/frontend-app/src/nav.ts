export interface NavItem {
  label: string
  route: string
}

/** Menú lateral: una entrada por recurso incluido en la app. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Clientes', route: '/sap-licensing/customers' },
  { label: 'Contratos', route: '/sap-licensing/contracts' },
  { label: 'Licencias', route: '/sap-licensing/licenses' },
  { label: 'Proyectos', route: '/sap-licensing/projects' }
]
