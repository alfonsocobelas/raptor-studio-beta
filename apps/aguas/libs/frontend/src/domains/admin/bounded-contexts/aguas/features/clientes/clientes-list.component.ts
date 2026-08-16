import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { ClienteDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { ClienteService, OffsetPaginatedOutput } from '../../../../../../core/services/cliente.service'
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
import { ClienteDialogComponent, ClienteFormValue } from './cliente-dialog.component'

@Component({
  selector: 'app-clientes-list',
  imports: [DataTable, RouterLink, AppDialog, AppConfirmDialog, ClienteDialogComponent],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Clientes</h1>
          <p class="text-muted-foreground"></p>
        </div>
        <div class="flex items-center gap-3">
          <a
            routerLink="//aguas/clientes/papelera"
            class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >Papelera</a
          >
        </div>
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

    <app-dialog [open]="dialogOpen()" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-cliente-dialog [cliente]="editingCliente()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar cliente"
      [description]="deleteDescription()"
      (confirmed)="confirmDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class ClientesListComponent {
  private readonly _service = inject(ClienteService)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/aguas/clientes')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.clientes.isLoading
  readonly error = this._service.clientes.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<ClienteDto> | undefined,
    OffsetPaginatedOutput<ClienteDto> | undefined
  >({
    source: () => this._service.clientes.value(),
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
  readonly editingCliente = signal<ClienteDto | null>(null)
  readonly deletingCliente = signal<ClienteDto | null>(null)
  readonly deleteDialogOpen = signal(false)
  readonly deleteDescription = computed(
    () =>
      `Se archivará el cliente "${this.deletingCliente()?.nombre ?? ''}" y sus registros relacionados. Podrás restaurarlo desde la papelera.`
  )

  readonly columns: ColumnDef[] = [
    { key: 'nombre', label: 'Nombre', minWidth: 120 },
    {
      key: 'tipo',
      label: 'Tipo',
      filterable: true,
      minWidth: 140,
      type: 'badge',
      badgeMap: {
        ayuntamiento: { label: 'Ayuntamiento', variant: 'default' },
        regantes: { label: 'Comunidad de regantes', variant: 'secondary' },
        alimentacion: { label: 'Empresa de alimentación', variant: 'outline' }
      }
    },
    { key: 'telefono', label: 'Teléfono', minWidth: 120 },
    { key: 'localidad', label: 'Localidad', minWidth: 120 }
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
    this.editingCliente.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const cliente = event.row as unknown as ClienteDto
    if (event.action === 'edit') {
      this.editingCliente.set(cliente)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingCliente.set(cliente)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const cliente = this.deletingCliente()
    this.deleteDialogOpen.set(false)
    if (!cliente) {
      return
    }
    try {
      await this._service.remove(cliente.id)
      this._notify.success('Cliente eliminado')
    } catch {
      this._notify.error('No se pudo eliminar el cliente')
    }
  }

  async onSave(value: ClienteFormValue): Promise<void> {
    const editing = this.editingCliente()
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
