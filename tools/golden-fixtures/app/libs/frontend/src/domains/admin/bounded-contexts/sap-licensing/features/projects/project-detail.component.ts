import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { NgIcon } from '@ng-icons/core'
import { lucideArrowLeft, lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { ProjectDialogComponent, ProjectFormValue } from './project-dialog.component'
import { AuditEventDto, ProjectDto } from '@app/shared/domain'
import { ProjectService } from '../../../../../../core/services/project.service'
import { formatValue } from '../../../../../../shared/utils/format-value'
import { ProjectAttachmentsComponent } from './project-attachments.component'

/** Una fila de la ficha: qué campo, cómo se llama y cómo se formatea. */
interface DetailRow {
  key: string
  label: string
  type?: 'date' | 'number' | 'boolean'
  /** Etiquetas de un conjunto cerrado: el valor guardado se lee como en el listado */
  labels?: Record<string, string>
}

/**
 * Ficha de Proyectos: el destino de la acción «ver» del listado. Carga el
 * registro por el id de la ruta y muestra sus campos; las escrituras reutilizan
 * el mismo diálogo y la misma confirmación que el listado.
 */
@Component({
  selector: 'app-project-detail',
  imports: [NgIcon, AppDialog, ProjectDialogComponent, AppConfirmDialog, ProjectAttachmentsComponent],
  providers: [provideIcons({ lucideArrowLeft, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <button type="button" class="text-muted-foreground flex items-center gap-2 text-sm" (click)="back()">
        <ng-icon name="lucideArrowLeft" size="16" />
        Volver a Proyectos
      </button>

      @if (loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando proyectos…</p>
      } @else if (notFound()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No se encontró el registro solicitado.</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los proyectos</p>
      } @else if (project(); as item) {
        <div class="flex items-start justify-between gap-4">
          <h1 class="text-2xl font-bold tracking-tight">{{ item.customerName }}</h1>
          <div class="flex gap-2">
            @if (canWrite()) {
              <button
                type="button"
                class="border-input hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                (click)="openEdit(item)"
              >
                <ng-icon name="lucidePencil" size="16" />
                Editar
              </button>
            }
            @if (canWrite()) {
              <button
                type="button"
                class="text-destructive hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                (click)="deleteDialogOpen.set(true)"
              >
                <ng-icon name="lucideTrash2" size="16" />
                Eliminar
              </button>
            }
          </div>
        </div>

        <dl class="bg-card grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-6 sm:grid-cols-2">
          @for (row of rows; track row.key) {
            <div class="min-w-0">
              <dt class="text-muted-foreground text-xs uppercase tracking-wide">{{ row.label }}</dt>
              <dd class="truncate text-sm font-medium">{{ format(item, row) }}</dd>
            </div>
          }
        </dl>

        <app-projects-attachments [projectId]="item.id" />

        <!-- la timeline del registro (spec 31): qué pasó, qué cambió y cuándo -->
        <section class="bg-card rounded-lg border p-4">
          <h2 class="mb-3 text-sm font-semibold">Historial</h2>
          @if (!history().length) {
            <p class="text-muted-foreground text-sm">Sin cambios registrados</p>
          } @else {
            <ol class="space-y-3">
              @for (event of history(); track event.id) {
                <li class="border-border border-l-2 pl-3" data-testid="history-event">
                  <div class="flex items-baseline gap-2">
                    <span class="text-sm font-medium">{{ actionLabel(event) }}</span>
                    <span class="text-muted-foreground text-xs">{{ when(event) }}</span>
                  </div>
                  @if (changedFields(event).length) {
                    <div class="mt-1 flex flex-wrap gap-1">
                      @for (change of changedFields(event); track change.field) {
                        <span class="bg-muted rounded-full px-2 py-0.5 text-xs">
                          <span class="text-muted-foreground">{{ change.field }}:</span>
                          {{ change.from }} → {{ change.to }}
                        </span>
                      }
                    </div>
                  }
                </li>
              }
            </ol>
          }
        </section>
      }
    </div>

    <app-dialog [open]="dialogOpen()" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-project-dialog [project]="project()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar proyecto"
      [description]="deleteDescription()"
      (confirmed)="onDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class ProjectDetailComponent {
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _service = inject(ProjectService)
  private readonly _auth = inject(AuthService)
  private readonly _notify = inject(NotificationService)

  protected readonly canWrite = computed(() => this._auth.canWrite())

  readonly project = signal<ProjectDto | null>(null)
  readonly loading = signal(true)
  readonly notFound = signal(false)
  readonly error = signal(false)
  readonly dialogOpen = signal(false)
  readonly deleteDialogOpen = signal(false)

  /** Filas derivadas del modelo: el generador decide qué se ve y en qué orden. */
  readonly rows: DetailRow[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'startDate', label: 'Fecha inicio', type: 'date' },
    { key: 'endDate', label: 'Fecha fin', type: 'date' },
    {
      key: 'status',
      label: 'Estado',
      labels: { planning: 'Planificación', active: 'Activo', onhold: 'En pausa', closed: 'Cerrado' }
    },
    { key: 'implementer', label: 'Implementador', labels: { AVVALE: 'AVVALE', THIRD_PARTY: 'Tercero' } },
    { key: 'origin', label: 'Origen', labels: { MANUAL: 'Manual', ME_SAP: 'SAP' } }
  ]

  constructor() {
    void this.load()
  }

  async load(): Promise<void> {
    const id = this._route.snapshot.paramMap.get('id')
    if (!id) {
      this.notFound.set(true)
      this.loading.set(false)
      return
    }
    try {
      this.project.set(await this._service.findOne(id))
      this.history.set(await this._service.history(id))
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 404) this.notFound.set(true)
      else this.error.set(true)
    } finally {
      this.loading.set(false)
    }
  }

  back(): void {
    void this._router.navigate(['/sap-licensing/projects'])
  }

  readonly history = signal<AuditEventDto[]>([])

  private readonly actionLabels: Record<AuditEventDto['action'], string> = {
    created: 'Creado',
    updated: 'Actualizado',
    deleted: 'Eliminado',
    restored: 'Restaurado'
  }

  actionLabel(event: AuditEventDto): string {
    return this.actionLabels[event.action]
  }

  when(event: AuditEventDto): string {
    return formatValue(event.occurredAt)
  }

  changedFields(event: AuditEventDto): { field: string; from: string; to: string }[] {
    return Object.entries(event.changes).map(([field, change]) => ({
      field,
      from: formatValue(change.from),
      to: formatValue(change.to)
    }))
  }

  /** Un valor se lee igual aquí que en el listado: mismo formateador (kernel). */
  format(item: ProjectDto, row: DetailRow): string {
    const value = (item as unknown as Record<string, unknown>)[row.key]
    return formatValue(value, { type: row.type, labels: row.labels })
  }

  openEdit(item: ProjectDto): void {
    this.project.set(item)
    this.dialogOpen.set(true)
  }

  async onSave(value: ProjectFormValue): Promise<void> {
    const current = this.project()
    if (!current) return
    try {
      await this._service.update(current.id, value)
      this.dialogOpen.set(false)
      this._notify.success('Proyecto actualizado correctamente')
      await this.load()
    } catch {
      this._notify.error('No se pudo actualizar el proyecto')
    }
  }

  deleteDescription(): string {
    const current = this.project()
    return current ? `el proyecto «${current.customerName}».` : ''
  }

  async onDelete(): Promise<void> {
    const current = this.project()
    this.deleteDialogOpen.set(false)
    if (!current) return
    try {
      await this._service.remove(current.id)
      this._notify.success('Proyecto eliminado')
      this.back()
    } catch {
      this._notify.error('No se pudo eliminar el proyecto')
    }
  }

  // @ai:begin detail-extra — bloques propios de esta ficha (relaciones, acciones de dominio)
  // @ai:end
}
