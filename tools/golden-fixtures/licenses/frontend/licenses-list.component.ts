import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucideEye } from '@ng-icons/lucide'
import { LicenseWithConsumptionDto, ExportFormat } from '@sap-licenses/shared/domain'
import { LicenseService, OffsetPaginatedOutput } from '../../../../../../core/services/license.service'
import { navigationCameFrom } from '../../../../../../shared/utils/navigation'
import {
  ColumnDef,
  ColumnFilter,
  DataTable,
  SortOrder,
  TableAction
} from '../../../../../../shared/components/data-table'
import { downloadBlob } from '../../../../../../shared/utils/download-file'

@Component({
  selector: 'app-licenses-list',
  imports: [DataTable],
  providers: [provideIcons({ lucideEye })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Licencias</h1>
        <p class="text-muted-foreground">Observabilidad del parque de licencias SAP</p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando licencias…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las licencias</p>
      } @else if (total() === 0 && !hasActiveFilters() && !search()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay licencias registradas</p>
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
          [actions]="actions"
          exportFilename="licencias"
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
  `
})
export class LicensesListComponent {
  private readonly _service = inject(LicenseService)
  private readonly _router = inject(Router)

  constructor() {
    // El request vive en un servicio root y persiste entre navegaciones; se conserva solo
    // al volver del propio módulo (p.ej. del detalle) y se resetea al entrar desde fuera.
    if (!navigationCameFrom('/sap-licensing/licenses')) {
      this._service.resetRequest()
    }
  }

  readonly isLoading = this._service.licenses.isLoading
  readonly error = this._service.licenses.error

  // resource() clears value() to undefined while reloading on a param change. Retain the last
  // loaded page so the DataTable is not unmounted (which would reset its internal currentPage).
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<LicenseWithConsumptionDto> | undefined,
    OffsetPaginatedOutput<LicenseWithConsumptionDto> | undefined
  >({
    source: () => this._service.licenses.value(),
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

  readonly columns: ColumnDef[] = [
    { key: 'customerName', label: 'Cliente', filterable: true, minWidth: 200 },
    { key: 'subSolutionAreaName', label: 'Solución', filterable: true, minWidth: 200 },
    { key: 'contractNumber', label: 'Contrato', sortable: false, minWidth: 180 },
    { key: 'metric', label: 'Métrica', filterable: true, sortable: false, minWidth: 100 },
    { key: 'licensedUnits', label: 'Licenciadas', type: 'number', minWidth: 120 },
    { key: 'currentUnits', label: 'Consumo actual', sortable: false, type: 'number', minWidth: 130 },
    { key: 'consumptionPctFmt', label: '% Consumo', sortable: false, minWidth: 110 },
    {
      key: 'healthStatus',
      label: 'Estado salud',
      sortable: false,
      minWidth: 150,
      type: 'badge',
      badgeMap: {
        healthy: { label: 'Saludable', variant: 'default' },
        underused: { label: 'Infrautilizada', variant: 'outline' },
        overused: { label: 'Sobreuso', variant: 'secondary' },
        contractual_breach: { label: 'Infracción', variant: 'destructive' }
      }
    }
  ]

  readonly actions: TableAction[] = [{ icon: 'lucideEye', label: 'Ver detalle', action: 'view' }]

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

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    if (event.action !== 'view') {
      return
    }
    const license = event.row as unknown as LicenseWithConsumptionDto
    this._router.navigate(['/sap-licensing/licenses', license.id])
  }

  // @ai:begin list-extra — acciones, columnas o estados a medida
  // @ai:end
}
