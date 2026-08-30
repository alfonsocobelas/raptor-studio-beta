import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { NgIcon } from '@ng-icons/core'
import { lucideArrowLeft, lucidePencil } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { ContractDialogComponent, ContractFormValue } from './contract-dialog.component'
import { ContractDto } from '@sap-licenses/shared/domain'
import { ContractService } from '../../../../../../core/services/contract.service'
import { formatValue } from '../../../../../../shared/utils/format-value'
import { RelatedTable } from '../../../../../../shared/components/related-table'

/** Una fila de la ficha: qué campo, cómo se llama y cómo se formatea. */
interface DetailRow {
  key: string
  label: string
  type?: 'date' | 'number' | 'boolean'
  /** Etiquetas de un conjunto cerrado: el valor guardado se lee como en el listado */
  labels?: Record<string, string>
}

/**
 * Ficha de Contratos: el destino de la acción «ver» del listado. Carga el
 * registro por el id de la ruta y muestra sus campos; las escrituras reutilizan
 * el mismo diálogo y la misma confirmación que el listado.
 */
@Component({
  selector: 'app-contract-detail',
  imports: [NgIcon, RelatedTable, AppDialog, ContractDialogComponent],
  providers: [provideIcons({ lucideArrowLeft, lucidePencil })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <button type="button" class="text-muted-foreground flex items-center gap-2 text-sm" (click)="back()">
        <ng-icon name="lucideArrowLeft" size="16" />
        Volver a Contratos
      </button>

      @if (loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando contratos…</p>
      } @else if (notFound()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No se encontró el registro solicitado.</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los contratos</p>
      } @else if (contract(); as item) {
        <div class="flex items-start justify-between gap-4">
          <h1 class="text-2xl font-bold tracking-tight">{{ item.contractNumber }}</h1>
          <div class="app-toolbar flex gap-2">
            @if (canWrite() && ['active', 'expiring'].includes(item.status)) {
              <button
                type="button"
                class="border-input hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                [disabled]="transitioning()"
                data-testid="transition-terminate"
                (click)="terminate(item.id, item.version)"
              >
                Terminar
              </button>
            }
            @if (canWrite()) {
              <button
                type="button"
                class="border-input hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                (click)="openEdit(item)"
              >
                <ng-icon name="lucidePencil" size="16" />
                Editar
              </button>
            }
          </div>
        </div>

        <dl class="app-panel bg-card grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-6 sm:grid-cols-2">
          @for (row of rows; track row.key) {
            <div class="min-w-0">
              <dt class="text-muted-foreground text-xs uppercase tracking-wide">{{ row.label }}</dt>
              <dd class="truncate text-sm font-medium">{{ format(item, row) }}</dd>
            </div>
          }
        </dl>

        <app-related-table
          title="Licencias"
          endpoint="/api/v1/licenses"
          field="contractId"
          [value]="item.id"
          [columns]="[
            { key: 'customerName', label: 'Cliente' },
            { key: 'subSolutionAreaName', label: 'Solución' },
            { key: 'contractNumber', label: 'Contrato' },
            { key: 'metric', label: 'Métrica' }
          ]"
          route="/sap-licensing/licenses"
        />
      }
    </div>

    <app-dialog [open]="dialogOpen()" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-contract-dialog [contract]="contract()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>
  `
})
export class ContractDetailComponent {
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _service = inject(ContractService)
  private readonly _auth = inject(AuthService)
  private readonly _notify = inject(NotificationService)

  protected readonly canWrite = computed(() => this._auth.canWrite())

  readonly contract = signal<ContractDto | null>(null)
  readonly loading = signal(true)
  readonly notFound = signal(false)
  readonly error = signal(false)
  readonly dialogOpen = signal(false)

  /** Filas derivadas del modelo: el generador decide qué se ve y en qué orden. */
  readonly rows: DetailRow[] = [
    {
      key: 'contractType',
      label: 'Tipo',
      labels: { cloud: 'Cloud', onprem: 'On-premise', mixed: 'Mixto', maintenance: 'Mantenimiento' }
    },
    { key: 'customerName', label: 'Cliente' },
    { key: 'isFavorite', label: 'Marcar como favorito', type: 'boolean' },
    {
      key: 'status',
      label: 'Estado',
      labels: { active: 'Activo', expiring: 'Por expirar', expired: 'Expirado', terminated: 'Terminado' }
    },
    { key: 'source', label: 'Origen' },
    { key: 'startDate', label: 'Inicio', type: 'date' },
    { key: 'endDate', label: 'Fin', type: 'date' },
    { key: 'totalValue', label: 'Valor total', type: 'number' },
    { key: 'currency', label: 'Moneda' },
    { key: 'billingFrequency', label: 'Facturación' },
    { key: 'renewalType', label: 'Renovación' },
    { key: 'notes', label: 'Notas internas' }
  ]

  constructor() {
    void this.load()
  }

  async load(): Promise<void> {
    const id = this._route.snapshot.paramMap.get('id')
    if (!id) {
      this.notFound.set(true)
      this.loading.set(false)
      return
    }
    try {
      this.contract.set(await this._service.findOne(id))
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 404) this.notFound.set(true)
      else this.error.set(true)
    } finally {
      this.loading.set(false)
    }
  }

  back(): void {
    void this._router.navigate(['/sap-licensing/contracts'])
  }

  /** Un valor se lee igual aquí que en el listado: mismo formateador (kernel). */
  format(item: ContractDto, row: DetailRow): string {
    const value = (item as unknown as Record<string, unknown>)[row.key]
    return formatValue(value, { type: row.type, labels: row.labels })
  }

  openEdit(item: ContractDto): void {
    this.contract.set(item)
    this.dialogOpen.set(true)
  }

  async onSave(value: ContractFormValue): Promise<void> {
    const current = this.contract()
    if (!current) return
    try {
      await this._service.update(current.id, { ...value, version: current.version })
      this.dialogOpen.set(false)
      this._notify.success('Contrato actualizado correctamente')
      await this.load()
    } catch {
      this._notify.error('No se pudo actualizar el contrato')
    }
  }

  /** Una transición en vuelo deshabilita todos los botones: no hay dobles saltos. */
  readonly transitioning = signal(false)

  /** Transición «Terminar» (spec 43): un 409 es el estado rechazándola — avisa y recarga. */
  async terminate(id: string, version: number): Promise<void> {
    this.transitioning.set(true)
    try {
      await this._service.terminate(id, version)
    } catch (e) {
      const message = (e as { error?: { message?: string } }).error?.message
      this._notify.error(message ?? 'No se pudo aplicar «Terminar»')
    } finally {
      this.transitioning.set(false)
      await this.load()
    }
  }

  // @ai:begin detail-extra — bloques propios de esta ficha (relaciones, acciones de dominio)
  // @ai:end
}
