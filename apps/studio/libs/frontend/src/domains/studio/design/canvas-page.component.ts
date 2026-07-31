import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { DataTable, type ColumnDef } from '../../../shared/components/data-table'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { DesignStore } from './design-store'
import { sampleRows, sampleTotal, visibleColumns } from '../preview/sample-data'

const SAMPLE_ROW_COUNT = 5

/**
 * Una página del diseño pintada con los componentes REALES del kernel emitido.
 * Hover sobre cualquier componente → resaltado + ✕. Clic en una tabla → la
 * selecciona para el inspector.
 */
@Component({
  selector: 'studio-canvas-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, KpiCardComponent],
  template: `
    @if (page(); as current) {
      @if (current.kind === 'dashboard') {
        <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + kpiCols() + ', minmax(0, 1fr))'">
          @for (kpi of kpis(); track kpi.testId) {
            <div class="group relative rounded-lg transition-shadow hover:ring-2 hover:ring-primary/60">
              <app-kpi-card [title]="kpi.title" [value]="kpi.value" [testId]="kpi.testId" />
              <button
                type="button"
                class="bg-destructive absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow group-hover:flex"
                [attr.data-testid]="'delete-' + kpi.testId"
                (click)="deleteWidget(kpi.widgetIndex)"
              >
                ✕
              </button>
            </div>
          }
        </div>
      } @else {
        <div
          class="group relative cursor-pointer rounded-lg transition-shadow hover:ring-2 hover:ring-primary/60"
          [class.ring-2]="selected() === current.resource"
          [class.ring-primary]="selected() === current.resource"
          [attr.data-testid]="'canvas-table-' + current.resource"
          (click)="select.emit(current.resource)"
        >
          @if (table(); as t) {
            <app-data-table
              [columns]="t.columns"
              [data]="t.rows"
              [total]="t.rows.length"
              [page]="1"
              [pageSize]="10"
              [actions]="[]"
            />
          }
          <button
            type="button"
            class="bg-destructive absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow group-hover:flex"
            [attr.data-testid]="'delete-table-' + current.resource"
            (click)="deletePage($event)"
          >
            ✕
          </button>
        </div>
      }
    }
  `
})
export class CanvasPageComponent {
  readonly pageIndex = input.required<number>()
  readonly selected = input<string | null>(null)
  readonly select = output<string>()

  protected readonly store = inject(DesignStore)

  protected readonly page = computed(() => this.store.composition().pages[this.pageIndex()])

  protected readonly kpis = computed(() => {
    const page = this.page()
    if (page?.kind !== 'dashboard') return []
    return page.widgets.map((widget, index) => {
      const model = this.store.registry()[widget.resource]
      return {
        widgetIndex: index,
        title: model?.labels?.plural ?? widget.resource,
        value: sampleTotal(index),
        testId: `kpi-${widget.resource}`
      }
    })
  })

  protected readonly kpiCols = computed(() => Math.min(Math.max(this.kpis().length, 2), 4))

  protected readonly table = computed(() => {
    const page = this.page()
    if (page?.kind !== 'resource') return null
    const model = this.store.registry()[page.resource]
    if (!model) return null
    return { columns: visibleColumns(model) as ColumnDef[], rows: sampleRows(model, SAMPLE_ROW_COUNT) }
  })

  protected deleteWidget(widgetIndex: number): void {
    this.store.removeWidget(this.pageIndex(), widgetIndex)
  }

  protected deletePage(event: Event): void {
    event.stopPropagation()
    this.store.removePage(this.pageIndex())
  }
}
