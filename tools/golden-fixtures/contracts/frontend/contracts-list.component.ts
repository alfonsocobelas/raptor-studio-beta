import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideEye, lucidePencil } from '@ng-icons/lucide'
import { toast } from '@spartan-ng/brain/sonner'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { ContractDto, ExportFormat } from '@sap-licenses/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { ContractService, OffsetPaginatedOutput } from '../../../../../../core/services/contract.service'
import { BILLING_FREQUENCY_LABELS } from './contract-labels'
import { generateId } from '../../../../../../shared/utils/uuid'
import { navigationCameFrom } from '../../../../../../shared/utils/navigation'
import {
  ColumnDef,
  ColumnFilter,
  DataTable,
  SortOrder,
  TableAction
} from '../../../../../../shared/components/data-table'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { ContractDialogComponent, ContractFormValue } from './contract-dialog.component'

@Component({
  selector: 'app-contracts-list',
  imports: [DataTable, HlmDialogImports, HlmButtonImports, ContractDialogComponent],
  providers: [provideIcons({ lucideEye, lucidePencil })],
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
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay contratos registrados</p>
      } @else {
        <app-data-table
          [columns]="columns"
          [data]="rows()"
          [serverSide]="true"
          [total]="total()"
          [page]="currentPage()"
          [pageSize]="pageSize()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          [search]="search()"
          [loading]="isLoading()"
          [showCreate]="canWrite()"
          createLabel="Nuevo contrato"
          exportFilename="contratos"
          [actions]="actions()"
          (create)="openCreate()"
          (actionClick)="onAction($event)"
          (pageChange)="onPage($event)"
          (pageSizeChange)="onPageSize($event)"
          (sortChange)="onSort($event)"
          (searchChange)="onSearch($event)"
          (filtersChange)="onFilters($event)"
          (exportRequested)="onExport($event)"
        />
      }
    </div>

    <hlm-dialog [state]="dialogOpen() ? 'open' : 'closed'" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-contract-dialog [contract]="editingContract()" (saved)="onSave($event)" />
      }
    </hlm-dialog>
  `
})
export class ContractsListComponent {
  private readonly _service = inject(ContractService)
  private readonly _router = inject(Router)
  protected readonly canWrite = inject(AuthService).canWrite

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/sap-licensing/contracts')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.contracts.isLoading
  readonly error = this._service.contracts.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<ContractDto> | undefined,
    OffsetPaginatedOutput<ContractDto> | undefined
  >({
    source: () => this._service.contracts.value(),
    computation: (value, previous) => value ?? previous?.value
  })

  readonly rows = computed(() => (this._loaded()?.items ?? []) as unknown as Record<string, unknown>[])
  readonly total = computed(() => this._loaded()?.total ?? 0)
  readonly hasData = computed(() => this._loaded() !== undefined)
  readonly currentPage = computed(() => this._service.request().page)
  readonly pageSize = computed(() => this._service.request().pageSize)
  readonly sortColumn = computed(() => this._service.request().orders?.[0]?.orderBy ?? '')
  readonly sortDirection = computed(() => this._service.request().orders?.[0]?.orderType ?? 'asc')
  // With an active search, zero results must keep the table (and the search box) mounted.
  readonly search = computed(() => this._service.request().search ?? '')
  // Same for an active column filter: hiding the table would trap the user with an unclearable filter.
  readonly hasActiveFilters = computed(() => (this._service.request().filters?.length ?? 0) > 0)

  readonly dialogOpen = signal(false)
  readonly editingContract = signal<ContractDto | null>(null)

  readonly columns: ColumnDef[] = [
    { key: 'contractNumber', label: 'Nº Contrato', filterable: true, minWidth: 180 },
    { key: 'customerName', label: 'Cliente', filterable: true, minWidth: 200 },
    {
      key: 'contractType',
      label: 'Tipo',
      filterable: true,
      sortable: false,
      minWidth: 110,
      type: 'badge',
      badgeMap: {
        cloud: { label: 'Cloud', variant: 'default' },
        onprem: { label: 'On-premise', variant: 'secondary' },
        mixed: { label: 'Mixto', variant: 'outline' },
        maintenance: { label: 'Mantenimiento', variant: 'outline' }
      }
    },
    { key: 'startDate', label: 'Inicio', type: 'date', minWidth: 120 },
    { key: 'endDate', label: 'Fin', type: 'date', minWidth: 120 },
    {
      key: 'status',
      label: 'Estado',
      filterable: true,
      minWidth: 120,
      type: 'badge',
      badgeMap: {
        active: { label: 'Activo', variant: 'default' },
        expiring: { label: 'Por expirar', variant: 'outline' },
        expired: { label: 'Expirado', variant: 'secondary' },
        terminated: { label: 'Terminado', variant: 'destructive' }
      }
    },
    { key: 'totalValue', label: 'Valor total', type: 'number', minWidth: 140 },
    {
      key: 'billingFrequency',
      label: 'Facturación',
      sortable: false,
      minWidth: 120,
      valueMap: BILLING_FREQUENCY_LABELS
    }
  ]

  // Editar solo para quien puede escribir: el backend responde 403 al viewer, así que ofrecer la
  // acción solo llevaría a un error.
  readonly actions = computed<TableAction[]>(() => [
    { icon: 'lucideEye', label: 'Ver detalle', action: 'view' },
    ...(this.canWrite() ? [{ icon: 'lucidePencil', label: 'Editar', action: 'edit' } as TableAction] : [])
  ])

  onPage(page: number): void {
    this._service.request.update(r => ({ ...r, page }))
  }

  onPageSize(pageSize: number): void {
    this._service.request.update(r => ({ ...r, pageSize, page: 1 }))
  }

  async onExport(format: ExportFormat): Promise<void> {
    const { blob, filename } = await this._service.export(format)
    downloadBlob(blob, filename)
  }

  onSort(sort: SortOrder | null): void {
    this._service.request.update(r => ({ ...r, orders: sort ? [sort] : undefined, page: 1 }))
  }

  onSearch(search: string): void {
    this._service.request.update(r => ({ ...r, search: search || undefined, page: 1 }))
  }

  onFilters(filters: ColumnFilter[]): void {
    this._service.request.update(r => ({ ...r, filters, page: 1 }))
  }

  openCreate(): void {
    this.editingContract.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const contract = event.row as unknown as ContractDto
    if (event.action === 'view') {
      this._router.navigate(['/sap-licensing/contracts', contract.id])
    } else if (event.action === 'edit') {
      this.editingContract.set(contract)
      this.dialogOpen.set(true)
    }
  }

  async onSave(value: ContractFormValue): Promise<void> {
    const editing = this.editingContract()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        toast.success('Contrato actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        toast.success('Contrato creado correctamente')
      }
    } catch {
      toast.error(editing ? 'No se pudo actualizar el contrato' : 'No se pudo crear el contrato')
    }
  }
}
