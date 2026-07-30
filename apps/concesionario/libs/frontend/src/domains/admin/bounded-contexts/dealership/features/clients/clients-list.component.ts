import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { provideIcons } from '@ng-icons/core'
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { toast } from '@spartan-ng/brain/sonner'
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { ClientDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { ClientService, OffsetPaginatedOutput } from '../../../../../../core/services/client.service'
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
import { ClientDialogComponent, ClientFormValue } from './client-dialog.component'

@Component({
  selector: 'app-clients-list',
  imports: [DataTable, HlmDialogImports, HlmButtonImports, HlmAlertDialogImports, ClientDialogComponent],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Clientes</h1>
        <p class="text-muted-foreground">Cartera de clientes</p>
      </div>

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

    <hlm-dialog [state]="dialogOpen() ? 'open' : 'closed'" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-client-dialog [client]="editingClient()" (saved)="onSave($event)" />
      }
    </hlm-dialog>

    <hlm-alert-dialog [state]="deleteDialogOpen() ? 'open' : 'closed'" (closed)="deleteDialogOpen.set(false)">
      <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
        <hlm-alert-dialog-header>
          <h2 hlmAlertDialogTitle>Eliminar cliente</h2>
          <p hlmAlertDialogDescription>
            Se eliminará permanentemente el cliente "{{ deletingClient()?.name }}" y todos sus datos asociados. Esta
            acción no se puede deshacer.
          </p>
        </hlm-alert-dialog-header>
        <hlm-alert-dialog-footer>
          <button hlmAlertDialogCancel (click)="ctx.close()">Cancelar</button>
          <button hlmAlertDialogAction (click)="confirmDelete(); ctx.close()">Eliminar</button>
        </hlm-alert-dialog-footer>
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
  `
})
export class ClientsListComponent {
  private readonly _service = inject(ClientService)
  protected readonly canWrite = inject(AuthService).canWrite

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/dealership/clients')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.clients.isLoading
  readonly error = this._service.clients.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<ClientDto> | undefined,
    OffsetPaginatedOutput<ClientDto> | undefined
  >({
    source: () => this._service.clients.value(),
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
  readonly editingClient = signal<ClientDto | null>(null)
  readonly deletingClient = signal<ClientDto | null>(null)
  readonly deleteDialogOpen = signal(false)

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Nombre', filterable: true, minWidth: 220 },
    {
      key: 'clientType',
      label: 'Tipo',
      filterable: true,
      minWidth: 120,
      type: 'badge',
      badgeMap: {
        individual: { label: 'Particular', variant: 'outline' },
        company: { label: 'Empresa', variant: 'secondary' }
      }
    },
    { key: 'taxId', label: 'DNI / CIF', minWidth: 120 },
    { key: 'email', label: 'Email', sortable: false, minWidth: 220 },
    { key: 'phone', label: 'Teléfono', sortable: false, minWidth: 140 },
    { key: 'city', label: 'Localidad', filterable: true, minWidth: 140 }
  ]

  // Un viewer no ve ninguna: son escrituras que el backend rechazaría con 403.
  readonly actions = computed<TableAction[]>(() =>
    this.canWrite()
      ? [
          { icon: 'lucidePencil', label: 'Editar', action: 'edit' },
          { icon: 'lucideTrash2', label: 'Eliminar', action: 'delete', variant: 'ghost' }
        ]
      : []
  )

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
    this.editingClient.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const client = event.row as unknown as ClientDto
    if (event.action === 'edit') {
      this.editingClient.set(client)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingClient.set(client)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const client = this.deletingClient()
    this.deleteDialogOpen.set(false)
    if (!client) {
      return
    }
    try {
      await this._service.remove(client.id)
      toast.success('Cliente eliminado')
    } catch {
      toast.error('No se pudo eliminar el cliente')
    }
  }

  async onSave(value: ClientFormValue): Promise<void> {
    const editing = this.editingClient()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        toast.success('Cliente actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        toast.success('Cliente creado correctamente')
      }
    } catch {
      toast.error(editing ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
