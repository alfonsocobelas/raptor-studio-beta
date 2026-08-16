import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideEye, lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { MuestraDto, ExportFormat } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { MuestraService, OffsetPaginatedOutput } from '../../../../../../core/services/muestra.service'
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
import { MuestraDialogComponent, MuestraFormValue } from './muestra-dialog.component'

@Component({
  selector: 'app-muestras-list',
  imports: [DataTable, RouterLink, AppDialog, AppConfirmDialog, MuestraDialogComponent],
  providers: [provideIcons({ lucideEye, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Muestras</h1>
          <p class="text-muted-foreground"></p>
        </div>
        <div class="flex items-center gap-3">
          <a
            routerLink="//aguas/muestras/papelera"
            class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >Papelera</a
          >
        </div>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando muestras…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las muestras</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay muestras registradas</p>
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
          createLabel="Nueva muestra"
          exportFilename="muestras"
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
        <app-muestra-dialog [muestra]="editingMuestra()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar muestra"
      [description]="deleteDescription()"
      (confirmed)="confirmDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class MuestrasListComponent {
  private readonly _service = inject(MuestraService)
  private readonly _router = inject(Router)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/aguas/muestras')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.muestras.isLoading
  readonly error = this._service.muestras.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<MuestraDto> | undefined,
    OffsetPaginatedOutput<MuestraDto> | undefined
  >({
    source: () => this._service.muestras.value(),
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
  readonly editingMuestra = signal<MuestraDto | null>(null)
  readonly deletingMuestra = signal<MuestraDto | null>(null)
  readonly deleteDialogOpen = signal(false)
  readonly deleteDescription = computed(
    () => `Se archivará la muestra "${this.deletingMuestra()?.codigo ?? ''}". Podrás restaurarla desde la papelera.`
  )

  readonly columns: ColumnDef[] = [
    { key: 'codigo', label: 'Código', minWidth: 120 },
    {
      key: 'estado',
      label: 'Estado',
      filterable: true,
      minWidth: 140,
      type: 'badge',
      badgeMap: {
        recibida: { label: 'Recibida', variant: 'default' },
        en_analisis: { label: 'En análisis', variant: 'secondary' },
        fuera_de_rango: { label: 'Fuera de rango', variant: 'outline' },
        validada: { label: 'Validada', variant: 'destructive' },
        informada: { label: 'Informada', variant: 'default' },
        facturada: { label: 'Facturada', variant: 'secondary' }
      }
    },
    { key: 'tecnico', label: 'Técnico', minWidth: 120 },
    { key: 'recogida', label: 'Recogida', type: 'date', minWidth: 120 },
    { key: 'limiteInforme', label: 'Límite de informe', type: 'date', minWidth: 120 },
    { key: 'importe', label: 'Importe', type: 'number', minWidth: 120 },
    { key: 'puntoName', label: 'Punto de muestreo', filterable: true, minWidth: 180 }
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
    this.editingMuestra.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const muestra = event.row as unknown as MuestraDto
    if (event.action === 'view') {
      this._router.navigate(['/aguas/muestras', muestra.id])
    } else if (event.action === 'edit') {
      this.editingMuestra.set(muestra)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingMuestra.set(muestra)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const muestra = this.deletingMuestra()
    this.deleteDialogOpen.set(false)
    if (!muestra) {
      return
    }
    try {
      await this._service.remove(muestra.id)
      this._notify.success('Muestra eliminada')
    } catch {
      this._notify.error('No se pudo eliminar la muestra')
    }
  }

  async onSave(value: MuestraFormValue): Promise<void> {
    const editing = this.editingMuestra()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        await this._service.update(editing.id, value)
        this._notify.success('Muestra actualizada correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Muestra creada correctamente')
      }
    } catch {
      this._notify.error(editing ? 'No se pudo actualizar la muestra' : 'No se pudo crear la muestra')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
