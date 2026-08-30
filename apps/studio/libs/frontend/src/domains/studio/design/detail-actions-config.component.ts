import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideEye, lucideEyeOff, lucideZap } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { flowStepsForTransition, type FlowStepLink } from './flow-linkage'

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
  providers: [provideIcons({ lucideEye, lucideEyeOff, lucideZap })],
  template: `
    @if (missing(); as m) {
      <!-- el caso ofertas (spec 74): el generador emitirá la ficha con sus botones, pero
           el diseño no tiene vista que los represente — se señala y se arregla de un clic -->
      <section class="mb-4 border-t pt-3" data-testid="detail-actions-missing">
        <h3 class="mb-2 text-sm font-semibold">Ficha · acciones</h3>
        <p class="text-muted-foreground text-xs">
          {{ m.label }} tiene {{ m.count }} {{ m.count === 1 ? 'botón' : 'botones' }} de transición, pero el diseño
          no tiene su vista de ficha: se generará igualmente y aquí no se ve ni se cura.
        </p>
        <button
          type="button"
          class="border-input hover:bg-accent mt-2 w-full rounded-md border border-dashed px-2 py-1.5 text-xs"
          data-testid="detail-actions-add"
          (click)="store.addDetailPageFor(m.resource)"
        >
          + Añadir la ficha
        </button>
      </section>
    }
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="detail-actions-config">
        <h3 class="mb-2 text-sm font-semibold">Ficha · acciones</h3>
        <div class="space-y-1 text-xs">
          @for (t of v.transitions; track t.name; let i = $index; let last = $last) {
            <div [class.opacity-50]="t.hidden">
              <div class="flex items-center gap-1">
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
              <!-- la otra punta del botón (spec 74): el paso de flujo que ejecuta este verbo -->
              @for (link of v.linksOf[t.name]; track link.flowName + link.stepText) {
                <p
                  class="text-muted-foreground flex items-center gap-1 pl-2 text-[10px] leading-tight"
                  [attr.data-testid]="'action-flow-' + i"
                >
                  <ng-icon name="lucideZap" size="10" class="shrink-0" />
                  <span class="truncate" [attr.title]="link.flowName + ': ' + link.stepText">
                    {{ link.stepText }} — <i>{{ link.flowName }}</i>
                  </span>
                </p>
              }
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

  /** Máquina con botones y ninguna página fields de la entidad en TODO el diseño. */
  protected readonly missing = computed(() => {
    const draft = this.store.resources().find(r => r.name === this.resource())
    const transitions = draft?.state?.transitions ?? []
    if (!draft || !transitions.length) return null
    const hasFichaSomewhere = this.store
      .pages()
      .some(p => p.blocks.some(b => b.kind === 'fields' && b.resource === draft.name))
    if (hasFichaSomewhere) return null
    return {
      resource: draft.name,
      label: draft.labelSingular,
      count: transitions.filter(t => !t.hidden).length
    }
  })

  protected readonly view = computed(() => {
    const blocks = this.store.pages()[this.active.index()]?.blocks ?? []
    const hasDetail = blocks.some(b => b.kind === 'fields' && b.resource === this.resource())
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!hasDetail || !draft?.state?.transitions.length) return null
    const linksOf: Record<string, FlowStepLink[]> = {}
    for (const t of draft.state.transitions) {
      linksOf[t.name] = flowStepsForTransition(this.store.flows(), draft.name, t.name)
    }
    return { resource: draft.name, transitions: draft.state.transitions, linksOf }
  })

  protected rename(name: string, event: Event): void {
    const v = this.view()
    const label = (event.target as HTMLInputElement).value
    if (v && label.trim()) this.store.updateTransition(v.resource, name, { label })
  }
}
