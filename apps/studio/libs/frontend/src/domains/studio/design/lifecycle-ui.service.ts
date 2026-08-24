import { Injectable, inject, linkedSignal } from '@angular/core'
import { ActiveViewService } from './active-view.service'

/**
 * ¿Está abierta la sub-vista del ciclo de vida? El botón que la abre vive en el panel
 * derecho (la card de la pestaña Entidad) y el lienzo que la pinta en model-view, así
 * que el estado se comparte aquí. Es UI de la sesión: jamás entra en el diseño.
 */
@Injectable({ providedIn: 'root' })
export class LifecycleUiService {
  private readonly active = inject(ActiveViewService)

  /** La sub-vista abierta es de la entidad elegida: cambiar de entidad la cierra. */
  readonly open = linkedSignal<string | null, boolean>({
    source: () => this.active.resource(),
    computation: () => false
  })
}
