import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
  lucideChartBar,
  lucideChartColumn,
  lucideChartNoAxesColumn,
  lucideGauge,
  lucidePlus,
  lucideTrophy,
  lucideX
} from '@ng-icons/lucide'
import { generableCell, type DesignBlock, type KpiCell, type KpiCellKind } from '@app/shared/domain'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { CanvasChartComponent } from './canvas-chart.component'
import { CanvasKpiComponent } from './canvas-kpi.component'
import { CanvasTopNComponent } from './canvas-top-n.component'
import { CanvasNoticeService } from './canvas-notice.service'
import { DesignStore } from './design-store'
import { mockTotal } from './mock-data'

interface CellTool {
  kind: KpiCellKind
  icon: string
  label: string
}

/** Los cinco tipos de celda que ofrece el «+»: uno por miembro de la familia analítica. */
const CELL_TOOLS: CellTool[] = [
  { kind: 'counter', icon: 'lucideChartNoAxesColumn', label: 'Contador' },
  { kind: 'kpi', icon: 'lucideGauge', label: 'KPI' },
  { kind: 'top-n', icon: 'lucideTrophy', label: 'Top N' },
  { kind: 'count-by', icon: 'lucideChartBar', label: 'Barras' },
  { kind: 'series', icon: 'lucideChartColumn', label: 'Evolución' }
]

/**
 * La FILA de KPIs (spec 73): celdas mixtas —contador, KPI, Top N, Barras, Evolución— conviviendo
 * en una misma línea, y el cuadrado «+» al final para añadir la siguiente. Las tarjetas ocupan
 * una columna y las gráficas dos, el MISMO reparto que emite la app generada: el lienzo no
 * promete un layout que el código no haga.
 */
@Component({
  selector: 'studio-canvas-kpi-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KpiCardComponent, CanvasChartComponent, CanvasKpiComponent, CanvasTopNComponent, NgIcon],
  providers: [
    provideIcons({
      lucideChartBar,
      lucideChartColumn,
      lucideChartNoAxesColumn,
      lucideGauge,
      lucidePlus,
      lucideTrophy,
      lucideX
    })
  ],
  host: { '(document:click)': 'closeMenu()' },
  template: `
    <div
      class="grid items-stretch gap-4"
      data-testid="kpi-row"
      [style.grid-template-columns]="'repeat(' + cols() + ', minmax(0, 1fr))'"
    >
      @for (cell of cells(); track $index) {
        <div
          class="group/cell relative"
          [style.grid-column]="'span ' + spanOf(cell)"
          [attr.data-testid]="'kpi-cell-' + cell.kind + '-' + $index"
        >
          @if (!generable(cell)) {
            <span
              class="absolute -top-2 left-2 z-10 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-800"
              [attr.data-testid]="'kpi-cell-incomplete-' + $index"
            >
              incompleta · no se emite
            </span>
          }
          @switch (cell.kind) {
            @case ('counter') {
              <app-kpi-card
                [title]="counterTitle(cell)"
                [value]="counterValue($index)"
                [subtitle]="counterSubtitle(cell)"
                [testId]="'kpi-' + cell.resource"
              />
            }
            @case ('kpi') {
              <studio-canvas-kpi [cell]="cell" />
            }
            @case ('top-n') {
              <studio-canvas-top-n [cell]="cell" />
            }
            @default {
              <studio-canvas-chart [cell]="cell" />
            }
          }
          <button
            type="button"
            class="bg-destructive absolute -right-2 -top-2 z-10 hidden h-5 w-5 rounded-full text-[10px] font-bold text-white shadow group-hover/cell:block"
            title="Quitar esta celda"
            [attr.data-testid]="'kpi-cell-remove-' + $index"
            (click)="remove($event, $index)"
          >
            ✕
          </button>
        </div>
      }

      <div class="relative min-h-20">
        <button
          type="button"
          class="border-input text-muted-foreground hover:border-foreground/40 hover:text-foreground flex h-full min-h-20 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
          title="Añadir un KPI a la fila"
          data-testid="kpi-row-add"
          (click)="toggleMenu($event)"
        >
          <ng-icon name="lucidePlus" size="22" />
          @if (!cells().length) {
            <span class="mt-1 px-2 text-center text-[10px]">Elige qué KPIs lleva esta fila</span>
          }
        </button>

        @if (menuOpen()) {
          <div
            class="bg-popover absolute left-0 top-full z-20 mt-1 w-40 rounded-md border p-1 shadow-md"
            data-testid="kpi-row-menu"
          >
            @for (tool of tools; track tool.kind) {
              <button
                type="button"
                class="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                [attr.data-testid]="'kpi-row-add-' + tool.kind"
                (click)="add($event, tool.kind)"
              >
                <ng-icon [name]="tool.icon" size="14" class="text-muted-foreground" />
                {{ tool.label }}
              </button>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CanvasKpiRowComponent {
  readonly pageIndex = input.required<number>()
  readonly blockIndex = input.required<number>()
  readonly block = input.required<DesignBlock>()

  private readonly store = inject(DesignStore)
  private readonly notice = inject(CanvasNoticeService)

  protected readonly tools = CELL_TOOLS
  protected readonly menuOpen = signal(false)

  protected readonly cells = computed<KpiCell[]>(() => this.block().items ?? [])

  /** Columnas del grid: la suma de spans más la del cuadrado «+». */
  protected readonly cols = computed(() => this.cells().reduce((sum, cell) => sum + this.spanOf(cell), 1))

  /** El mismo reparto que emite la app: tarjetas a una columna, gráficas a dos. */
  protected spanOf(cell: KpiCell): number {
    return cell.kind === 'count-by' || cell.kind === 'series' ? 2 : 1
  }

  protected generable(cell: KpiCell): boolean {
    return generableCell(cell)
  }

  protected counterTitle(cell: KpiCell): string {
    return this.store.resources().find(r => r.name === cell.resource)?.labelPlural ?? cell.resource
  }

  protected counterSubtitle(cell: KpiCell): string {
    const label = this.store.resources().find(r => r.name === cell.resource)?.labelPlural ?? cell.resource
    return `Total de ${label.toLowerCase()}`
  }

  protected counterValue(index: number): number {
    return mockTotal(index)
  }

  protected toggleMenu(event: Event): void {
    event.stopPropagation()
    this.menuOpen.update(open => !open)
  }

  protected closeMenu(): void {
    this.menuOpen.set(false)
  }

  /** La celda nueva habla de la entidad de la que ya habla la fila, o la primera del modelo. */
  protected add(event: Event, kind: KpiCellKind): void {
    event.stopPropagation()
    this.menuOpen.set(false)
    const resource = this.cells().at(-1)?.resource ?? this.store.resources()[0]?.name
    if (!resource) {
      this.notice.show('Sin entidades en el modelo no hay nada que medir: crea una primero')
      return
    }
    // el gate puede revertir la mutación (p. ej. una celda idéntica a otra); callarlo
    // era la mitad del «no funciona» (reportado 2026-08-28)
    if (!this.store.addCell(this.pageIndex(), this.blockIndex(), kind, resource)) {
      this.notice.show(`No se ha podido añadir la celda: ${this.store.lastError() ?? 'el diseño no la admite'}`)
    }
  }

  protected remove(event: Event, index: number): void {
    event.stopPropagation()
    this.store.removeCell(this.pageIndex(), this.blockIndex(), index)
  }
}
