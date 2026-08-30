import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core'
import { Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideEye, lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { ProjectDto, ExportFormat } from '@sap-licenses/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { ProjectService, OffsetPaginatedOutput } from '../../../../../../core/services/project.service'
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
import { ProjectDialogComponent, ProjectFormValue } from './project-dialog.component'

@Component({
  selector: 'app-projects-list',
  imports: [DataTable, AppDialog, AppConfirmDialog, ProjectDialogComponent],
  providers: [provideIcons({ lucideEye, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      @if (!embedded()) {
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p class="text-muted-foreground">Proyectos de implementación SAP asociados a clientes</p>
        </div>
      }

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando proyectos…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los proyectos</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay proyectos registrados</p>
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
          createLabel="Nuevo proyecto"
          exportFilename="proyectos"
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
        <app-project-dialog [project]="editingProject()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar proyecto"
      [description]="deleteDescription()"
      (confirmed)="confirmDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class ProjectsListComponent {
  /** Dentro del panel: la pantalla ya tiene su título, así que el listado no pinta el suyo (spec 52). */
  readonly embedded = input(false)

  private readonly _service = inject(ProjectService)
  private readonly _router = inject(Router)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _notify = inject(NotificationService)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/sap-licensing/projects')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.projects.isLoading
  readonly error = this._service.projects.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<ProjectDto> | undefined,
    OffsetPaginatedOutput<ProjectDto> | undefined
  >({
    source: () => this._service.projects.value(),
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
  readonly editingProject = signal<ProjectDto | null>(null)
  readonly deletingProject = signal<ProjectDto | null>(null)
  readonly deleteDialogOpen = signal(false)
  readonly deleteDescription = computed(
    () => `Se archivará el proyecto "${this.deletingProject()?.name ?? ''}". Esta acción no se puede deshacer.`
  )

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Nombre', filterable: true, minWidth: 250 },
    { key: 'customerName', label: 'Cliente', filterable: true, minWidth: 200 },
    {
      key: 'origin',
      label: 'Origen',
      filterable: true,
      minWidth: 100,
      type: 'badge',
      badgeMap: {
        MANUAL: { label: 'Manual', variant: 'secondary' },
        ME_SAP: { label: 'SAP', variant: 'outline' }
      }
    },
    { key: 'startDate', label: 'Fecha inicio', type: 'date', minWidth: 120 },
    { key: 'endDate', label: 'Fecha fin', type: 'date', minWidth: 120 },
    {
      key: 'status',
      label: 'Estado',
      filterable: true,
      minWidth: 120,
      type: 'badge',
      badgeMap: {
        planning: { label: 'Planificación', variant: 'outline' },
        active: { label: 'Activo', variant: 'default' },
        onhold: { label: 'En pausa', variant: 'secondary' },
        closed: { label: 'Cerrado', variant: 'ghost' }
      }
    },
    {
      key: 'implementer',
      label: 'Implementador',
      filterable: true,
      minWidth: 130,
      type: 'badge',
      badgeMap: {
        AVVALE: { label: 'AVVALE', variant: 'default' },
        THIRD_PARTY: { label: 'Tercero', variant: 'secondary' }
      }
    }
  ]

  // Editar y borrar solo para quien puede escribir: el backend responde 403 al viewer, así que
  // ofrecer la acción solo llevaría a un error. La ficha no sustituye al borrado de la fila: si el schema
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
    this.editingProject.set(null)
    this.dialogOpen.set(true)
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const project = event.row as unknown as ProjectDto
    if (event.action === 'view') {
      this._router.navigate(['/sap-licensing/projects', project.id])
    } else if (event.action === 'edit') {
      this.editingProject.set(project)
      this.dialogOpen.set(true)
    } else if (event.action === 'delete') {
      this.deletingProject.set(project)
      this.deleteDialogOpen.set(true)
    }
  }

  async confirmDelete(): Promise<void> {
    const project = this.deletingProject()
    this.deleteDialogOpen.set(false)
    if (!project) {
      return
    }
    try {
      await this._service.remove(project.id)
      this._notify.success('Proyecto eliminado')
    } catch {
      this._notify.error('No se pudo eliminar el proyecto')
    }
  }

  async onSave(value: ProjectFormValue): Promise<void> {
    const editing = this.editingProject()
    this.dialogOpen.set(false)
    try {
      if (editing) {
        // spec 78: la versión leída viaja con la edición (bloqueo optimista)
        await this._service.update(editing.id, { ...value, version: editing.version })
        this._notify.success('Proyecto actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Proyecto creado correctamente')
      }
    } catch {
      this._notify.error(editing ? 'No se pudo actualizar el proyecto' : 'No se pudo crear el proyecto')
    }
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
