import { NgComponentOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { SYSTEM_VIEWS } from './system-preview/system-views'

/**
 * Una vista de sistema en el lienzo (spec 57): el componente REAL del emitido, renderizado
 * con los dobles del preview, en solo lectura — la contrapartida inversa de la etiqueta
 * "Diseño aún no generable": esto te lo regala la autenticación y no se edita.
 */
@Component({
  selector: 'studio-system-view',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full min-h-0 flex-col" data-testid="system-view">
      <p
        class="text-muted-foreground mb-3 shrink-0 rounded-md border border-dashed px-3 py-1.5 text-xs"
        data-testid="system-view-note"
      >
        La trae la autenticación — no se edita
      </p>
      <!-- pointer-events none: se mira, no se usa (el login del lienzo no inicia sesión) -->
      <div class="pointer-events-none min-w-0 flex-1 select-none overflow-auto">
        <ng-container *ngComponentOutlet="component()" />
      </div>
    </div>
  `
})
export class SystemViewComponent {
  readonly viewId = input.required<string>()

  protected readonly component = computed(() => SYSTEM_VIEWS.find(view => view.id === this.viewId())?.component ?? null)
}
