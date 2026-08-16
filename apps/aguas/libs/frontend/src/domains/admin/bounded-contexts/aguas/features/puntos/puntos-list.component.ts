import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { PuntoDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { PuntoService, OffsetPaginatedOutput } from '../../../../../../core/services/punto.service'
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
import { PuntoDialogComponent, PuntoFormValue } from './punto-dialog.component'

@Component({
  selector: 'app-puntos-list',
  imports: [DataTable, RouterLink, AppDialog, AppConfirmDialog, PuntoDialogComponent],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Puntos de muestreo</h1>
          <p class="text-muted-foreground"></p>
        </div>
        <div class="flex items-center gap-3">
          <a
            routerLink="//aguas/puntos/papelera"
            class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >Papelera</a
          >
        </div>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando puntos de muestreo…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los puntos de muestreo</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay puntos de muestreo registrados</p>
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
          createLabel="Nuevo punto de muestreo"
          exportFilename="puntos de muestreo"
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
        <app-punto-dialog [punto]="editingPunto()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar punto de muestreo"
      [description]="deleteDescription()"
      (confirmed)="confirmDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class PuntosListComponent {
  private readonly _service = inject(PuntoService)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/aguas/puntos')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.puntos.isLoading
  readonly error = this._service.puntos.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<PuntoDto> | undefined,
    OffsetPaginatedOutput<PuntoDto> | undefined
  >({
    source: () => this._service.puntos.value(),
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
  readonly editingPunto = signal<PuntoDto | null>(null)
  readonly deletingPunto = signal<PuntoDto | null>(null)
  readonly deleteDialogOpen = signal(false)
  readonly deleteDescription = computed(
    () =>
      `Se archivará el punto de muestreo "${this.deletingPunto()?.nombre ?? ''}" y sus registros relacionados. Podrás restaurarlo desde la papelera.`
  )

  readonly columns: ColumnDef[] = [
    { key: 'nombre', label: 'Nombre', minWidth: 120 },
    {
      key: 'tipoAgua',
      label: 'Tipo de agua',
      filterable: true,
      minWidth: 140,
      type: 'badge',
      badgeMap: {
        potable: { label: 'Potable', variant: 'default' },
        riego: { label: 'Riego', variant: 'secondary' },
        residual: { label: 'Residual', variant: 'outline' },
        proceso: { label: 'De proceso', variant: 'destructive' }
      }
    },
    { key: 'direccion', label: 'Dirección', minWidth: 120 },
    { key: 'coordenadas', label: 'Coordenadas', minWidth: 120 },
    { key: 'obligatorio', label: 'Control obligatorio', type: 'boolean', minWidth: 120 },
    { key: 'clienteName', label: 'Cliente', filterable: true, minWidth: 180 }
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
    this.editingPunto.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const punto = event.row as unknown as PuntoDto
    if (event.action === 'edit') {
      this.editingPunto.set(punto)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingPunto.set(punto)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const punto = this.deletingPunto()
    this.deleteDialogOpen.set(false)
    if (!punto) {
      return
    }
    try {
      await this._service.remove(punto.id)
      this._notify.success('Punto de muestreo eliminado')
    } catch {
      this._notify.error('No se pudo eliminar el punto de muestreo')
    }
  }

  async onSave(value: PuntoFormValue): Promise<void> {
    const editing = this.editingPunto()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        this._notify.success('Punto de muestreo actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Punto de muestreo creado correctamente')
      }
    } catch {
      this._notify.error(
        editing ? 'No se pudo actualizar el punto de muestreo' : 'No se pudo crear el punto de muestreo'
      )
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
