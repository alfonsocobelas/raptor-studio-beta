export interface NavItem {
  label: string
  route: string
}

/** Menú lateral: una entrada por recurso incluido en la app. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Prendas', route: '/warehouse/garments' },
  { label: 'Proveedores', route: '/warehouse/suppliers' },
  { label: 'Movimientos', route: '/warehouse/movements' }
]
