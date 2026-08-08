import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { NgIcon } from '@ng-icons/core'
import { lucideArrowLeft, lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { PropiedadDialogComponent, PropiedadFormValue } from './propiedad-dialog.component'
import { PropiedadDto } from '@app/shared/domain'
import { PropiedadService } from '../../../../../../core/services/propiedad.service'
import { formatValue } from '../../../../../../shared/utils/format-value'
import { RelatedTable } from '../../../../../../shared/components/related-table'
import { PropiedadAttachmentsComponent } from './propiedad-attachments.component'

/** Una fila de la ficha: qué campo, cómo se llama y cómo se formatea. */
interface DetailRow {
  key: string
  label: string
  type?: 'date' | 'number' | 'boolean'
  /** Etiquetas de un conjunto cerrado: el valor guardado se lee como en el listado */
  labels?: Record<string, string>
}

/**
 * Ficha de Propiedades: el destino de la acción «ver» del listado. Carga el
 * registro por el id de la ruta y muestra sus campos; las escrituras reutilizan
 * el mismo diálogo y la misma confirmación que el listado.
 */
@Component({
  selector: 'app-propiedad-detail',
  imports: [NgIcon, RelatedTable, AppDialog, PropiedadDialogComponent, AppConfirmDialog, PropiedadAttachmentsComponent],
  providers: [provideIcons({ lucideArrowLeft, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <button type="button" class="text-muted-foreground flex items-center gap-2 text-sm" (click)="back()">
        <ng-icon name="lucideArrowLeft" size="16" />
        Volver a Propiedades
      </button>

      @if (loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando propiedades…</p>
      } @else if (notFound()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No se encontró el registro solicitado.</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las propiedades</p>
      } @else if (propiedad(); as item) {
        <div class="flex items-start justify-between gap-4">
          <h1 class="text-2xl font-bold tracking-tight">{{ item.titulo }}</h1>
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

        <app-related-table
          title="Visitas"
          endpoint="/api/v1/visitas"
          field="propiedadId"
          [value]="item.id"
          [columns]="[
            { key: 'referencia', label: 'Referencia' },
            { key: 'fecha', label: 'Fecha' },
            { key: 'interesado', label: 'Interesado' },
            { key: 'observaciones', label: 'Observaciones' }
          ]"
          route="/fincaraiz/visitas"
        />

        <app-propiedades-attachments [propiedadId]="item.id" />
      }
    </div>

    <app-dialog [open]="dialogOpen()" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-propiedad-dialog [propiedad]="propiedad()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar propiedad"
      [description]="deleteDescription()"
      (confirmed)="onDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class PropiedadDetailComponent {
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _service = inject(PropiedadService)
  private readonly _auth = inject(AuthService)
  private readonly _notify = inject(NotificationService)

  protected readonly canWrite = computed(() => this._auth.canWrite())

  readonly propiedad = signal<PropiedadDto | null>(null)
  readonly loading = signal(true)
  readonly notFound = signal(false)
  readonly error = signal(false)
  readonly dialogOpen = signal(false)
  readonly deleteDialogOpen = signal(false)

  /** Filas derivadas del modelo: el generador decide qué se ve y en qué orden. */
  readonly rows: DetailRow[] = [
    { key: 'zona', label: 'Zona' },
    {
      key: 'estado',
      label: 'Estado',
      labels: { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida', retirada: 'Retirada' }
    },
    { key: 'metrosCuadrados', label: 'Metros cuadrados', type: 'number' },
    { key: 'habitaciones', label: 'Habitaciones', type: 'number' },
    { key: 'precio', label: 'Precio', type: 'number' },
    { key: 'fechaAlta', label: 'Fecha de alta', type: 'date' },
    { key: 'exclusiva', label: 'En exclusiva', type: 'boolean' },
    { key: 'agenteName', label: 'Agente' }
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
      this.propiedad.set(await this._service.findOne(id))
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 404) this.notFound.set(true)
      else this.error.set(true)
    } finally {
      this.loading.set(false)
    }
  }

  back(): void {
    void this._router.navigate(['/fincaraiz/propiedades'])
  }

  /** Un valor se lee igual aquí que en el listado: mismo formateador (kernel). */
  format(item: PropiedadDto, row: DetailRow): string {
    const value = (item as unknown as Record<string, unknown>)[row.key]
    return formatValue(value, { type: row.type, labels: row.labels })
  }

  openEdit(item: PropiedadDto): void {
    this.propiedad.set(item)
    this.dialogOpen.set(true)
  }

  async onSave(value: PropiedadFormValue): Promise<void> {
    const current = this.propiedad()
    if (!current) return
    try {
      await this._service.update(current.id, value)
      this.dialogOpen.set(false)
      this._notify.success('Propiedad actualizada correctamente')
      await this.load()
    } catch {
      this._notify.error('No se pudo actualizar la propiedad')
    }
  }

  deleteDescription(): string {
    const current = this.propiedad()
    return current ? `la propiedad «${current.titulo}».` : ''
  }

  async onDelete(): Promise<void> {
    const current = this.propiedad()
    this.deleteDialogOpen.set(false)
    if (!current) return
    try {
      await this._service.remove(current.id)
      this._notify.success('Propiedad eliminada')
      this.back()
    } catch {
      this._notify.error('No se pudo eliminar la propiedad')
    }
  }

  // @ai:begin detail-extra — bloques propios de esta ficha (relaciones, acciones de dominio)
  // @ai:end
}
