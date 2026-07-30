import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { provideIcons } from '@ng-icons/core'
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { toast } from '@spartan-ng/brain/sonner'
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { VehicleDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { VehicleService, OffsetPaginatedOutput } from '../../../../../../core/services/vehicle.service'
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
import { VehicleDialogComponent, VehicleFormValue } from './vehicle-dialog.component'

@Component({
  selector: 'app-vehicles-list',
  imports: [DataTable, HlmDialogImports, HlmButtonImports, HlmAlertDialogImports, VehicleDialogComponent],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Vehículos</h1>
        <p class="text-muted-foreground">Inventario del concesionario</p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando vehículos…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los vehículos</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay vehículos registrados</p>
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
          createLabel="Nuevo vehículo"
          exportFilename="vehículos"
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
        <app-vehicle-dialog [vehicle]="editingVehicle()" (saved)="onSave($event)" />
      }
    </hlm-dialog>

    <hlm-alert-dialog [state]="deleteDialogOpen() ? 'open' : 'closed'" (closed)="deleteDialogOpen.set(false)">
      <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
        <hlm-alert-dialog-header>
          <h2 hlmAlertDialogTitle>Eliminar vehículo</h2>
          <p hlmAlertDialogDescription>
            Se eliminará permanentemente el vehículo "{{ deletingVehicle()?.plate }}" y todos sus datos asociados. Esta
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
export class VehiclesListComponent {
  private readonly _service = inject(VehicleService)
  protected readonly canWrite = inject(AuthService).canWrite

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/dealership/vehicles')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.vehicles.isLoading
  readonly error = this._service.vehicles.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<VehicleDto> | undefined,
    OffsetPaginatedOutput<VehicleDto> | undefined
  >({
    source: () => this._service.vehicles.value(),
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
  readonly editingVehicle = signal<VehicleDto | null>(null)
  readonly deletingVehicle = signal<VehicleDto | null>(null)
  readonly deleteDialogOpen = signal(false)

  readonly columns: ColumnDef[] = [
    { key: 'brand', label: 'Marca', filterable: true, minWidth: 140 },
    { key: 'model', label: 'Modelo', filterable: true, minWidth: 150 },
    { key: 'version', label: 'Versión', sortable: false, minWidth: 190 },
    { key: 'year', label: 'Año', type: 'number', minWidth: 90 },
    { key: 'mileage', label: 'Km', type: 'number', minWidth: 110 },
    {
      key: 'fuel',
      label: 'Combustible',
      filterable: true,
      minWidth: 130,
      type: 'badge',
      badgeMap: {
        gasoline: { label: 'Gasolina', variant: 'outline' },
        diesel: { label: 'Diésel', variant: 'secondary' },
        hybrid: { label: 'Híbrido', variant: 'default' },
        electric: { label: 'Eléctrico', variant: 'default' }
      }
    },
    { key: 'price', label: 'Precio', type: 'number', minWidth: 120 },
    { key: 'vin', label: 'VIN', sortable: false, minWidth: 170 },
    { key: 'plate', label: 'Matrícula', minWidth: 120 },
    {
      key: 'status',
      label: 'Estado',
      filterable: true,
      minWidth: 120,
      type: 'badge',
      badgeMap: {
        stock: { label: 'En stock', variant: 'default' },
        reserved: { label: 'Reservado', variant: 'secondary' },
        sold: { label: 'Vendido', variant: 'outline' },
        workshop: { label: 'En taller', variant: 'secondary' }
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
    this.editingVehicle.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const vehicle = event.row as unknown as VehicleDto
    if (event.action === 'edit') {
      this.editingVehicle.set(vehicle)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingVehicle.set(vehicle)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const vehicle = this.deletingVehicle()
    this.deleteDialogOpen.set(false)
    if (!vehicle) {
      return
    }
    try {
      await this._service.remove(vehicle.id)
      toast.success('Vehículo eliminado')
    } catch {
      toast.error('No se pudo eliminar el vehículo')
    }
  }

  async onSave(value: VehicleFormValue): Promise<void> {
    const editing = this.editingVehicle()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        toast.success('Vehículo actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        toast.success('Vehículo creado correctamente')
      }
    } catch {
      toast.error(editing ? 'No se pudo actualizar el vehículo' : 'No se pudo crear el vehículo')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
