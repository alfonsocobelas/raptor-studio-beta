import { inject } from '@angular/core'
import { Router } from '@angular/router'

// True si la navegación que está creando la vista viene de una URL de la misma sección
// (p.ej. volver de un detalle a su lista). Las listas lo usan para conservar su estado
// (página, orden, búsqueda) solo en ese caso y resetearlo al entrar desde fuera.
// Debe llamarse en contexto de inyección (constructor / inicializador de campo).
export function navigationCameFrom(sectionPrefix: string): boolean {
  const previousUrl = inject(Router).getCurrentNavigation()?.previousNavigation?.finalUrl?.toString() ?? ''
  return previousUrl.startsWith(sectionPrefix)
}
