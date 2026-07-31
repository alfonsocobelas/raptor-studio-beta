import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { ComposedPage } from '@acc/generators/src/generators/app/composition'
import { DataTable, type ColumnDef } from '../../../shared/components/data-table'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { AppStore } from '../editor/app-store'
import { removeWidget } from '../editor/app-mutations'
import { sampleRows, sampleTotal, visibleColumns } from './sample-data'

const SAMPLE_ROW_COUNT = 5

/**
 * Render de una página con los componentes REALES del kernel emitido, ahora
 * editable: cada widget KPI se resalta al pasar el cursor y expone la cruz de
 * borrado. Toda acción es una mutación del app-schema en el AppStore.
 */
@Component({
  selector: 'studio-page-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, KpiCardComponent],
  template: `
    @if (page().kind === 'dashboard') {
      <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + kpiCols() + ', minmax(0, 1fr))'">
        @for (kpi of kpis(); track kpi.testId) {
          <div class="group relative rounded-lg transition-shadow hover:ring-2 hover:ring-primary/60">
            <app-kpi-card [title]="kpi.title" [value]="kpi.value" [subtitle]="kpi.subtitle" [testId]="kpi.testId" />
            <button
              type="button"
              class="bg-destructive absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow group-hover:flex"
              [attr.data-testid]="'delete-' + kpi.testId"
              [attr.aria-label]="'Eliminar KPI ' + kpi.title"
              (click)="deleteWidget(kpi.widgetIndex)"
            >
              ✕
            </button>
          </div>
        }
      </div>
    } @else {
      @if (table(); as t) {
        @if (t.columns.length) {
          <app-data-table
            [columns]="t.columns"
            [data]="t.rows"
            [total]="t.rows.length"
            [page]="1"
            [pageSize]="10"
            [actions]="[]"
          />
        } @else {
          <p class="text-muted-foreground text-sm" data-testid="empty-table">
            Este recurso no declara columnas visibles (table.show).
          </p>
        }
      }
    }
  `
})
export class PagePreviewComponent {
  readonly page = input.required<ComposedPage>()
  readonly pageIndex = input.required<number>()

  protected readonly store = inject(AppStore)

  protected readonly kpis = computed(() => {
    const page = this.page()
    if (page.kind !== 'dashboard') return []
    return page.widgets.map((widget, index) => {
      const model = this.store.composition().models.find(m => m.name === widget.resource)
      return {
        widgetIndex: index,
        title: model?.labels?.plural ?? widget.resource,
        value: sampleTotal(index),
        subtitle: model?.labels?.subtitle,
        testId: `kpi-${widget.resource}`
      }
    })
  })

  protected readonly kpiCols = computed(() => Math.min(Math.max(this.kpis().length, 2), 4))

  protected readonly table = computed(() => {
    const page = this.page()
    if (page.kind !== 'resource') return null
    const model = this.store.composition().models.find(m => m.name === page.resource)
    if (!model) return { columns: [] as ColumnDef[], rows: [] }
    return {
      columns: visibleColumns(model) as ColumnDef[],
      rows: sampleRows(model, SAMPLE_ROW_COUNT)
    }
  })

  protected deleteWidget(widgetIndex: number): void {
    const pageIndex = this.pageIndex()
    this.store.apply(def => removeWidget(def, pageIndex, widgetIndex))
  }
}
