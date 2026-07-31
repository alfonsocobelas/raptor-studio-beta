import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { provideIcons } from '@ng-icons/core'
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { GarmentDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { GarmentService, OffsetPaginatedOutput } from '../../../../../../core/services/garment.service'
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
import { GarmentDialogComponent, GarmentFormValue } from './garment-dialog.component'

@Component({
  selector: 'app-garments-list',
  imports: [DataTable, AppDialog, AppConfirmDialog, GarmentDialogComponent],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Prendas</h1>
        <p class="text-muted-foreground">Inventario del almacén</p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando prendas…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las prendas</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay prendas registradas</p>
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
          createLabel="Nueva prenda"
          exportFilename="prendas"
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
        <app-garment-dialog [garment]="editingGarment()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar prenda"
      [description]="deleteDescription()"
      (confirmed)="confirmDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class GarmentsListComponent {
  private readonly _service = inject(GarmentService)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/warehouse/garments')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.garments.isLoading
  readonly error = this._service.garments.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<GarmentDto> | undefined,
    OffsetPaginatedOutput<GarmentDto> | undefined
  >({
    source: () => this._service.garments.value(),
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
  readonly editingGarment = signal<GarmentDto | null>(null)
  readonly deletingGarment = signal<GarmentDto | null>(null)
  readonly deleteDialogOpen = signal(false)
  readonly deleteDescription = computed(
    () =>
      `Se eliminará permanentemente la prenda "${this.deletingGarment()?.name ?? ''}" y todos sus datos asociados. Esta acción no se puede deshacer.`
  )

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Prenda', filterable: true, minWidth: 220 },
    { key: 'sku', label: 'SKU', minWidth: 130 },
    {
      key: 'category',
      label: 'Categoría',
      filterable: true,
      minWidth: 130,
      type: 'badge',
      badgeMap: {
        tshirt: { label: 'Camisetas', variant: 'outline' },
        trousers: { label: 'Pantalones', variant: 'secondary' },
        dress: { label: 'Vestidos', variant: 'default' },
        jacket: { label: 'Abrigos', variant: 'secondary' },
        accessory: { label: 'Accesorios', variant: 'outline' }
      }
    },
    { key: 'size', label: 'Talla', filterable: true, minWidth: 90 },
    { key: 'brand', label: 'Marca', filterable: true, minWidth: 130 },
    { key: 'color', label: 'Color', minWidth: 110 },
    { key: 'price', label: 'Precio', type: 'number', minWidth: 100 },
    { key: 'stock', label: 'Stock', type: 'number', minWidth: 90 },
    {
      key: 'status',
      label: 'Estado',
      filterable: true,
      minWidth: 130,
      type: 'badge',
      badgeMap: {
        active: { label: 'Activa', variant: 'default' },
        discontinued: { label: 'Descatalogada', variant: 'secondary' }
      }
    }
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
    this.editingGarment.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const garment = event.row as unknown as GarmentDto
    if (event.action === 'edit') {
      this.editingGarment.set(garment)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingGarment.set(garment)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const garment = this.deletingGarment()
    this.deleteDialogOpen.set(false)
    if (!garment) {
      return
    }
    try {
      await this._service.remove(garment.id)
      this._notify.success('Prenda eliminada')
    } catch {
      this._notify.error('No se pudo eliminar la prenda')
    }
  }

  async onSave(value: GarmentFormValue): Promise<void> {
    const editing = this.editingGarment()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        this._notify.success('Prenda actualizada correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Prenda creada correctamente')
      }
    } catch {
      this._notify.error(editing ? 'No se pudo actualizar la prenda' : 'No se pudo crear la prenda')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
