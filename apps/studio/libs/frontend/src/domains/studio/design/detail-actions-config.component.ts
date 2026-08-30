import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/**
 * Panel del bloque FICHA (spec 74): los botones de acción que emitirá la app,
 * derivados de la máquina de estados. El gesto es CURACIÓN, nunca colocación:
 * ocultar (el endpoint sigue emitido), renombrar el label y reordenar (el orden
 * del array es el orden de los botones). Mismo patrón que calendar-config.
 */
@Component({
  selector: 'studio-detail-actions-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideEye, lucideEyeOff })],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="detail-actions-config">
        <h3 class="mb-2 text-sm font-semibold">Ficha · acciones</h3>
        <div class="space-y-1 text-xs">
          @for (t of v.transitions; track t.name; let i = $index; let last = $last) {
            <div class="flex items-center gap-1" [class.opacity-50]="t.hidden">
              <input
                class="hover:border-input focus:border-input w-24 min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-xs outline-none"
                [value]="t.label"
                (input)="rename(t.name, $event)"
                [attr.data-testid]="'action-label-' + i"
              />
              <button
                type="button"
                class="text-muted-foreground px-1 text-xs disabled:opacity-30"
                [disabled]="i === 0"
                [attr.data-testid]="'action-up-' + i"
                (click)="store.moveTransition(v.resource, t.name, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                class="text-muted-foreground px-1 text-xs disabled:opacity-30"
                [disabled]="last"
                [attr.data-testid]="'action-down-' + i"
                (click)="store.moveTransition(v.resource, t.name, 1)"
              >
                ↓
              </button>
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground px-1 text-xs"
                [attr.title]="t.hidden ? 'Mostrar el botón en la ficha' : 'Ocultar el botón de la ficha'"
                [attr.data-testid]="'action-hide-' + i"
                (click)="store.setTransitionHidden(v.resource, t.name, !t.hidden)"
              >
                <ng-icon [name]="t.hidden ? 'lucideEyeOff' : 'lucideEye'" size="14" />
              </button>
            </div>
          }
          <p class="text-muted-foreground pt-1 text-[10px]">
            Ocultar quita el botón de la ficha; la transición sigue existiendo (kanban y procesos la usan).
          </p>
        </div>
      </section>
    }
  `
})
export class DetailActionsConfigComponent {
  readonly resource = input<string | null>(null)

  protected readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const blocks = this.store.pages()[this.active.index()]?.blocks ?? []
    const hasDetail = blocks.some(b => b.kind === 'fields' && b.resource === this.resource())
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!hasDetail || !draft?.state?.transitions.length) return null
    return { resource: draft.name, transitions: draft.state.transitions }
  })

  protected rename(name: string, event: Event): void {
    const v = this.view()
    const label = (event.target as HTMLInputElement).value
    if (v && label.trim()) this.store.updateTransition(v.resource, name, { label })
  }
}
