import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { AccessDiagramViewComponent } from './access-diagram-view.component'
import { AccessSummaryComponent } from './access-summary.component'
import { AccessTableComponent } from './access-table.component'
import { AccessUiService } from './access-ui.service'

/**
 * El centro del modo Accesos (spec 49): conmuta entre los tres pivotes del raíl —
 * la tabla por Rol (con su panel de resumen), la tabla por Entidad y el diagrama
 * de casos de uso de la spec 46, que se conserva intacto como tercera mirada.
 */
@Component({
  selector: 'studio-access-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccessDiagramViewComponent, AccessSummaryComponent, AccessTableComponent],
  template: `
    @if (ui.pivot() === 'diagram') {
      <studio-access-diagram-view />
    } @else {
      <div class="flex h-full min-h-0">
        <studio-access-table class="min-w-0 flex-1" />
        @if (ui.pivot() === 'role') {
          <studio-access-summary />
        }
      </div>
    }
  `
})
export class AccessViewComponent {
  protected readonly ui = inject(AccessUiService)
}
