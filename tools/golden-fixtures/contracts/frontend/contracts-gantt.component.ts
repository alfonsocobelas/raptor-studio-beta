import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { ContractDto } from '@sap-licenses/shared/domain'
import { ContractService, OffsetPaginatedOutput } from '../../../../../../core/services/contract.service'
import { formatValue } from '../../../../../../shared/utils/format-value'

interface GanttRow {
  id: string
  label: string
  start: Date | null
  end: Date | null
}

/**
 * Cronograma de Contratos: la MISMA lectura del listado pintada como barras
 * entre las fechas del period. Comparte servicio, búsqueda y paginación; el eje
 * se deriva de lo cargado, sin endpoint ni estado propios.
 */
@Component({
  selector: 'app-contracts-gantt',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Contratos · cronograma</h1>
        <p class="text-muted-foreground">Gestión de contratos SAP y acuerdos de licenciamiento</p>
      </div>

      <input
        class="app-toolbar border-input w-full max-w-sm rounded-md border px-3 py-2 text-sm"
        type="search"
        placeholder="Buscar…"
        [ngModel]="search()"
        (ngModelChange)="onSearch($event)"
        aria-label="Buscar"
      />

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando contratos…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los contratos</p>
      } @else if (!rows().length) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay contratos registrados</p>
      } @else {
        <div class="app-panel bg-card overflow-x-auto rounded-lg border">
          <!-- cabecera del eje: una marca por mes del intervalo cargado -->
          @if (axis(); as scale) {
            <div class="app-panel-head text-muted-foreground relative ml-48 h-6 border-b text-[10px]">
              @for (tick of ticks(); track tick.left) {
                <span class="absolute top-1 -translate-x-1/2" [style.left.%]="tick.left">{{ tick.label }}</span>
              }
            </div>
          }
          @for (row of rows(); track row.id) {
            <div class="app-cell flex items-center border-b last:border-b-0" data-testid="gantt-row">
              <span class="w-48 shrink-0 truncate px-3 py-2 text-sm" [title]="row.label">{{ row.label }}</span>
              <div class="relative h-8 flex-1">
                @for (tick of ticks(); track tick.left) {
                  <span class="border-border/60 absolute inset-y-0 border-l" [style.left.%]="tick.left"></span>
                }
                @if (barOf(row); as bar) {
                  <span
                    class="app-chip bg-primary absolute top-2 h-4 rounded-sm"
                    [class.opacity-60]="bar.open"
                    [style.left.%]="bar.left"
                    [style.width.%]="bar.width"
                    [title]="row.label"
                    data-testid="gantt-bar"
                  ></span>
                } @else {
                  <span class="text-muted-foreground absolute top-2 text-xs italic">sin fechas</span>
                }
                <button
                  type="button"
                  class="absolute inset-0 cursor-pointer"
                  [attr.aria-label]="'Abrir ' + row.label"
                  (click)="open(row)"
                ></button>
              </div>
            </div>
          }
        </div>

        <div class="app-toolbar flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ total() }} en total</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="border-input rounded-md border px-3 py-1 disabled:opacity-50"
              [disabled]="currentPage() === 1"
              (click)="onPage(currentPage() - 1)"
            >
              Anterior
            </button>
            <button
              type="button"
              class="border-input rounded-md border px-3 py-1 disabled:opacity-50"
              [disabled]="currentPage() * pageSize() >= total()"
              (click)="onPage(currentPage() + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ContractsGanttComponent {
  private readonly _service = inject(ContractService)
  private readonly _router = inject(Router)

  /** Campos resueltos por el generador desde el modelo (period + primer texto buscable). */
  readonly barLabel = 'contractNumber'
  readonly startField = 'startDate'
  readonly endField = 'endDate'

  readonly isLoading = this._service.contracts.isLoading
  readonly error = this._service.contracts.error

  // Igual que el listado: al recargar, resource() vacía value(); conservar la última
  // página evita que el cronograma parpadee en cada búsqueda.
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<ContractDto> | undefined,
    OffsetPaginatedOutput<ContractDto> | undefined
  >({
    source: () => this._service.contracts.value(),
    computation: (value, previous) => value ?? previous?.value
  })

  readonly rows = computed<GanttRow[]>(() =>
    (this._loaded()?.items ?? []).map(item => {
      const record = item as unknown as Record<string, unknown>
      return {
        id: String(record['id']),
        label: formatValue(record[this.barLabel]),
        start: this.asDate(record[this.startField]),
        end: this.asDate(record[this.endField])
      }
    })
  )

  /** El eje abarca las fechas de la página; sin ninguna fila fechada no hay eje. */
  readonly axis = computed<{ min: number; max: number } | null>(() => {
    const dated = this.rows().filter(row => row.start)
    if (!dated.length) return null

    const min = Math.min(...dated.map(row => row.start!.getTime()))
    const max = Math.max(...dated.map(row => (row.end ?? row.start!).getTime()))
    // intervalo degenerado (una sola fecha): un mes de holgura para que la barra se vea
    return { min, max: max > min ? max : min + 30 * 86400000 }
  })

  /** Una marca por mes; si el intervalo es largo, se saltan meses para no amontonar etiquetas. */
  readonly ticks = computed<{ left: number; label: string }[]>(() => {
    const scale = this.axis()
    if (!scale) return []

    const first = new Date(scale.min)
    const months: Date[] = []
    for (let tick = new Date(first.getFullYear(), first.getMonth(), 1); tick.getTime() <= scale.max;) {
      months.push(new Date(tick))
      tick = new Date(tick.getFullYear(), tick.getMonth() + 1, 1)
    }
    const step = Math.max(1, Math.ceil(months.length / 12))

    return months
      .filter((_, index) => index % step === 0)
      .map(month => ({
        left: this.percent(month.getTime(), scale),
        label: month.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      }))
      .filter(tick => tick.left >= 0 && tick.left <= 100)
  })

  /** Posición de la barra en % del eje; sin fecha de fin queda «abierta» hasta el borde. */
  barOf(row: GanttRow): { left: number; width: number; open: boolean } | null {
    const scale = this.axis()
    if (!scale || !row.start) return null

    const left = this.percent(row.start.getTime(), scale)
    const right = row.end ? this.percent(row.end.getTime(), scale) : 100

    return { left, width: Math.max(right - left, 1), open: !row.end }
  }

  readonly total = computed(() => this._loaded()?.total ?? 0)
  readonly hasData = computed(() => this._loaded() !== undefined)
  readonly currentPage = computed(() => this._service.request().page)
  readonly pageSize = computed(() => this._service.request().pageSize)
  readonly search = computed(() => this._service.request().search ?? '')

  onSearch(search: string): void {
    this._service.request.update(r => ({ ...r, search: search || undefined, page: 1 }))
  }

  onPage(page: number): void {
    this._service.request.update(r => ({ ...r, page }))
  }

  open(row: GanttRow): void {
    void this._router.navigate(['/sap-licensing/contracts', row.id])
  }

  private percent(time: number, scale: { min: number; max: number }): number {
    return ((time - scale.min) / (scale.max - scale.min)) * 100
  }

  private asDate(value: unknown): Date | null {
    if (!value) return null
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? null : date
  }

  // @ai:begin gantt-extra — escalas, colores por estado o agrupaciones propias
  // @ai:end
}
