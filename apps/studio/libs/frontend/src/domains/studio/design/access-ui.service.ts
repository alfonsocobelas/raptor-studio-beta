import { Injectable, signal } from '@angular/core'
import type { AccessActorRole } from '@app/shared/domain'

export type AccessPivot = 'role' | 'entity'

/**
 * Estado de SESIÓN de la pestaña Accesos (spec 49): rol activo, pivote de la tabla,
 * búsqueda y filtro. No persiste ni viaja al diseño — la matriz entra al diseño solo
 * por DesignStore.setResourceAccess.
 */
@Injectable({ providedIn: 'root' })
export class AccessUiService {
  readonly role = signal<AccessActorRole>('user')
  readonly pivot = signal<AccessPivot>('role')
  readonly search = signal('')
  readonly onlyWithAccess = signal(false)
  /** Entidad elegida en el pivote Entidad; '' = la primera del diseño */
  readonly entity = signal('')
}
