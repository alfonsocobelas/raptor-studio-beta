import { HttpClient } from '@angular/common/http'
import { Injectable, computed, inject, resource } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { previousRange, windowRange, type KpiRange } from './kpi-window'
import { monthLabel, type AggregateGroup } from './aggregate-groups'

interface PaginatedTotal {
  total: number
}

interface KpiFilter {
  field: string
  operator: string
  value: string
}

interface KpiSpec {
  /** count cuenta filas con el listado; el resto mide un campo con /aggregate (spec 71) */
  measure: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct'
  field?: string
  filters: KpiFilter[]
  window?: { field: string; preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'days'; days?: number }
  ratio: boolean
  compare: boolean
  target?: number
  sparkline?: boolean
}

export interface KpiValue {
  /** null = no hay dato. La media de un conjunto vacío no es cero (spec 71) */
  value: number | null
  /** El mismo conteo en la ventana anterior; solo si la tarjeta compara */
  previous?: number | null
  /** El total del recurso en la ventana; solo si la tarjeta muestra porcentaje */
  total?: number | null
  /** La mini-serie de 12 meses; solo si la tarjeta la pide */
  spark?: number[]
}

interface GroupedRequest {
  measure: string
  field?: string
  groupBy?: string
  bucketField?: string
  months?: number
  /** La condición de la tarjeta: la mini-serie mide EL MISMO conjunto que el número grande */
  filters?: KpiFilter[]
}

/**
 * Totales del dashboard: una llamada mínima por recurso (pageSize=1, solo interesa
 * `total`). Los agregados de dominio (sumas, umbrales, distribuciones) se añaden a
 * mano en el hueco @ai — son presentación a medida de cada proyecto.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly _http = inject(HttpClient)

  readonly contracts = this._total('/api/v1/contracts')
  readonly contractsTotal = computed(() => (this.contracts.hasValue() ? this.contracts.value().total : 0))

  readonly projects = this._total('/api/v1/projects')
  readonly projectsTotal = computed(() => (this.projects.hasValue() ? this.projects.value().total : 0))

  readonly contractsTopTotalValue3Asc = this._top('/api/v1/contracts', 'totalValue', 'asc', 3)

  readonly contractsByContractType = this._counts(
    '/api/v1/contracts',
    'contractType',
    ['cloud', 'onprem', 'mixed', 'maintenance'],
    'count',
    undefined
  )

  readonly contractsByContractTypeSumTotalValue = this._counts(
    '/api/v1/contracts',
    'contractType',
    ['cloud', 'onprem', 'mixed', 'maintenance'],
    'sum',
    'totalValue'
  )

  readonly projectsKpiStatusEqPlanning = this._kpi('/api/v1/projects', {
    measure: 'count',
    filters: [{ field: 'status', operator: 'eq', value: 'planning' }],
    ratio: false,
    compare: false
  })
  readonly projectsKpiStatusEqPlanningValue = computed(() => this.projectsKpiStatusEqPlanning.value()?.value ?? null)

  readonly contractsKpiContractTypeEqCloudStartDateMonthDeltaSpark = this._kpi('/api/v1/contracts', {
    measure: 'count',
    filters: [{ field: 'contractType', operator: 'eq', value: 'cloud' }],
    window: { field: 'startDate', preset: 'month' },
    ratio: false,
    compare: true,
    sparkline: true
  })
  readonly contractsKpiContractTypeEqCloudStartDateMonthDeltaSparkValue = computed(
    () => this.contractsKpiContractTypeEqCloudStartDateMonthDeltaSpark.value()?.value ?? null
  )

  readonly projectsKpiStatusEqClosedRatio = this._kpi('/api/v1/projects', {
    measure: 'count',
    filters: [{ field: 'status', operator: 'eq', value: 'closed' }],
    ratio: true,
    compare: false
  })
  readonly projectsKpiStatusEqClosedRatioValue = computed(
    () => this.projectsKpiStatusEqClosedRatio.value()?.value ?? null
  )

  readonly contractsKpiTotalTarget60 = this._kpi('/api/v1/contracts', {
    measure: 'count',
    filters: [],
    ratio: false,
    compare: false,
    target: 60
  })
  readonly contractsKpiTotalTarget60Value = computed(() => this.contractsKpiTotalTarget60.value()?.value ?? null)

  readonly contractsKpiSumTotalValue = this._kpi('/api/v1/contracts', {
    measure: 'sum',
    field: 'totalValue',
    filters: [],
    ratio: false,
    compare: false
  })
  readonly contractsKpiSumTotalValueValue = computed(() => this.contractsKpiSumTotalValue.value()?.value ?? null)

  readonly contractsKpiAvgTotalValueContractTypeEqCloud = this._kpi('/api/v1/contracts', {
    measure: 'avg',
    field: 'totalValue',
    filters: [{ field: 'contractType', operator: 'eq', value: 'cloud' }],
    ratio: false,
    compare: false
  })
  readonly contractsKpiAvgTotalValueContractTypeEqCloudValue = computed(
    () => this.contractsKpiAvgTotalValueContractTypeEqCloud.value()?.value ?? null
  )

  readonly contractsTopTotalValue5Desc = this._top('/api/v1/contracts', 'totalValue', 'desc', 5)

  readonly contractsSeriesStartDate = this._series('/api/v1/contracts', 'startDate', 'count', undefined)

  readonly contractsSeriesStartDateSumTotalValue = this._series('/api/v1/contracts', 'startDate', 'sum', 'totalValue')

  readonly loading = computed(
    () =>
      this.contracts.isLoading() ||
      this.projects.isLoading() ||
      this.contractsTopTotalValue3Asc.isLoading() ||
      this.contractsByContractType.isLoading() ||
      this.contractsByContractTypeSumTotalValue.isLoading() ||
      this.projectsKpiStatusEqPlanning.isLoading() ||
      this.contractsKpiContractTypeEqCloudStartDateMonthDeltaSpark.isLoading() ||
      this.projectsKpiStatusEqClosedRatio.isLoading() ||
      this.contractsKpiTotalTarget60.isLoading() ||
      this.contractsKpiSumTotalValue.isLoading() ||
      this.contractsKpiAvgTotalValueContractTypeEqCloud.isLoading() ||
      this.contractsTopTotalValue5Desc.isLoading() ||
      this.contractsSeriesStartDate.isLoading() ||
      this.contractsSeriesStartDateSumTotalValue.isLoading()
  )
  readonly loadError = computed(
    () =>
      this.contracts.error() !== undefined ||
      this.projects.error() !== undefined ||
      this.contractsTopTotalValue3Asc.error() !== undefined ||
      this.contractsByContractType.error() !== undefined ||
      this.contractsByContractTypeSumTotalValue.error() !== undefined ||
      this.projectsKpiStatusEqPlanning.error() !== undefined ||
      this.contractsKpiContractTypeEqCloudStartDateMonthDeltaSpark.error() !== undefined ||
      this.projectsKpiStatusEqClosedRatio.error() !== undefined ||
      this.contractsKpiTotalTarget60.error() !== undefined ||
      this.contractsKpiSumTotalValue.error() !== undefined ||
      this.contractsKpiAvgTotalValueContractTypeEqCloud.error() !== undefined ||
      this.contractsTopTotalValue5Desc.error() !== undefined ||
      this.contractsSeriesStartDate.error() !== undefined ||
      this.contractsSeriesStartDateSumTotalValue.error() !== undefined
  )

  private _total(api: string) {
    return resource<PaginatedTotal, unknown>({
      loader: () => firstValueFrom(this._http.get<PaginatedTotal>(api, { params: { page: '1', pageSize: '1' } }))
    })
  }

  /**
   * El conteo por valor del enum en UNA petición (spec 72): el endpoint agrupa. Antes eran N
   * conteos —ocho para un enum de ocho valores— y el panel los pagaba al abrirse.
   *
   * El orden lo manda el ENUM y no la respuesta: el desglose vuelve ordenado por valor, y las
   * barras tienen que salir siempre en el mismo orden.
   */
  private _counts(api: string, field: string, values: string[], measure: string, measureField?: string) {
    // el grupo AUSENTE vale 0 al contar o sumar (cero filas), pero la media, el máximo y el
    // mínimo de un grupo sin filas son «no hay dato» — un 0 ahí es una afirmación falsa
    const empty = measure === 'avg' || measure === 'min' || measure === 'max' ? null : 0
    return resource<(number | null)[], unknown>({
      loader: () =>
        this._grouped(api, { measure, field: measureField, groupBy: field }).then(groups => {
          const found = new Map(groups.map(group => [group.key, group.value]))
          return values.map(value => (found.has(value) ? (found.get(value) ?? null) : empty))
        })
    })
  }

  /**
   * Una tarjeta KPI (spec 70): el conteo condicionado y, SOLO si el descriptor los pide, el
   * periodo anterior y el total de la ventana. Las ramas que no se piden no llegan a la red:
   * son `Promise.resolve(undefined)`, no peticiones vacías.
   */
  private _kpi(api: string, spec: KpiSpec) {
    return resource<KpiValue, unknown>({ loader: () => this._loadKpi(api, spec) })
  }

  private async _loadKpi(api: string, spec: KpiSpec): Promise<KpiValue> {
    const now = new Date()
    const range = spec.window ? windowRange(spec.window.preset, spec.window.days, now) : undefined
    const scoped = [...spec.filters, ...this._rangeFilters(spec.window?.field, range)]
    // contar filas lo sabe el listado; medir un campo exige el endpoint de agregación (spec 71)
    const measured = (filters: KpiFilter[]): Promise<number | null> =>
      spec.measure === 'count' ? this._countBy(api, filters) : this._aggregate(api, spec, filters)

    const [value, previous, total, spark] = await Promise.all([
      measured(scoped),
      spec.compare && spec.window
        ? measured([
            ...spec.filters,
            ...this._rangeFilters(spec.window.field, previousRange(spec.window.preset, spec.window.days, now))
          ])
        : Promise.resolve(undefined),
      spec.ratio ? this._countBy(api, this._rangeFilters(spec.window?.field, range)) : Promise.resolve(undefined),
      // la mini-serie es UNA petición agrupada por mes, no doce (spec 72)
      spec.sparkline && spec.window
        ? this._grouped(api, {
            measure: spec.measure,
            field: spec.field,
            // la condición sí; el rango de la ventana no — los 12 meses son el eje de la mini-serie
            filters: spec.filters,
            bucketField: spec.window.field,
            months: 12
          }).then(groups => groups.map(group => group.value ?? 0))
        : Promise.resolve(undefined)
    ])

    return { value, previous, total, spark }
  }

  private _aggregate(api: string, spec: KpiSpec, filters: KpiFilter[]): Promise<number | null> {
    const params: Record<string, string> = { page: '1', pageSize: '1', op: spec.measure, field: spec.field ?? '' }
    if (filters.length) params['filters'] = JSON.stringify(filters)

    return firstValueFrom(this._http.get<{ value: number | null }>(`${api}/aggregate`, { params })).then(r => r.value)
  }

  private _rangeFilters(field: string | undefined, range: KpiRange | undefined): KpiFilter[] {
    if (!field || !range) return []

    return [
      { field, operator: 'gte', value: range.start },
      { field, operator: 'lt', value: range.end }
    ]
  }

  private _countBy(api: string, filters: KpiFilter[]): Promise<number> {
    // Record<string, string> y no un literal condicional: la unión de dos formas de objeto
    // no encaja en ninguna sobrecarga de HttpClient.get
    const params: Record<string, string> = { page: '1', pageSize: '1' }
    if (filters.length) params['filters'] = JSON.stringify(filters)

    return firstValueFrom(this._http.get<PaginatedTotal>(api, { params })).then(r => r.total)
  }

  /** Los N primeros por un campo: una sola petición, la página ya viene ordenada. */
  private _top(api: string, field: string, dir: string, n: number) {
    return resource<Record<string, unknown>[], unknown>({
      loader: () =>
        firstValueFrom(
          this._http.get<{ items: Record<string, unknown>[] }>(api, {
            params: { page: '1', pageSize: String(n), sortField: field, sortDir: dir }
          })
        ).then(r => r.items)
    })
  }

  /**
   * Altas por mes en UNA petición (spec 72): el endpoint agrupa por mes y rellena los meses
   * vacíos. Antes eran doce peticiones, con dos filtros de rango cada una.
   *
   * La etiqueta se compone aquí: el backend devuelve la clave 'YYYY-MM', que es dato; el nombre
   * del mes es presentación.
   */
  private _series(api: string, field: string, measure: string, measureField?: string) {
    // el null de un mes sin datos (media/máx/mín) se CONSERVA: lo decide monthsOf en el servidor
    return resource<{ label: string; count: number | null }[], unknown>({
      loader: () =>
        this._grouped(api, { measure, field: measureField, bucketField: field, months: 12 }).then(groups =>
          groups.map(group => ({ label: monthLabel(group.key), count: group.value }))
        )
    })
  }

  private _grouped(api: string, spec: GroupedRequest): Promise<AggregateGroup[]> {
    const params: Record<string, string> = { page: '1', pageSize: '1', op: spec.measure }
    if (spec.field) params['field'] = spec.field
    if (spec.groupBy) params['groupBy'] = spec.groupBy
    if (spec.bucketField) {
      params['bucket'] = 'month'
      params['bucketField'] = spec.bucketField
      params['months'] = String(spec.months ?? 12)
    }
    if (spec.filters?.length) params['filters'] = JSON.stringify(spec.filters)

    return firstValueFrom(this._http.get<{ groups?: AggregateGroup[] }>(`${api}/aggregate`, { params })).then(
      r => r.groups ?? []
    )
  }

  // @ai:begin dashboard-service-extra — agregados de dominio (cargas propias, computed)
  // @ai:end
}
