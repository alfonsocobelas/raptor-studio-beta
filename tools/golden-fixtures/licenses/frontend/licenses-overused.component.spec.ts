import { provideZonelessChangeDetection, signal } from '@angular/core'
import { render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { ConsumptionSummaryDto, MetricConsumptionDto } from '@sap-licenses/shared/domain'
import { MetricConsumptionMother } from '../../../../../../../tests/mothers/metric-consumption.mother'
import { ConsumptionRequest, ConsumptionService } from '../../../../../../core/services/consumption.service'
import { OffsetPaginatedOutput } from '../../../../../../core/services/contract.service'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { LicensesOverusedComponent } from './licenses-overused.component'

vi.mock('../../../../../../shared/utils/download-file', () => ({ downloadBlob: vi.fn() }))

const exportOverusedSpy = vi.fn().mockResolvedValue({ blob: new Blob(['x']), filename: 'consumo-metricas.csv' })

interface MockState {
  loading?: boolean
  error?: unknown
  summary?: ConsumptionSummaryDto
  items?: MetricConsumptionDto[]
}

const paginated = (items: MetricConsumptionDto[]): OffsetPaginatedOutput<MetricConsumptionDto> => ({
  total: items.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items
})

const overusedRequestSignal = signal<ConsumptionRequest>({ page: 1, pageSize: 10 })

const mockConsumptionService = (state: MockState) =>
  ({
    overusedSummary: {
      isLoading: signal(state.loading ?? false),
      error: signal(state.error),
      value: signal(state.summary)
    },
    overusedRows: {
      isLoading: signal(false),
      error: signal(undefined),
      value: signal(state.items ? paginated(state.items) : undefined)
    },
    overusedRequest: overusedRequestSignal,
    exportOverused: exportOverusedSpy
  }) as unknown as ConsumptionService

const renderOverused = (state: MockState) =>
  render(LicensesOverusedComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: ConsumptionService, useValue: mockConsumptionService(state) }
    ]
  })

const SUMMARY: ConsumptionSummaryDto = { metricCount: 27, impactedCustomers: 16, avgUtilizationPct: 132.4 }

const overusedRow = MetricConsumptionMother.create()
const unmeasuredRow = MetricConsumptionMother.create({
  id: '019eb713-19bb-7000-8000-000000000202',
  metricId: 'CU900',
  metricName: 'Unlimited Synthetic Metric',
  consumed: 512,
  purchased: 0,
  utilizationPct: null,
  unlimitedEntitlement: true,
  consumptionDelta: 0,
  sapLastUpdate: null
})

const loaded = (): MockState => ({ summary: SUMMARY, items: [overusedRow, unmeasuredRow] })

describe('LicensesOverusedComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    overusedRequestSignal.set({ page: 1, pageSize: 10 })
  })

  it('shows the page heading for the metric consumption view', async () => {
    await renderOverused(loaded())
    expect(screen.getByRole('heading', { level: 1, name: 'Consumo con sobreuso' })).toBeTruthy()
  })

  it('renders the three SAP KPI cards and no money KPI', async () => {
    await renderOverused(loaded())
    expect(screen.getByText('Métricas en exceso')).toBeTruthy()
    expect(screen.getByText('Clientes afectados')).toBeTruthy()
    expect(screen.getByText('Sobreuso promedio')).toBeTruthy()
    expect(screen.queryByText('Valor upsell potencial')).toBeNull()
    expect(screen.queryByText('En infracción contractual')).toBeNull()
  })

  it('reads the KPI values from the summary', async () => {
    const { fixture } = await renderOverused(loaded())
    const cmp = fixture.componentInstance

    expect(cmp.metricCount()).toBe(27)
    expect(cmp.customerCount()).toBe(16)
    expect(cmp.avgOveruse()).toBe('132.4%')
  })

  it('builds the table rows with the computed excess and the SAP percentage', async () => {
    const { fixture } = await renderOverused(loaded())
    const row = fixture.componentInstance.tableData()[0]

    expect(row['customerName']).toBe('Acme Corp')
    expect(row['excessUnits']).toBe(50)
    expect(row['utilizationPctFmt']).toBe('150.0%')
    expect(row['sapLastUpdate']).toBe('2026-07-18')
  })

  it('renders an em dash instead of inventing a percentage for unmeasured rows', async () => {
    const { fixture } = await renderOverused(loaded())
    const row = fixture.componentInstance.tableData()[1]

    expect(row['utilizationPctFmt']).toBe('—')
    expect(row['excessUnits']).toBe(0)
  })

  it('lets the customer column sort now that the backend stores it as a real column', async () => {
    const { fixture } = await renderOverused(loaded())
    const customer = fixture.componentInstance.columns.find(c => c.key === 'customerName')

    expect(customer?.sortable).not.toBe(false)
    expect(customer?.filterable).not.toBe(true)
  })

  it('sorts the formatted percentage by its numeric backing field', async () => {
    const { fixture } = await renderOverused(loaded())
    const pct = fixture.componentInstance.columns.find(c => c.key === 'utilizationPctFmt')

    expect(pct?.sortField).toBe('utilizationPct')
  })

  it('offers the source as a filterable badge column with both cloud values', async () => {
    const { fixture } = await renderOverused(loaded())
    const source = fixture.componentInstance.columns.find(c => c.key === 'source')

    expect(source?.type).toBe('badge')
    expect(source?.filterable).toBe(true)
    expect(source?.badgeMap?.['PUBLIC_CLOUD']?.label).toBe('Nube pública')
    expect(source?.badgeMap?.['PRIVATE_CLOUD']?.label).toBe('Nube privada')
  })

  it('exports the overused cut from the backend and downloads the file', async () => {
    const { fixture } = await renderOverused(loaded())

    await fixture.componentInstance.onExport('csv')

    expect(exportOverusedSpy).toHaveBeenCalledWith('csv')
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'consumo-metricas.csv')
  })

  it('renders no row actions: a metric row is read-only (no edit/delete)', async () => {
    await renderOverused(loaded())
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  })

  it('shows the loading state while fetching', async () => {
    await renderOverused({ loading: true })
    expect(screen.getByText('Cargando consumo…')).toBeTruthy()
  })

  it('shows the error state when the request fails', async () => {
    await renderOverused({ error: new Error('boom') })
    expect(screen.getByText('No se pudo cargar el consumo')).toBeTruthy()
  })

  it('shows zeroed KPIs when the cut is empty', async () => {
    const empty: ConsumptionSummaryDto = { metricCount: 0, impactedCustomers: 0, avgUtilizationPct: 0 }
    const { fixture } = await renderOverused({ summary: empty, items: [] })
    const cmp = fixture.componentInstance

    expect(cmp.metricCount()).toBe(0)
    expect(cmp.avgOveruse()).toBe('0.0%')
    expect(cmp.total()).toBe(0)
  })

  it('onPageSize sets the size and resets to page 1', async () => {
    const { fixture } = await renderOverused(loaded())
    fixture.componentInstance.onPage(3)

    fixture.componentInstance.onPageSize(25)

    expect(overusedRequestSignal()).toMatchObject({ page: 1, pageSize: 25 })
  })

  it('onSearch sets the term and resets to page 1', async () => {
    const { fixture } = await renderOverused(loaded())
    fixture.componentInstance.onPage(3)

    fixture.componentInstance.onSearch('acme')

    expect(overusedRequestSignal()).toMatchObject({ page: 1, search: 'acme' })
  })

  it('onFilters sets the filters and resets to page 1, keeping the active order', async () => {
    const { fixture } = await renderOverused(loaded())
    overusedRequestSignal.set({ page: 4, pageSize: 10, orders: [{ orderBy: 'utilizationPct', orderType: 'desc' }] })

    const filters = [{ column: 'solutionAreaName', columnLabel: 'Solución', operator: 'contains', value: 'HANA' }]
    fixture.componentInstance.onFilters(filters)

    expect(overusedRequestSignal().filters).toEqual(filters)
    expect(overusedRequestSignal().page).toBe(1)
    expect(overusedRequestSignal().orders).toEqual([{ orderBy: 'utilizationPct', orderType: 'desc' }])
  })
})
