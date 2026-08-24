import { NgComponentOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { ActiveViewService } from './active-view.service'
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
      <div
        class="text-muted-foreground mb-3 flex shrink-0 items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-xs"
        data-testid="system-view-note"
      >
        <span class="min-w-0 flex-1">
          La trae la autenticación — no se edita.
          @if (view()?.interactive) {
            Puedes probarla: los datos son de muestra.
          }
        </span>
        <button
          type="button"
          class="hover:text-foreground shrink-0 underline"
          data-testid="system-view-close"
          (click)="close()"
        >
          Volver al diseño
        </button>
      </div>
      <!-- las interactivas se usan de verdad (dobles inertes); el login solo se mira -->
      <div
        class="min-w-0 flex-1 overflow-auto"
        [class.pointer-events-none]="!view()?.interactive"
        [class.select-none]="!view()?.interactive"
      >
        <ng-container *ngComponentOutlet="component()" />
      </div>
    </div>
  `
})
export class SystemViewComponent {
  private readonly _active = inject(ActiveViewService)

  readonly viewId = input.required<string>()

  protected readonly view = computed(() => SYSTEM_VIEWS.find(view => view.id === this.viewId()) ?? null)
  protected readonly component = computed(() => this.view()?.component ?? null)

  close(): void {
    // volver a la vista del diseño que estaba activa (o al lienzo vacío)
    this._active.select(this._active.index())
  }
}
