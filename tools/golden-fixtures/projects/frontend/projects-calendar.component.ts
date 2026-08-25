import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, linkedSignal, signal } from '@angular/core'
import { Router } from '@angular/router'
import { ProjectDto } from '@sap-licenses/shared/domain'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { AuthService } from '../../../../../../core/services/auth.service'
import { ProjectService, OffsetPaginatedOutput } from '../../../../../../core/services/project.service'
import { generateId } from '../../../../../../shared/utils/uuid'
import { ProjectDialogComponent, ProjectFormValue } from './project-dialog.component'
import { formatValue } from '../../../../../../shared/utils/format-value'

type CalendarView = 'month' | 'week' | 'day'

interface CalendarCell {
  key: string
  dayNumber: number
  inPeriod: boolean
  isToday: boolean
  strips: ProjectDto[]
}

/**
 * Calendario de Proyectos: la MISMA lectura del listado, con cada registro
 * como tira en su día. Comparte servicio y estado — no hay endpoint propio.
 */
@Component({
  selector: 'app-projects-calendar',
  imports: [AppDialog, ProjectDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Proyectos</h1>
        <p class="text-muted-foreground">Proyectos de implementación SAP asociados a clientes</p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando proyectos…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los proyectos</p>
      } @else {
        <div class="app-panel bg-card rounded-lg border">
          <div class="app-panel-head flex items-center justify-between border-b px-4 py-3">
            <h2 class="text-base font-semibold">Proyectos</h2>
            <div class="flex items-center gap-1 text-sm">
              <button
                type="button"
                class="text-muted-foreground px-2 py-1 hover:text-foreground"
                (click)="previousPeriod()"
                aria-label="Anterior"
              >
                ‹
              </button>
              <span class="min-w-28 text-center text-xs font-medium uppercase tracking-widest">{{
                periodLabel()
              }}</span>
              <button
                type="button"
                class="text-muted-foreground px-2 py-1 hover:text-foreground"
                (click)="nextPeriod()"
                aria-label="Siguiente"
              >
                ›
              </button>
            </div>
          </div>

          @if (view() !== 'day') {
            <div class="grid" [style.grid-template-columns]="'repeat(' + dayNames.length + ', minmax(0, 1fr))'">
              @for (name of dayNames; track name) {
                <div class="text-muted-foreground border-b px-2 py-1 text-center text-[10px] tracking-widest">
                  {{ name }}
                </div>
              }
              @for (cell of cells(); track cell.key) {
                <div
                  class="app-cell group min-h-20 border-b border-r p-1 last:border-r-0"
                  [class.opacity-40]="!cell.inPeriod"
                  [class.ring-1]="cell.isToday"
                  [class.ring-primary]="cell.isToday"
                >
                  <span class="text-xs" [class.text-primary]="cell.isToday" [class.font-semibold]="cell.isToday">{{
                    cell.dayNumber
                  }}</span>
                  @if (canWrite()) {
                    <button
                      type="button"
                      class="text-muted-foreground hover:text-foreground float-right px-1 text-xs opacity-0 focus:opacity-100 group-hover:opacity-100"
                      (click)="openCreate(cell.key)"
                      aria-label="Nuevo proyecto"
                    >
                      +
                    </button>
                  }
                  <div class="mt-1 space-y-1">
                    @for (item of cell.strips; track item.id) {
                      <div
                        class="app-chip bg-muted truncate rounded-sm border-l-2 px-1 py-0.5 text-xs"
                        [style.border-left-color]="stripColor(item)"
                        role="button"
                        tabindex="0"
                        (click)="open(item)"
                        (keydown.enter)="open(item)"
                      >
                        {{ text(item, stripLabel) }}
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="space-y-1 p-4">
              @if (canWrite()) {
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground mb-2 text-xs uppercase tracking-widest"
                  (click)="openCreate(anchorKey())"
                >
                  + Nuevo proyecto
                </button>
              }
              @for (item of dayStrips(); track item.id) {
                <div
                  class="app-chip bg-muted rounded-sm border-l-2 px-2 py-1 text-sm"
                  [style.border-left-color]="stripColor(item)"
                  role="button"
                  tabindex="0"
                  (click)="open(item)"
                  (keydown.enter)="open(item)"
                >
                  {{ text(item, stripLabel) }}
                </div>
              } @empty {
                <p class="text-muted-foreground py-8 text-center text-sm">No hay proyectos registrados</p>
              }
            </div>
          }

          <div
            class="app-toolbar text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-[10px] uppercase tracking-widest"
          >
            <span>Proyectos · campo fecha Fecha inicio</span>
            <div class="flex gap-2">
              @for (option of viewOptions; track option.value) {
                <button
                  type="button"
                  class="uppercase tracking-widest"
                  [class.text-foreground]="view() === option.value"
                  [class.font-semibold]="view() === option.value"
                  (click)="view.set(option.value)"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="app-toolbar flex flex-wrap gap-3 text-sm">
          @for (entry of legend; track entry.value) {
            <span class="app-chip bg-card inline-flex items-center gap-2 rounded-md border px-3 py-1">
              <span class="size-2.5 rounded-sm" [style.background-color]="colorOf(entry.colorIndex)"></span>
              {{ entry.label }}
            </span>
          }
        </div>
        <p class="text-muted-foreground text-sm">{{ total() }} en total</p>
      }
    </div>

    <app-dialog [open]="dialogOpen()" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-project-dialog
          [project]="editingProject()"
          [initialValue]="createInitial()"
          (saved)="onSave($event)"
          (close)="dialogOpen.set(false)"
        />
      }
    </app-dialog>
  `
})
export class ProjectsCalendarComponent {
  private readonly _service = inject(ProjectService)
  private readonly _router = inject(Router)
  private readonly _notify = inject(NotificationService)
  protected readonly canWrite = inject(AuthService).canWrite

  /** Campos que pinta la tira: los decide el generador desde el modelo. */
  readonly stripDate = 'startDate'
  readonly stripLabel = 'customerName'
  readonly stripColorField = 'status'
  readonly legend: { value: string; label: string; colorIndex: number }[] = [
    { value: 'planning', label: 'Planificación', colorIndex: 0 },
    { value: 'active', label: 'Activo', colorIndex: 1 },
    { value: 'onhold', label: 'En pausa', colorIndex: 2 },
    { value: 'closed', label: 'Cerrado', colorIndex: 3 }
  ]
  readonly weekends = true
  readonly dayNames: string[] = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
  readonly viewOptions: { value: CalendarView; label: string }[] = [
    { value: 'month', label: 'Mes' },
    { value: 'week', label: 'Semana' },
    { value: 'day', label: 'Día' }
  ]

  readonly view = signal<CalendarView>('month')
  readonly anchor = signal(new Date())

  readonly dialogOpen = signal(false)
  readonly editingProject = signal<ProjectDto | null>(null)
  /** El día pulsado (clave yyyy-mm-dd): precarga el campo fecha del alta. */
  readonly createDate = signal<string | null>(null)
  readonly createInitial = computed<Partial<ProjectFormValue> | null>(() => {
    const date = this.createDate()
    return date === null ? null : { startDate: date }
  })
  readonly anchorKey = computed(() => this._keyOf(this.anchor()))

  readonly isLoading = this._service.projects.isLoading
  readonly error = this._service.projects.error

  constructor() {
    // El calendario no pagina: ensancha la lectura compartida hasta el techo del API
    // (@Max(100) del PaginateOffsetDto) y la restaura al salir para no ensuciar el listado.
    const previous = this._service.request()
    this._service.request.update(r => ({ ...r, page: 1, pageSize: 100 }))
    inject(DestroyRef).onDestroy(() => {
      this._service.request.update(r => ({ ...r, page: previous.page, pageSize: previous.pageSize }))
    })
  }

  // Igual que el listado: al recargar, resource() vacía value(); conservar la última
  // página evita que la rejilla parpadee en cada navegación.
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<ProjectDto> | undefined,
    OffsetPaginatedOutput<ProjectDto> | undefined
  >({
    source: () => this._service.projects.value(),
    computation: (value, previous) => value ?? previous?.value
  })

  readonly items = computed(() => this._loaded()?.items ?? [])
  readonly total = computed(() => this._loaded()?.total ?? 0)
  readonly hasData = computed(() => this._loaded() !== undefined)

  /** Registros agrupados por su día (clave yyyy-mm-dd del campo fecha). */
  private readonly _byDay = computed(() => {
    const map = new Map<string, ProjectDto[]>()
    for (const item of this.items()) {
      const raw = (item as unknown as Record<string, unknown>)[this.stripDate]
      if (typeof raw !== 'string' || raw.length < 10) continue
      const key = raw.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
  })

  readonly periodLabel = computed(() => {
    const anchor = this.anchor()
    if (this.view() === 'day') {
      return anchor.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    }
    return anchor.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()
  })

  readonly cells = computed<CalendarCell[]>(() => (this.view() === 'month' ? this._monthCells() : this._weekCells()))

  readonly dayStrips = computed(() => this._byDay().get(this._keyOf(this.anchor())) ?? [])

  text(item: ProjectDto, key: string): string {
    return formatValue((item as unknown as Record<string, unknown>)[key])
  }

  stripColor(item: ProjectDto): string {
    const value = (item as unknown as Record<string, unknown>)[this.stripColorField]
    const entry = this.legend.find(e => e.value === value)
    return entry ? this.colorOf(entry.colorIndex) : 'var(--foreground)'
  }

  /** Paleta por posición del valor del enum: determinista e independiente del idioma. */
  colorOf(index: number): string {
    const palette = ['var(--foreground)', 'var(--destructive)', 'var(--primary)', 'var(--muted-foreground)']
    return palette[index % palette.length]
  }

  openCreate(day: string): void {
    this.editingProject.set(null)
    this.createDate.set(day)
    this.dialogOpen.set(true)
  }

  async onSave(value: ProjectFormValue): Promise<void> {
    const editing = this.editingProject()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        this._notify.success('Proyecto actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Proyecto creado correctamente')
      }
    } catch {
      this._notify.error(editing ? 'No se pudo actualizar el proyecto' : 'No se pudo crear el proyecto')
    }
  }

  previousPeriod(): void {
    this.anchor.update(anchor => this._shift(anchor, -1))
  }

  nextPeriod(): void {
    this.anchor.update(anchor => this._shift(anchor, 1))
  }

  private _shift(anchor: Date, direction: number): Date {
    const next = new Date(anchor)
    if (this.view() === 'month') next.setMonth(next.getMonth() + direction)
    else if (this.view() === 'week') next.setDate(next.getDate() + direction * 7)
    else next.setDate(next.getDate() + direction)
    return next
  }

  private _monthCells(): CalendarCell[] {
    const anchor = this.anchor()
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = this._startOfWeek(first)
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    const cells: CalendarCell[] = []
    for (let day = new Date(start); day <= last || day.getDay() !== 1; day.setDate(day.getDate() + 1)) {
      if (!this.weekends && (day.getDay() === 0 || day.getDay() === 6)) continue
      cells.push(this._cellOf(day, day.getMonth() === anchor.getMonth()))
      if (cells.length > 42) break
    }
    return cells
  }

  private _weekCells(): CalendarCell[] {
    const start = this._startOfWeek(this.anchor())
    const cells: CalendarCell[] = []
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(start)
      day.setDate(day.getDate() + offset)
      if (!this.weekends && (day.getDay() === 0 || day.getDay() === 6)) continue
      cells.push(this._cellOf(day, true))
    }
    return cells
  }

  private _cellOf(day: Date, inPeriod: boolean): CalendarCell {
    const key = this._keyOf(day)
    return {
      key,
      dayNumber: day.getDate(),
      inPeriod,
      isToday: key === this._keyOf(new Date()),
      strips: this._byDay().get(key) ?? []
    }
  }

  /** Lunes de la semana del día dado. */
  private _startOfWeek(day: Date): Date {
    const start = new Date(day)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return start
  }

  private _keyOf(day: Date): string {
    const month = String(day.getMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(day.getDate()).padStart(2, '0')
    return `${day.getFullYear()}-${month}-${dayOfMonth}`
  }

  open(item: ProjectDto): void {
    void this._router.navigate(['/sap-licensing/projects', item.id])
  }

  // @ai:begin calendar-extra — filtros o adornos propios de este calendario
  // @ai:end
}
