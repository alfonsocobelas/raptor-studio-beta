import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import type { KpiCell } from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/** Cómo se llama cada tipo de celda en el panel; el mismo vocabulario que el menú «+». */
const CELL_LABELS: Record<KpiCell['kind'], string> = {
  counter: 'Contador',
  kpi: 'KPI',
  'top-n': 'Top N',
  'count-by': 'Barras',
  series: 'Evolución'
}

/**
 * Panel de la FILA de KPIs (spec 73): las celdas que lleva, en su orden. Añadir se hace con el
 * «+» de la propia fila en el lienzo; aquí se reordena y se quita — la ✕ del lienzo sobre la
 * fila entera se lleva las N celdas, y por eso cada una tiene aquí la suya.
 */
@Component({
  selector: 'studio-kpis-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="kpis-config">
        <h3 class="mb-2 text-sm font-semibold">Componente · fila de KPIs</h3>
        <div class="space-y-1.5 text-xs">
          @for (cell of v.cells; track $index; let i = $index) {
            <div class="flex items-center gap-1 rounded-md border px-2 py-1" [attr.data-testid]="'kpis-cell-' + i">
              <span class="text-muted-foreground shrink-0">{{ cell.typeLabel }}</span>
              <span class="flex-1 truncate text-right">{{ cell.entityLabel }}</span>
              <button
                type="button"
                class="hover:bg-accent rounded px-1 disabled:opacity-30"
                title="Adelantar"
                [disabled]="i === 0"
                [attr.data-testid]="'kpis-up-' + i"
                (click)="move(i, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                class="hover:bg-accent rounded px-1 disabled:opacity-30"
                title="Atrasar"
                [disabled]="i === v.cells.length - 1"
                [attr.data-testid]="'kpis-down-' + i"
                (click)="move(i, 1)"
              >
                ↓
              </button>
              <button
                type="button"
                class="text-destructive hover:bg-destructive/10 rounded px-1 font-bold"
                title="Quitar esta celda"
                [attr.data-testid]="'kpis-remove-' + i"
                (click)="remove(i)"
              >
                ✕
              </button>
            </div>
          } @empty {
            <p class="text-muted-foreground text-[10px]">La fila está vacía: añade KPIs con el «+» del lienzo.</p>
          }

          <p class="text-muted-foreground pt-1 text-[10px]">
            Se añaden celdas con el «+» de la fila; cada una se configura pulsándola.
          </p>
        </div>
      </section>
    }
  `
})
export class KpisConfigComponent {
  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const pageIndex = this.active.index()
    const blocks = this.store.pages()[pageIndex]?.blocks ?? []
    const blockIndex = blocks.findIndex(block => block.kind === 'kpis')
    if (blockIndex < 0) return null

    const resources = this.store.resources()
    return {
      pageIndex,
      blockIndex,
      cells: (blocks[blockIndex].items ?? []).map(cell => ({
        typeLabel: CELL_LABELS[cell.kind],
        entityLabel: resources.find(r => r.name === cell.resource)?.labelPlural ?? cell.resource
      }))
    }
  })

  protected remove(index: number): void {
    const v = this.view()
    if (v) this.store.removeCell(v.pageIndex, v.blockIndex, index)
  }

  protected move(index: number, delta: number): void {
    const v = this.view()
    if (v) this.store.moveCell(v.pageIndex, v.blockIndex, index, index + delta)
  }
}
