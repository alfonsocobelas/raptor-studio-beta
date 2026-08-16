import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideArchiveRestore } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { MuestraDto } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { MuestraService, OffsetPaginatedOutput } from '../../../../../../core/services/muestra.service'
import {
  ColumnDef,
  ColumnFilter,
  DataTable,
  SortOrder,
  TableAction
} from '../../../../../../shared/components/data-table'

/** La papelera (spec 29): lo soft-borrado del recurso, con una única acción — restaurar. */
@Component({
  selector: 'app-muestras-trash',
  imports: [DataTable, RouterLink],
  providers: [provideIcons({ lucideArchiveRestore })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Papelera — Muestras</h1>
          <p class="text-muted-foreground">Registros borrados: restaurarlos los devuelve al listado</p>
        </div>
        <a
          routerLink="//aguas/muestras"
          class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >Volver al listado</a
        >
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando muestras…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las muestras</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">La papelera está vacía</p>
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
          [actions]="actions()"
          (actionClick)="onAction($event)"
          (pageChange)="onPage($event)"
          (pageSizeChange)="onPageSize($event)"
          (sortChange)="onSort($event)"
          (searchChange)="onSearch($event)"
          (filtersChange)="onFilters($event)"
        />
      }
    </div>
  `
})
export class MuestrasTrashComponent {
  private readonly _service = inject(MuestraService)
  private readonly _notify = inject(NotificationService)
  protected readonly canWrite = inject(AuthService).canWrite

  constructor() {
    // Vista subordinada: cada entrada a la papelera arranca limpia.
    this._service.resetTrashRequest()
  }

  readonly isLoading = this._service.deleted.isLoading
  readonly error = this._service.deleted.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<MuestraDto> | undefined,
    OffsetPaginatedOutput<MuestraDto> | undefined
  >({
    source: () => this._service.deleted.value(),
    computation: (value, previous) => value ?? previous?.value
  })

  readonly rows = computed(() => (this._loaded()?.items ?? []) as unknown as Record<string, unknown>[])
  readonly total = computed(() => this._loaded()?.total ?? 0)
  readonly hasData = computed(() => this._loaded() !== undefined)
  readonly currentPage = computed(() => this._service.trashRequest().page)
  readonly pageSize = computed(() => this._service.trashRequest().pageSize)
  readonly sortColumn = computed(() => this._service.trashRequest().orders?.[0]?.orderBy ?? '')
  readonly sortDirection = computed(() => this._service.trashRequest().orders?.[0]?.orderType ?? 'asc')
  readonly search = computed(() => this._service.trashRequest().search ?? '')
  readonly hasActiveFilters = computed(() => (this._service.trashRequest().filters?.length ?? 0) > 0)

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

  // Restaurar es una escritura: un viewer no ve la acción.
  readonly actions = computed<TableAction[]>(() =>
    this.canWrite() ? [{ icon: 'lucideArchiveRestore', label: 'Restaurar', action: 'restore' }] : []
  )

  async onAction(event: { action: string; row: Record<string, unknown> }): Promise<void> {
    if (event.action !== 'restore') {
      return
    }
    const muestra = event.row as unknown as MuestraDto
    try {
      await this._service.restore(muestra.id)
      this._notify.success('Registro restaurado')
    } catch {
      this._notify.error('No se pudo restaurar el registro')
    }
  }

  onPage(page: number): void {
    this._service.trashRequest.update(r => ({ ...r, page }))
  }

  onPageSize(pageSize: number): void {
    this._service.trashRequest.update(r => ({ ...r, pageSize, page: 1 }))
  }

  onSort(sort: SortOrder | null): void {
    this._service.trashRequest.update(r => ({ ...r, orders: sort ? [sort] : undefined, page: 1 }))
  }

  onSearch(search: string): void {
    this._service.trashRequest.update(r => ({ ...r, search: search || undefined, page: 1 }))
  }

  onFilters(filters: ColumnFilter[]): void {
    this._service.trashRequest.update(r => ({ ...r, filters, page: 1 }))
  }
}
