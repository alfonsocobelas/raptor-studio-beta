export interface NavItem {
  label: string
  route: string
}

/** Menú lateral: una entrada por recurso incluido en la app. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', route: '/dashboard' },
  { label: 'Propiedades', route: '/fincaraiz/propiedades' },
  { label: 'Escaparate', route: '/fincaraiz/propiedades/galeria' },
  { label: 'Visitas', route: '/fincaraiz/visitas' },
  { label: 'Agentes', route: '/fincaraiz/agentes' }
]
