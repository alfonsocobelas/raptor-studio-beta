import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { AccessDiagramViewComponent } from './access-diagram-view.component'
import { AccessTableComponent } from './access-table.component'
import { AccessUiService } from './access-ui.service'

/**
 * El centro del modo Accesos (spec 49): conmuta entre los tres pivotes del raíl —
 * la tabla por Rol, la tabla por Entidad y el diagrama de casos de uso de la spec 46,
 * que se conserva intacto como tercera mirada. El resumen del rol NO vive aquí: es el
 * panel derecho del estudio (el mismo hueco que Modelo y Flujos usan para el suyo).
 */
@Component({
  selector: 'studio-access-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccessDiagramViewComponent, AccessTableComponent],
  template: `
    @if (ui.pivot() === 'diagram') {
      <studio-access-diagram-view />
    } @else {
      <studio-access-table class="block h-full" />
    }
  `
})
export class AccessViewComponent {
  protected readonly ui = inject(AccessUiService)
}
