import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import type { ResourceDefinition } from '@acc/schema'
import type { ComposedPage } from '@acc/generators/src/generators/app/composition'
import { DataTable, type ColumnDef } from '../../../shared/components/data-table'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { ACTIVE_APP } from './active-app'
import { sampleRows, sampleTotal, visibleColumns } from './sample-data'

const SAMPLE_ROW_COUNT = 5

/**
 * Render de una página de la composición con los componentes REALES del kernel
 * emitido (DataTable, KpiCard): lo que se ve es lo que el generador produce.
 * Read-only en fase B: los outputs de la tabla no se conectan.
 */
@Component({
  selector: 'studio-page-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, KpiCardComponent],
  template: `
    @if (page().kind === 'dashboard') {
      <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + kpiCols() + ', minmax(0, 1fr))'">
        @for (kpi of kpis(); track kpi.title) {
          <app-kpi-card [title]="kpi.title" [value]="kpi.value" [subtitle]="kpi.subtitle" [testId]="kpi.testId" />
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

  protected readonly kpis = computed(() => {
    const page = this.page()
    if (page.kind !== 'dashboard') return []
    return page.widgets.map((widget, index) => {
      const model = modelOf(widget.resource)
      return {
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
    const model = modelOf(page.resource)
    if (!model) return { columns: [] as ColumnDef[], rows: [] }
    return {
      columns: visibleColumns(model) as ColumnDef[],
      rows: sampleRows(model, SAMPLE_ROW_COUNT)
    }
  })
}

function modelOf(resource: string): ResourceDefinition | undefined {
  return ACTIVE_APP.models.find(m => m.name === resource)
}
