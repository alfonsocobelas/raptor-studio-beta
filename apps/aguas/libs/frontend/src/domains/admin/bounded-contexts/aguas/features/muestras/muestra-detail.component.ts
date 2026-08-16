import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { NgIcon } from '@ng-icons/core'
import { lucideArrowLeft, lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { AppConfirmDialog } from '../../../../../../shared/components/ui/confirm-dialog'
import { AppDialog } from '../../../../../../shared/components/ui/dialog'
import { MuestraDialogComponent, MuestraFormValue } from './muestra-dialog.component'
import { MuestraDto } from '@app/shared/domain'
import { MuestraService } from '../../../../../../core/services/muestra.service'
import { formatValue } from '../../../../../../shared/utils/format-value'
import { MuestraAttachmentsComponent } from './muestra-attachments.component'

/** Una fila de la ficha: qué campo, cómo se llama y cómo se formatea. */
interface DetailRow {
  key: string
  label: string
  type?: 'date' | 'number' | 'boolean'
  /** Etiquetas de un conjunto cerrado: el valor guardado se lee como en el listado */
  labels?: Record<string, string>
}

/**
 * Ficha de Muestras: el destino de la acción «ver» del listado. Carga el
 * registro por el id de la ruta y muestra sus campos; las escrituras reutilizan
 * el mismo diálogo y la misma confirmación que el listado.
 */
@Component({
  selector: 'app-muestra-detail',
  imports: [NgIcon, AppDialog, MuestraDialogComponent, AppConfirmDialog, MuestraAttachmentsComponent],
  providers: [provideIcons({ lucideArrowLeft, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <button type="button" class="text-muted-foreground flex items-center gap-2 text-sm" (click)="back()">
        <ng-icon name="lucideArrowLeft" size="16" />
        Volver a Muestras
      </button>

      @if (loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando muestras…</p>
      } @else if (notFound()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No se encontró el registro solicitado.</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las muestras</p>
      } @else if (muestra(); as item) {
        <div class="flex items-start justify-between gap-4">
          <h1 class="text-2xl font-bold tracking-tight">{{ item.codigo }}</h1>
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

        <app-muestras-attachments [muestraId]="item.id" />
      }
    </div>

    <app-dialog [open]="dialogOpen()" (closed)="dialogOpen.set(false)">
      @if (dialogOpen()) {
        <app-muestra-dialog [muestra]="muestra()" (saved)="onSave($event)" (close)="dialogOpen.set(false)" />
      }
    </app-dialog>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      title="Eliminar muestra"
      [description]="deleteDescription()"
      (confirmed)="onDelete()"
      (closed)="deleteDialogOpen.set(false)"
    />
  `
})
export class MuestraDetailComponent {
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _service = inject(MuestraService)
  private readonly _auth = inject(AuthService)
  private readonly _notify = inject(NotificationService)

  protected readonly canWrite = computed(() => this._auth.canWrite())

  readonly muestra = signal<MuestraDto | null>(null)
  readonly loading = signal(true)
  readonly notFound = signal(false)
  readonly error = signal(false)
  readonly dialogOpen = signal(false)
  readonly deleteDialogOpen = signal(false)

  /** Filas derivadas del modelo: el generador decide qué se ve y en qué orden. */
  readonly rows: DetailRow[] = [
    {
      key: 'estado',
      label: 'Estado',
      labels: {
        recibida: 'Recibida',
        en_analisis: 'En análisis',
        fuera_de_rango: 'Fuera de rango',
        validada: 'Validada',
        informada: 'Informada',
        facturada: 'Facturada'
      }
    },
    { key: 'tecnico', label: 'Técnico' },
    { key: 'recogida', label: 'Recogida', type: 'date' },
    { key: 'limiteInforme', label: 'Límite de informe', type: 'date' },
    { key: 'importe', label: 'Importe', type: 'number' },
    { key: 'puntoName', label: 'Punto de muestreo' }
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
      this.muestra.set(await this._service.findOne(id))
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 404) this.notFound.set(true)
      else this.error.set(true)
    } finally {
      this.loading.set(false)
    }
  }

  back(): void {
    void this._router.navigate(['/aguas/muestras'])
  }

  /** Un valor se lee igual aquí que en el listado: mismo formateador (kernel). */
  format(item: MuestraDto, row: DetailRow): string {
    const value = (item as unknown as Record<string, unknown>)[row.key]
    return formatValue(value, { type: row.type, labels: row.labels })
  }

  openEdit(item: MuestraDto): void {
    this.muestra.set(item)
    this.dialogOpen.set(true)
  }

  async onSave(value: MuestraFormValue): Promise<void> {
    const current = this.muestra()
    if (!current) return
    try {
      await this._service.update(current.id, value)
      this.dialogOpen.set(false)
      this._notify.success('Muestra actualizada correctamente')
      await this.load()
    } catch {
      this._notify.error('No se pudo actualizar la muestra')
    }
  }

  deleteDescription(): string {
    const current = this.muestra()
    return current ? `Se archivará la muestra «${current.codigo}». Podrás restaurarla desde la papelera.` : ''
  }

  async onDelete(): Promise<void> {
    const current = this.muestra()
    this.deleteDialogOpen.set(false)
    if (!current) return
    try {
      await this._service.remove(current.id)
      this._notify.success('Muestra eliminada')
      this.back()
    } catch {
      this._notify.error('No se pudo eliminar la muestra')
    }
  }

  // @ai:begin detail-extra — bloques propios de esta ficha (relaciones, acciones de dominio)
  // @ai:end
}
