import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core'
import { Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideEye, lucidePencil } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { CustomerDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { CustomerService, OffsetPaginatedOutput } from '../../../../../../core/services/customer.service'
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
import { CustomerDialogComponent, CustomerFormValue } from './customer-dialog.component'

@Component({
  selector: 'app-customers-list',
  imports: [DataTable, AppDialog, CustomerDialogComponent],
  providers: [provideIcons({ lucideEye, lucidePencil })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      @if (!embedded()) {
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Clientes</h1>
          <p class="text-muted-foreground">Gestión de clientes SAP</p>
        </div>
      }

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando clientes…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los clientes</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay clientes registrados</p>
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
          createLabel="Nuevo cliente"
          exportFilename="clientes"
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

    <app-dialog [open]="dialogOpen()" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-customer-dialog [customer]="editingCustomer()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>
  `
})
export class CustomersListComponent {
  /** Dentro del panel: la pantalla ya tiene su título, así que el listado no pinta el suyo (spec 52). */
  readonly embedded = input(false)

  private readonly _service = inject(CustomerService)
  private readonly _router = inject(Router)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/sap-licensing/customers')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.customers.isLoading
  readonly error = this._service.customers.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<CustomerDto> | undefined,
    OffsetPaginatedOutput<CustomerDto> | undefined
  >({
    source: () => this._service.customers.value(),
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
  readonly editingCustomer = signal<CustomerDto | null>(null)

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Nombre', filterable: true, minWidth: 220 },
    {
      key: 'status',
      label: 'Estado',
      sortable: false,
      minWidth: 120,
      type: 'badge',
      badgeMap: {
        active: { label: 'Activo', variant: 'outline' },
        archived: { label: 'Archivado', variant: 'secondary' }
      }
    },
    {
      key: 'customerType',
      label: 'Tipo',
      minWidth: 130,
      type: 'badge',
      badgeMap: {
        cloud: { label: 'Cloud', variant: 'default' },
        onprem: { label: 'On-prem', variant: 'secondary' },
        hybrid: { label: 'Hybrid', variant: 'outline' }
      }
    },
    { key: 'industry', label: 'Industria', filterable: true, minWidth: 180 },
    { key: 'taxId', label: 'CIF / NIF', filterable: true, minWidth: 130 },
    { key: 'city', label: 'Localidad', minWidth: 150 },
    { key: 'country', label: 'País', minWidth: 150 },
    { key: 'address', label: 'Dirección', sortable: false, minWidth: 250 },
    { key: 'phone', label: 'Teléfono', sortable: false, minWidth: 150 }
  ]

  // Editar solo para quien puede escribir: el backend responde 403 al viewer, así que ofrecer la
  // acción solo llevaría a un error.
  readonly actions = computed<TableAction[]>(() => [
    { icon: 'lucideEye', label: 'Ver ficha', action: 'view' },
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
    this.editingCustomer.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const customer = event.row as unknown as CustomerDto
    if (event.action === 'view') {
      this._router.navigate(['/sap-licensing/customers', customer.id])
    } else if (event.action === 'edit') {
      this.editingCustomer.set(customer)
      this.dialogOpen.set(true)
    }
  }

  async onSave(value: CustomerFormValue): Promise<void> {
    const editing = this.editingCustomer()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        this._notify.success('Cliente actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Cliente creado correctamente')
      }
    } catch {
      this._notify.error(editing ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
