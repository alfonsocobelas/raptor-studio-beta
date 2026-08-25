import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { Router } from '@angular/router'
import { ContractDto } from '@sap-licenses/shared/domain'
import { ContractService, OffsetPaginatedOutput } from '../../../../../../core/services/contract.service'
import { formatValue } from '../../../../../../shared/utils/format-value'

/**
 * Tablero de Contratos: la MISMA lectura del listado, con una columna por
 * valor de «Estado» y cada registro como tarjeta. Comparte servicio
 * y estado — no hay endpoint propio.
 * El campo es el de la máquina de estados: soltar una tarjeta dispara la transición
 * legal; las columnas sin transición desde el estado actual no aceptan el drop
 * (y el backend responde 409 si algo se cuela).
 */
@Component({
  selector: 'app-contracts-kanban',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Contratos</h1>
        <p class="text-muted-foreground">Gestión de contratos SAP y acuerdos de licenciamiento</p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando contratos…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los contratos</p>
      } @else {
        @if (moveError(); as message) {
          <p class="text-destructive text-sm" role="alert">{{ message }}</p>
        }
        <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + columns.length + ', minmax(0, 1fr))'">
          @for (column of columns; track column.value) {
            <section
              class="app-panel bg-card flex min-h-40 flex-col rounded-lg border transition-opacity"
              [class.opacity-40]="draggingFrom() !== null && !acceptsDrop(column.value)"
              [attr.data-column]="column.value"
              (dragover)="onDragOver($event, column.value)"
              (drop)="onDrop($event, column.value)"
            >
              <header class="app-panel-head flex items-center justify-between border-b px-3 py-2">
                <h2 class="text-xs font-semibold uppercase tracking-widest">{{ column.label }}</h2>
                <span class="text-muted-foreground text-xs">{{ cardsOf(column.value).length }}</span>
              </header>
              <div class="flex-1 space-y-2 p-2">
                @for (item of cardsOf(column.value); track item.id) {
                  <article
                    class="app-chip bg-background rounded-md border p-2 text-sm shadow-sm"
                    draggable="true"
                    (dragstart)="onDragStart($event, item)"
                    (dragend)="draggingFrom.set(null)"
                    role="button"
                    tabindex="0"
                    (click)="open(item)"
                    (keydown.enter)="open(item)"
                  >
                    <p class="truncate font-medium">{{ text(item, cardLabel) }}</p>
                  </article>
                }
              </div>
            </section>
          }
        </div>
        <p class="app-toolbar text-muted-foreground text-[10px] uppercase tracking-widest">
          Contratos · columnas por Estado · {{ total() }} en total
        </p>
      }
    </div>
  `
})
export class ContractsKanbanComponent {
  private readonly _service = inject(ContractService)
  private readonly _router = inject(Router)

  /** Campos y columnas: los decide el generador desde el modelo. */
  readonly boardField = 'status'
  readonly cardLabel = 'contractNumber'
  readonly columns: { value: string; label: string }[] = [
    { value: 'active', label: 'Activo' },
    { value: 'expiring', label: 'Por expirar' },
    { value: 'expired', label: 'Expirado' },
    { value: 'terminated', label: 'Terminado' }
  ]
  /** Movimientos legales de la máquina de estados; el resto de columnas no acepta el drop. */
  readonly legalMoves: { from: string; to: string; method: string }[] = [
    { from: 'active', to: 'terminated', method: 'terminate' },
    { from: 'expiring', to: 'terminated', method: 'terminate' },
    { from: 'expiring', to: 'expired', method: 'expire' }
  ]
  private readonly _transitions: Record<string, (id: string) => Promise<void>> = {
    terminate: id => this._service.terminate(id),
    expire: id => this._service.expire(id)
  }

  readonly draggingFrom = signal<string | null>(null)
  readonly moveError = signal<string | null>(null)

  readonly isLoading = this._service.contracts.isLoading
  readonly error = this._service.contracts.error

  // Igual que el listado: al recargar, resource() vacía value(); conservar la última
  // página evita que el tablero parpadee en cada movimiento.
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<ContractDto> | undefined,
    OffsetPaginatedOutput<ContractDto> | undefined
  >({
    source: () => this._service.contracts.value(),
    computation: (value, previous) => value ?? previous?.value
  })

  readonly items = computed(() => this._loaded()?.items ?? [])
  readonly total = computed(() => this._loaded()?.total ?? 0)
  readonly hasData = computed(() => this._loaded() !== undefined)

  private readonly _byColumn = computed(() => {
    const map = new Map<string, ContractDto[]>()
    for (const item of this.items()) {
      const value = String((item as unknown as Record<string, unknown>)[this.boardField] ?? '')
      map.set(value, [...(map.get(value) ?? []), item])
    }
    return map
  })

  cardsOf(value: string): ContractDto[] {
    return this._byColumn().get(value) ?? []
  }

  text(item: ContractDto, key: string): string {
    return formatValue((item as unknown as Record<string, unknown>)[key])
  }

  acceptsDrop(value: string): boolean {
    const from = this.draggingFrom()
    if (from === null || from === value) return false
    return this.legalMoves.some(move => move.from === from && move.to === value)
  }

  onDragStart(event: DragEvent, item: ContractDto): void {
    event.dataTransfer?.setData('text/plain', item.id)
    this.draggingFrom.set(String((item as unknown as Record<string, unknown>)[this.boardField] ?? ''))
  }

  onDragOver(event: DragEvent, value: string): void {
    if (this.acceptsDrop(value)) event.preventDefault()
  }

  onDrop(event: DragEvent, value: string): void {
    event.preventDefault()
    const id = event.dataTransfer?.getData('text/plain')
    const from = this.draggingFrom()
    const legal = this.acceptsDrop(value)
    this.draggingFrom.set(null)
    if (!id || from === null || !legal) return
    void this._move(id, from, value)
  }

  /** Sin optimismo: la tarjeta cambia de columna cuando el reload trae el nuevo valor. */
  private async _move(id: string, from: string, value: string): Promise<void> {
    this.moveError.set(null)
    try {
      const move = this.legalMoves.find(m => m.from === from && m.to === value)
      if (!move) return
      await this._transitions[move.method](id)
    } catch {
      this.moveError.set('No se pudo mover la tarjeta; vuelve a intentarlo')
    }
  }

  open(item: ContractDto): void {
    void this._router.navigate(['/sap-licensing/contracts', item.id])
  }

  // @ai:begin kanban-extra — filtros o adornos propios de este tablero
  // @ai:end
}
