export interface NavItem {
  label: string
  route: string
}

/** Menú lateral: una entrada por recurso incluido en la app. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Contratos', route: '/sap-licensing/contracts' },
  { label: 'Contratos · cronograma', route: '/sap-licensing/contracts/cronograma' },
  { label: 'Clientes', route: '/sap-licensing/customers' },
  { label: 'Licencias', route: '/sap-licensing/licenses' },
  { label: 'Nuevo cliente', route: '/sap-licensing/customers/formulario' },
  { label: 'Tablero de contratos', route: '/sap-licensing/contracts/tablero' }
]
