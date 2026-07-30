import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { provideIcons } from '@ng-icons/core'
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { SupplierDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { SupplierService, OffsetPaginatedOutput } from '../../../../../../core/services/supplier.service'
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
import { SupplierDialogComponent, SupplierFormValue } from './supplier-dialog.component'

@Component({
  selector: 'app-suppliers-list',
  imports: [DataTable, AppDialog, AppConfirmDialog, SupplierDialogComponent],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Proveedores</h1>
        <p class="text-muted-foreground">Proveedores del almacén</p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando proveedores…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los proveedores</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay proveedores registrados</p>
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
          createLabel="Nuevo proveedor"
          exportFilename="proveedores"
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
        <app-supplier-dialog [supplier]="editingSupplier()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar proveedor"
      [description]="deleteDescription()"
      (confirmed)="confirmDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class SuppliersListComponent {
  private readonly _service = inject(SupplierService)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/warehouse/suppliers')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.suppliers.isLoading
  readonly error = this._service.suppliers.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<SupplierDto> | undefined,
    OffsetPaginatedOutput<SupplierDto> | undefined
  >({
    source: () => this._service.suppliers.value(),
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
  readonly editingSupplier = signal<SupplierDto | null>(null)
  readonly deletingSupplier = signal<SupplierDto | null>(null)
  readonly deleteDialogOpen = signal(false)
  readonly deleteDescription = computed(
    () =>
      `Se eliminará permanentemente el proveedor "${this.deletingSupplier()?.name ?? ''}" y todos sus datos asociados. Esta acción no se puede deshacer.`
  )

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Proveedor', filterable: true, minWidth: 220 },
    { key: 'taxId', label: 'CIF', minWidth: 120 },
    { key: 'email', label: 'Email', sortable: false, minWidth: 220 },
    { key: 'phone', label: 'Teléfono', sortable: false, minWidth: 140 },
    { key: 'city', label: 'Ciudad', filterable: true, minWidth: 130 },
    { key: 'leadTimeDays', label: 'Plazo (días)', type: 'number', minWidth: 110 }
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
    this.editingSupplier.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const supplier = event.row as unknown as SupplierDto
    if (event.action === 'edit') {
      this.editingSupplier.set(supplier)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingSupplier.set(supplier)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const supplier = this.deletingSupplier()
    this.deleteDialogOpen.set(false)
    if (!supplier) {
      return
    }
    try {
      await this._service.remove(supplier.id)
      this._notify.success('Proveedor eliminado')
    } catch {
      this._notify.error('No se pudo eliminar el proveedor')
    }
  }

  async onSave(value: SupplierFormValue): Promise<void> {
    const editing = this.editingSupplier()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        this._notify.success('Proveedor actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Proveedor creado correctamente')
      }
    } catch {
      this._notify.error(editing ? 'No se pudo actualizar el proveedor' : 'No se pudo crear el proveedor')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
