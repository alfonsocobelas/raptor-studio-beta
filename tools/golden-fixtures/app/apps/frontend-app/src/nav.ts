export interface NavItem {
  label: string
  route: string
}

/** Menú lateral: una entrada por recurso incluido en la app. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Contratos', route: '/sap-licensing/contracts' },
  { label: 'Contratos · cronograma', route: '/sap-licensing/contracts/cronograma' },
  { label: 'Proyectos', route: '/sap-licensing/projects' },
  { label: 'Nuevo proyecto', route: '/sap-licensing/projects/formulario' }
]
