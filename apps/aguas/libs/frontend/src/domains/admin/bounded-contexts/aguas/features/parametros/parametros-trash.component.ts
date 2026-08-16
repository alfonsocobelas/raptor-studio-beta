import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideArchiveRestore } from '@ng-icons/lucide'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { ParametroDto } from '@app/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { ParametroService, OffsetPaginatedOutput } from '../../../../../../core/services/parametro.service'
import {
  ColumnDef,
  ColumnFilter,
  DataTable,
  SortOrder,
  TableAction
} from '../../../../../../shared/components/data-table'

/** La papelera (spec 29): lo soft-borrado del recurso, con una única acción — restaurar. */
@Component({
  selector: 'app-parametros-trash',
  imports: [DataTable, RouterLink],
  providers: [provideIcons({ lucideArchiveRestore })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Papelera — Parámetros</h1>
          <p class="text-muted-foreground">Registros borrados: restaurarlos los devuelve al listado</p>
        </div>
        <a
          routerLink="//aguas/parametros"
          class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >Volver al listado</a
        >
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando parámetros…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los parámetros</p>
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
export class ParametrosTrashComponent {
  private readonly _service = inject(ParametroService)
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
    OffsetPaginatedOutput<ParametroDto> | undefined,
    OffsetPaginatedOutput<ParametroDto> | undefined
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
    { key: 'nombre', label: 'Nombre', minWidth: 120 },
    { key: 'metodo', label: 'Método', minWidth: 120 },
    { key: 'limiteLegal', label: 'Límite legal', type: 'number', minWidth: 120 },
    { key: 'precio', label: 'Precio', type: 'number', minWidth: 120 }
  ]

  // Restaurar es una escritura: un viewer no ve la acción.
  readonly actions = computed<TableAction[]>(() =>
    this.canWrite() ? [{ icon: 'lucideArchiveRestore', label: 'Restaurar', action: 'restore' }] : []
  )

  async onAction(event: { action: string; row: Record<string, unknown> }): Promise<void> {
    if (event.action !== 'restore') {
      return
    }
    const parametro = event.row as unknown as ParametroDto
    try {
      await this._service.restore(parametro.id)
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
