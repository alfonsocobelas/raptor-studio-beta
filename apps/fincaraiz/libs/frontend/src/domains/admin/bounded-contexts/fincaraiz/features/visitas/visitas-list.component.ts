import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideEye, lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { VisitaDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { VisitaService, OffsetPaginatedOutput } from '../../../../../../core/services/visita.service'
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
import { VisitaDialogComponent, VisitaFormValue } from './visita-dialog.component'

@Component({
  selector: 'app-visitas-list',
  imports: [DataTable, AppDialog, AppConfirmDialog, VisitaDialogComponent],
  providers: [provideIcons({ lucideEye, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Visitas</h1>
        <p class="text-muted-foreground"></p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando visitas…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las visitas</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay visitas registradas</p>
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
          createLabel="Nueva visita"
          exportFilename="visitas"
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
        <app-visita-dialog [visita]="editingVisita()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar visita"
      [description]="deleteDescription()"
      (confirmed)="confirmDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class VisitasListComponent {
  private readonly _service = inject(VisitaService)
  private readonly _router = inject(Router)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/fincaraiz/visitas')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.visitas.isLoading
  readonly error = this._service.visitas.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<VisitaDto> | undefined,
    OffsetPaginatedOutput<VisitaDto> | undefined
  >({
    source: () => this._service.visitas.value(),
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
  readonly editingVisita = signal<VisitaDto | null>(null)
  readonly deletingVisita = signal<VisitaDto | null>(null)
  readonly deleteDialogOpen = signal(false)
  readonly deleteDescription = computed(
    () =>
      `Se eliminará permanentemente la visita "${this.deletingVisita()?.referencia ?? ''}" y todos sus datos asociados. Esta acción no se puede deshacer.`
  )

  readonly columns: ColumnDef[] = [
    { key: 'referencia', label: 'Referencia', minWidth: 120 },
    { key: 'fecha', label: 'Fecha', type: 'date', minWidth: 120 },
    { key: 'interesado', label: 'Interesado', minWidth: 120 },
    { key: 'observaciones', label: 'Observaciones', minWidth: 120 },
    { key: 'confirmada', label: 'Confirmada', type: 'boolean', minWidth: 120 },
    { key: 'propiedadName', label: 'Propiedad', filterable: true, minWidth: 180 }
  ]

  // Editar y borrar solo para quien puede escribir: el backend responde 403 al viewer, así que
  // ofrecer la acción solo llevaría a un error. La ficha no sustituye a la papelera: si el schema
  // declara la entidad borrable, se borra desde la fila igual que sin ficha.
  readonly actions = computed<TableAction[]>(() => [
    { icon: 'lucideEye', label: 'Ver ficha', action: 'view' },
    ...(this.canWrite()
      ? ([
          { icon: 'lucidePencil', label: 'Editar', action: 'edit' },
          { icon: 'lucideTrash2', label: 'Eliminar', action: 'delete', variant: 'ghost' }
        ] as TableAction[])
      : [])
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
    this.editingVisita.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const visita = event.row as unknown as VisitaDto
    if (event.action === 'view') {
      this._router.navigate(['/fincaraiz/visitas', visita.id])
    } else if (event.action === 'edit') {
      this.editingVisita.set(visita)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingVisita.set(visita)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const visita = this.deletingVisita()
    this.deleteDialogOpen.set(false)
    if (!visita) {
      return
    }
    try {
      await this._service.remove(visita.id)
      this._notify.success('Visita eliminada')
    } catch {
      this._notify.error('No se pudo eliminar la visita')
    }
  }

  async onSave(value: VisitaFormValue): Promise<void> {
    const editing = this.editingVisita()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        this._notify.success('Visita actualizada correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Visita creada correctamente')
      }
    } catch {
      this._notify.error(editing ? 'No se pudo actualizar la visita' : 'No se pudo crear la visita')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
