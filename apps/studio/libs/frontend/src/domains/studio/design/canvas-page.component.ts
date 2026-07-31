import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { DataTable, type ColumnDef } from '../../../shared/components/data-table'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { DesignStore } from './design-store'
import { buildSampleRows, mockTotal } from './mock-data'

const PAGE_SIZE = 10

/**
 * Una página del diseño pintada como en la app real: cabecera con título,
 * subtítulo y «Nuevo X», tabla con acciones y paginación con totales de
 * mockup, o rejilla de KPIs. Hover → resaltado + ✕; clic en tabla → inspector.
 */
@Component({
  selector: 'studio-canvas-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, KpiCardComponent],
  template: `
    @if (page(); as current) {
      @if (current.kind === 'dashboard') {
        <header class="mb-5">
          <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p class="text-muted-foreground text-sm">Resumen de {{ store.appName() }}</p>
        </header>
        <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + kpiCols() + ', minmax(0, 1fr))'">
          @for (kpi of kpis(); track kpi.testId) {
            <div class="group relative rounded-lg transition-shadow hover:ring-2 hover:ring-primary/60">
              <app-kpi-card [title]="kpi.title" [value]="kpi.value" [subtitle]="kpi.subtitle" [testId]="kpi.testId" />
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
        @if (view(); as v) {
          <div
            class="group relative cursor-pointer rounded-lg transition-shadow hover:ring-2 hover:ring-primary/60"
            [class.ring-2]="selected() === current.resource"
            [class.ring-primary]="selected() === current.resource"
            [attr.data-testid]="'canvas-table-' + current.resource"
            (click)="select.emit(current.resource)"
          >
            <header class="mb-4 flex items-end justify-between">
              <div>
                <h1 class="text-2xl font-bold tracking-tight">{{ v.labelPlural }}</h1>
                <p class="text-muted-foreground text-sm">Gestión de {{ v.labelPlural.toLowerCase() }} de {{ store.appName() }}</p>
              </div>
              <button type="button" class="bg-primary text-primary-foreground pointer-events-none rounded-md px-3 py-2 text-sm font-medium">
                + {{ v.gender === 'f' ? 'Nueva' : 'Nuevo' }} {{ v.labelSingular.toLowerCase() }}
              </button>
            </header>
            <!-- keyed: fuerza recrear el DataTable al cambiar de entidad (mantiene
                 estado interno de columnas visibles por instancia) -->
            @for (key of [current.resource]; track key) {
              <app-data-table
                [serverSide]="true"
                [columns]="v.columns"
                [data]="v.rows"
                [total]="v.total"
                [page]="1"
                [pageSize]="pageSize"
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
          @if (v.attachments) {
            <div
              class="group relative mt-6 rounded-lg transition-shadow hover:ring-2 hover:ring-primary/60"
              [attr.data-testid]="'canvas-attachments-' + current.resource"
            >
              <h2 class="mb-2 text-sm font-semibold">Ficheros adjuntos</h2>
              <div class="border-input bg-background flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-8 text-center">
                <p class="text-2xl">🗎</p>
                <p class="text-sm font-medium">Arrastra ficheros aquí o haz clic para subirlos</p>
                <p class="text-muted-foreground text-xs">PDF, imágenes o documentos · máx. 10 MB</p>
              </div>
              <ul class="mt-3 space-y-1">
                @for (file of sampleFiles; track file.name) {
                  <li class="bg-background flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>📄 {{ file.name }}</span>
                    <span class="text-muted-foreground flex items-center gap-3 text-xs">
                      {{ file.size }}
                      <button type="button" class="pointer-events-none">🗑</button>
                    </span>
                  </li>
                }
              </ul>
              <button
                type="button"
                class="bg-destructive absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow group-hover:flex"
                [attr.data-testid]="'delete-attachments-' + current.resource"
                (click)="removeAttachments($event, current.resource)"
              >
                ✕
              </button>
            </div>
          }
        }
      }
    }
  `
})
export class CanvasPageComponent {
  readonly pageIndex = input.required<number>()
  readonly selected = input<string | null>(null)
  readonly select = output<string>()

  protected readonly store = inject(DesignStore)
  protected readonly pageSize = PAGE_SIZE

  protected readonly page = computed(() => this.store.composition().pages[this.pageIndex()])

  protected readonly kpis = computed(() => {
    const page = this.page()
    if (page?.kind !== 'dashboard') return []
    return page.widgets.map((widget, index) => {
      const draft = this.store.resources().find(r => r.name === widget.resource)
      const modelIndex = this.store.composition().models.findIndex(m => m.name === widget.resource)
      return {
        widgetIndex: index,
        title: draft?.labelPlural ?? widget.resource,
        value: mockTotal(modelIndex),
        subtitle: `Total de ${draft?.labelPlural.toLowerCase() ?? widget.resource}`,
        testId: `kpi-${widget.resource}`
      }
    })
  })

  protected readonly kpiCols = computed(() => Math.min(Math.max(this.kpis().length, 2), 4))

  protected readonly view = computed(() => {
    const page = this.page()
    if (page?.kind !== 'resource') return null
    const draft = this.store.resources().find(r => r.name === page.resource)
    const model = this.store.registry()[page.resource]
    if (!draft || !model) return null
    const modelIndex = this.store.composition().models.findIndex(m => m.name === page.resource)
    const columns: ColumnDef[] = draft.fields.map(f => ({
      key: f.name,
      label: f.label,
      minWidth: 120,
      ...(f.type === 'number' || f.type === 'integer' ? { type: 'number' as const } : {})
    }))
    return {
      labelSingular: draft.labelSingular,
      labelPlural: draft.labelPlural,
      gender: draft.gender,
      attachments: draft.attachments ?? false,
      columns,
      rows: buildSampleRows(draft, PAGE_SIZE),
      total: mockTotal(modelIndex)
    }
  })

  protected readonly sampleFiles = [
    { name: 'albaran-julio.pdf', size: '182 KB' },
    { name: 'foto-lote-0412.jpg', size: '1,4 MB' },
    { name: 'certificado-calidad.pdf', size: '96 KB' }
  ]

  protected removeAttachments(event: Event, resource: string): void {
    event.stopPropagation()
    this.store.toggleAttachments(resource, false)
  }

  protected deleteWidget(widgetIndex: number): void {
    this.store.removeWidget(this.pageIndex(), widgetIndex)
  }

  protected deletePage(event: Event): void {
    event.stopPropagation()
    this.store.removePage(this.pageIndex())
  }
}
