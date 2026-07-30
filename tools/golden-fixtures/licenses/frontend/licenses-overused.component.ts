import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { ExportFormat, MetricConsumptionDto } from '@sap-licenses/shared/domain'
import { ConsumptionService } from '../../../../../../core/services/consumption.service'
import { OffsetPaginatedOutput } from '../../../../../../core/services/contract.service'
import { ColumnDef, ColumnFilter, DataTable, SortOrder } from '../../../../../../shared/components/data-table'
import { KpiCardComponent } from '../../../../../../shared/components/kpi-card'
import { downloadBlob } from '../../../../../../shared/utils/download-file'

// Etiquetas del badge de origen del feed (spec 48)
export const CONSUMPTION_SOURCE_BADGES: Record<string, { label: string; variant: string }> = {
  PUBLIC_CLOUD: { label: 'Nube pública', variant: 'secondary' },
  PRIVATE_CLOUD: { label: 'Nube privada', variant: 'outline' }
}

@Component({
  selector: 'app-licenses-overused',
  imports: [DataTable, KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Consumo con sobreuso</h1>
        <p class="text-muted-foreground">Métricas consumidas por encima de lo contratado, según SAP for Me</p>
      </div>

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando consumo…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudo cargar el consumo</p>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <app-kpi-card title="Métricas en exceso" [value]="metricCount()" />
          <app-kpi-card title="Clientes afectados" [value]="customerCount()" />
          <app-kpi-card title="Sobreuso promedio" [value]="avgOveruse()" variant="destructive" />
        </div>

        <app-data-table
          [columns]="columns"
          [data]="tableData()"
          [serverSide]="true"
          [total]="total()"
          [page]="currentPage()"
          [pageSize]="pageSize()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          [search]="search()"
          [loading]="tableLoading()"
          [showCreate]="false"
          [showActions]="false"
          exportFilename="consumo-metricas-sobreuso"
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
export class LicensesOverusedComponent {
  private readonly _consumption = inject(ConsumptionService)

  readonly isLoading = computed(
    () => this._consumption.overusedSummary.isLoading() || this._consumption.overusedRows.isLoading()
  )
  readonly error = computed(() => this._consumption.overusedSummary.error() ?? this._consumption.overusedRows.error())
  readonly tableLoading = computed(() => this._consumption.overusedRows.isLoading())

  private readonly _summary = computed(() => this._consumption.overusedSummary.value())

  // Retain the last loaded page so the DataTable is not unmounted (which would reset its state) while reloading.
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<MetricConsumptionDto> | undefined,
    OffsetPaginatedOutput<MetricConsumptionDto> | undefined
  >({
    source: () => this._consumption.overusedRows.value(),
    computation: (value, previous) => value ?? previous?.value
  })

  readonly hasData = computed(() => this._loaded() !== undefined)
  readonly total = computed(() => this._loaded()?.total ?? 0)
  readonly currentPage = computed(() => this._consumption.overusedRequest().page)
  readonly pageSize = computed(() => this._consumption.overusedRequest().pageSize)
  readonly sortColumn = computed(() => this._consumption.overusedRequest().orders?.[0]?.orderBy ?? '')
  readonly sortDirection = computed(() => this._consumption.overusedRequest().orders?.[0]?.orderType ?? 'asc')
  readonly search = computed(() => this._consumption.overusedRequest().search ?? '')

  // KPIs de SAP, sin euros (spec 48): el "valor upsell" murió con el modelo de imputación.
  readonly metricCount = computed(() => this._summary()?.metricCount ?? 0)
  readonly customerCount = computed(() => this._summary()?.impactedCustomers ?? 0)
  readonly avgOveruse = computed(() => `${(this._summary()?.avgUtilizationPct ?? 0).toFixed(1)}%`)

  // customerName ya es columna en BD (denormalizada del canon): ordena y se busca en SQL. Sigue sin
  // filtro server-side. El % formateado ordena por su campo numérico; el exceso es derivado.
  readonly columns: ColumnDef[] = [
    { key: 'customerName', label: 'Cliente', minWidth: 200 },
    { key: 'metricName', label: 'Métrica', minWidth: 220 },
    { key: 'solutionAreaName', label: 'Solución', filterable: true, minWidth: 200 },
    { key: 'purchased', label: 'Contratado', type: 'number', minWidth: 120 },
    { key: 'consumed', label: 'Consumido', type: 'number', minWidth: 120 },
    { key: 'excessUnits', label: 'Exceso', type: 'number', sortable: false, minWidth: 100 },
    { key: 'utilizationPctFmt', label: '% Consumo', sortField: 'utilizationPct', minWidth: 110 },
    {
      key: 'source',
      label: 'Fuente',
      type: 'badge',
      badgeMap: CONSUMPTION_SOURCE_BADGES,
      filterable: true,
      minWidth: 130
    },
    { key: 'sapLastUpdate', label: 'Última medición', type: 'date', minWidth: 140 }
  ]

  readonly tableData = computed(() =>
    (this._loaded()?.items ?? []).map(
      row =>
        ({
          ...row,
          // exceso real del mismo par de unidades; sin techo (unlimited / purchased 0) no hay exceso
          excessUnits: row.unlimitedEntitlement || row.purchased === 0 ? 0 : Math.max(row.consumed - row.purchased, 0),
          utilizationPctFmt: row.utilizationPct === null ? '—' : `${row.utilizationPct.toFixed(1)}%`
        }) as unknown as Record<string, unknown>
    )
  )

  onPage(page: number): void {
    this._consumption.overusedRequest.update(r => ({ ...r, page }))
  }

  onPageSize(pageSize: number): void {
    this._consumption.overusedRequest.update(r => ({ ...r, pageSize, page: 1 }))
  }

  async onExport(format: ExportFormat): Promise<void> {
    const { blob, filename } = await this._consumption.exportOverused(format)
    downloadBlob(blob, filename)
  }

  onSort(sort: SortOrder | null): void {
    this._consumption.overusedRequest.update(r => ({ ...r, orders: sort ? [sort] : undefined, page: 1 }))
  }

  onSearch(search: string): void {
    this._consumption.overusedRequest.update(r => ({ ...r, search: search || undefined, page: 1 }))
  }

  onFilters(filters: ColumnFilter[]): void {
    this._consumption.overusedRequest.update(r => ({ ...r, filters, page: 1 }))
  }
}
