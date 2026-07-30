import { provideZonelessChangeDetection, signal } from '@angular/core'
import { render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { ConsumptionSummaryDto, MetricConsumptionDto } from '@sap-licenses/shared/domain'
import { MetricConsumptionMother } from '../../../../../../../tests/mothers/metric-consumption.mother'
import { ConsumptionRequest, ConsumptionService } from '../../../../../../core/services/consumption.service'
import { OffsetPaginatedOutput } from '../../../../../../core/services/contract.service'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { LicensesUnderusedComponent } from './licenses-underused.component'

vi.mock('../../../../../../shared/utils/download-file', () => ({ downloadBlob: vi.fn() }))

const exportUnderusedSpy = vi
  .fn()
  .mockResolvedValue({ blob: new Blob(['x']), filename: 'consumo-metricas-infrautilizadas.csv' })

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

const underusedRequestSignal = signal<ConsumptionRequest>({ page: 1, pageSize: 10 })

const mockConsumptionService = (state: MockState) =>
  ({
    underusedSummary: {
      isLoading: signal(state.loading ?? false),
      error: signal(state.error),
      value: signal(state.summary)
    },
    underusedRows: {
      isLoading: signal(false),
      error: signal(undefined),
      value: signal(state.items ? paginated(state.items) : undefined)
    },
    underusedRequest: underusedRequestSignal,
    exportUnderused: exportUnderusedSpy
  }) as unknown as ConsumptionService

const renderUnderused = (state: MockState) =>
  render(LicensesUnderusedComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: ConsumptionService, useValue: mockConsumptionService(state) }
    ]
  })

const SUMMARY: ConsumptionSummaryDto = { metricCount: 12, impactedCustomers: 8, avgUtilizationPct: 21.7 }

const underusedRow = MetricConsumptionMother.create({
  metricId: 'CP101',
  metricName: 'Contacts - Marketing',
  consumed: 130,
  purchased: 1000,
  utilizationPct: 13,
  isOverConsumed: false,
  consumptionDelta: 870
})

const loaded = (): MockState => ({ summary: SUMMARY, items: [underusedRow] })

describe('LicensesUnderusedComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    underusedRequestSignal.set({ page: 1, pageSize: 10 })
  })

  it('shows the page heading for the metric consumption view', async () => {
    await renderUnderused(loaded())
    expect(screen.getByRole('heading', { level: 1, name: 'Consumo infrautilizado' })).toBeTruthy()
  })

  it('renders the three SAP KPI cards and no money or park KPIs', async () => {
    await renderUnderused(loaded())
    expect(screen.getByText('Métricas infrautilizadas')).toBeTruthy()
    expect(screen.getByText('Clientes afectados')).toBeTruthy()
    expect(screen.getByText('Consumo promedio')).toBeTruthy()
    expect(screen.queryByText('Valor en riesgo')).toBeNull()
    expect(screen.queryByText('% del parque afectado')).toBeNull()
    expect(screen.queryByText('Distribución por solución')).toBeNull()
  })

  it('reads the KPI values from the summary', async () => {
    const { fixture } = await renderUnderused(loaded())
    const cmp = fixture.componentInstance

    expect(cmp.metricCount()).toBe(12)
    expect(cmp.customerCount()).toBe(8)
    expect(cmp.avgConsumption()).toBe('21.7%')
  })

  it('builds the table rows with the SAP percentage and no excess column', async () => {
    const { fixture } = await renderUnderused(loaded())
    const row = fixture.componentInstance.tableData()[0]

    expect(row['customerName']).toBe('Acme Corp')
    expect(row['utilizationPctFmt']).toBe('13.0%')
    expect(fixture.componentInstance.columns.find(c => c.key === 'excessUnits')).toBeUndefined()
  })

  it('lets the customer column sort now that the backend stores it as a real column', async () => {
    const { fixture } = await renderUnderused(loaded())
    const customer = fixture.componentInstance.columns.find(c => c.key === 'customerName')

    expect(customer?.sortable).not.toBe(false)
    expect(customer?.filterable).not.toBe(true)
  })

  it('sorts the formatted percentage by its numeric backing field', async () => {
    const { fixture } = await renderUnderused(loaded())
    const pct = fixture.componentInstance.columns.find(c => c.key === 'utilizationPctFmt')

    expect(pct?.sortField).toBe('utilizationPct')
  })

  it('offers the source as a filterable badge column', async () => {
    const { fixture } = await renderUnderused(loaded())
    const source = fixture.componentInstance.columns.find(c => c.key === 'source')

    expect(source?.type).toBe('badge')
    expect(source?.filterable).toBe(true)
  })

  it('exports the underused cut from the backend and downloads the file', async () => {
    const { fixture } = await renderUnderused(loaded())

    await fixture.componentInstance.onExport('csv')

    expect(exportUnderusedSpy).toHaveBeenCalledWith('csv')
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'consumo-metricas-infrautilizadas.csv')
  })

  it('renders no row actions: a metric row is read-only (no edit/delete)', async () => {
    await renderUnderused(loaded())
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  })

  it('shows the loading state while fetching', async () => {
    await renderUnderused({ loading: true })
    expect(screen.getByText('Cargando consumo…')).toBeTruthy()
  })

  it('shows the error state when the request fails', async () => {
    await renderUnderused({ error: new Error('boom') })
    expect(screen.getByText('No se pudo cargar el consumo')).toBeTruthy()
  })

  it('shows zeroed KPIs when the cut is empty', async () => {
    const empty: ConsumptionSummaryDto = { metricCount: 0, impactedCustomers: 0, avgUtilizationPct: 0 }
    const { fixture } = await renderUnderused({ summary: empty, items: [] })
    const cmp = fixture.componentInstance

    expect(cmp.metricCount()).toBe(0)
    expect(cmp.avgConsumption()).toBe('0.0%')
    expect(cmp.total()).toBe(0)
  })

  it('onPageSize sets the size and resets to page 1', async () => {
    const { fixture } = await renderUnderused(loaded())
    fixture.componentInstance.onPage(3)

    fixture.componentInstance.onPageSize(25)

    expect(underusedRequestSignal()).toMatchObject({ page: 1, pageSize: 25 })
  })

  it('onSearch sets the term and resets to page 1', async () => {
    const { fixture } = await renderUnderused(loaded())
    fixture.componentInstance.onPage(3)

    fixture.componentInstance.onSearch('acme')

    expect(underusedRequestSignal()).toMatchObject({ page: 1, search: 'acme' })
  })

  it('onFilters sets the filters and resets to page 1, keeping the active order', async () => {
    const { fixture } = await renderUnderused(loaded())
    underusedRequestSignal.set({ page: 4, pageSize: 10, orders: [{ orderBy: 'utilizationPct', orderType: 'asc' }] })

    const filters = [{ column: 'solutionAreaName', columnLabel: 'Solución', operator: 'contains', value: 'HANA' }]
    fixture.componentInstance.onFilters(filters)

    expect(underusedRequestSignal().filters).toEqual(filters)
    expect(underusedRequestSignal().page).toBe(1)
    expect(underusedRequestSignal().orders).toEqual([{ orderBy: 'utilizationPct', orderType: 'asc' }])
  })
})
