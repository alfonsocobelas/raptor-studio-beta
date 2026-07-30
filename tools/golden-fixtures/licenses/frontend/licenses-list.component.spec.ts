import { provideZonelessChangeDetection, signal } from '@angular/core'
import { Router } from '@angular/router'
import { render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { HealthStatusEnum, LicenseWithConsumptionDto } from '@sap-licenses/shared/domain'
import { LicenseMother } from '../../../../../../../tests/mothers/license.mother'
import { LicenseRequest, LicenseService, OffsetPaginatedOutput } from '../../../../../../core/services/license.service'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { LicensesListComponent } from './licenses-list.component'

vi.mock('../../../../../../shared/utils/download-file', () => ({ downloadBlob: vi.fn() }))

type Spy = ReturnType<typeof vi.fn>

interface MockState {
  loading?: boolean
  error?: unknown
  value?: OffsetPaginatedOutput<LicenseWithConsumptionDto>
}

const paginated = (items: LicenseWithConsumptionDto[]): OffsetPaginatedOutput<LicenseWithConsumptionDto> => ({
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  items
})

const mockService = (state: MockState, resetRequest: Spy = vi.fn()) =>
  ({
    request: signal({ page: 1, pageSize: 20 }),
    resetRequest,
    licenses: {
      isLoading: signal(state.loading ?? false),
      error: signal(state.error),
      value: signal(state.value)
    }
  }) as unknown as LicenseService

interface RenderOpts {
  navigate?: Spy
  resetRequest?: Spy
  previousUrl?: string
}

const routerMock = (navigate: Spy, previousUrl?: string) => ({
  navigate,
  getCurrentNavigation: () =>
    previousUrl ? { previousNavigation: { finalUrl: { toString: () => previousUrl } } } : null
})

const renderList = (state: MockState, opts: RenderOpts = {}) =>
  render(LicensesListComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: LicenseService, useValue: mockService(state, opts.resetRequest) },
      { provide: Router, useValue: routerMock(opts.navigate ?? vi.fn(), opts.previousUrl) }
    ]
  })

describe('LicensesListComponent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('always shows the page heading', async () => {
    await renderList({ value: paginated(LicenseMother.list(1)) })
    expect(screen.getByText('Licencias')).toBeTruthy()
  })

  it('resets the service request on init when entering from outside the section', async () => {
    const resetRequest = vi.fn()
    await renderList(
      { value: paginated(LicenseMother.list(1)) },
      { resetRequest, previousUrl: '/sap-licensing/contracts' }
    )
    expect(resetRequest).toHaveBeenCalledTimes(1)
  })

  it('keeps the service request when returning from a license detail', async () => {
    const resetRequest = vi.fn()
    await renderList(
      { value: paginated(LicenseMother.list(1)) },
      { resetRequest, previousUrl: '/sap-licensing/licenses/0197f8a2-1111-7000-8000-000000000001' }
    )
    expect(resetRequest).not.toHaveBeenCalled()
  })

  it('shows the loading state while fetching', async () => {
    await renderList({ loading: true })
    expect(screen.getByText('Cargando licencias…')).toBeTruthy()
  })

  it('shows the error state when the request fails', async () => {
    await renderList({ error: new Error('boom') })
    expect(screen.getByText('No se pudieron cargar las licencias')).toBeTruthy()
  })

  it('shows the empty state when there are no licenses', async () => {
    await renderList({ value: paginated([]) })
    expect(screen.getByText('No hay licencias registradas')).toBeTruthy()
  })

  it('renders the data table when licenses are available', async () => {
    const { container } = await renderList({ value: paginated(LicenseMother.list(2)) })
    expect(container.querySelector('app-data-table')).toBeTruthy()
  })

  it('is observability-only: no create/edit/delete, only the "view" row action', async () => {
    const { fixture } = await renderList({ value: paginated(LicenseMother.list(2)) })

    expect(screen.queryByRole('button', { name: /nueva licencia/i })).toBeNull()
    expect(fixture.componentInstance.actions.map(a => a.action)).toEqual(['view'])
  })

  it('formats consumptionPct as a one-decimal percentage in rows()', async () => {
    const license = LicenseMother.withConsumption({ licensedUnits: 200, currentUnits: 50 })
    const { fixture } = await renderList({ value: paginated([license]) })

    expect(fixture.componentInstance.rows()[0]['consumptionPctFmt']).toBe('25.0%')
  })

  it('defines the 8 expected columns', async () => {
    const { fixture } = await renderList({ value: paginated([]) })
    const keys = fixture.componentInstance.columns.map(c => c.key)

    expect(keys).toEqual([
      'customerName',
      'subSolutionAreaName',
      'contractNumber',
      'metric',
      'licensedUnits',
      'currentUnits',
      'consumptionPctFmt',
      'healthStatus'
    ])
  })

  it('marks only the SQL-sortable columns as sortable', async () => {
    const { fixture } = await renderList({ value: paginated([]) })
    const sortable = fixture.componentInstance.columns.filter(c => c.sortable !== false).map(c => c.key)

    expect(sortable).toEqual(['customerName', 'subSolutionAreaName', 'licensedUnits'])
  })

  describe('server-side wiring', () => {
    const buildService = (value: OffsetPaginatedOutput<LicenseWithConsumptionDto> = paginated([])) => {
      const request = signal<LicenseRequest>({ page: 1, pageSize: 10 })
      const service = {
        request,
        resetRequest: vi.fn(),
        licenses: { isLoading: signal(false), error: signal(undefined), value: signal(value) }
      } as unknown as LicenseService
      return { request, service }
    }

    const renderWith = (service: LicenseService) =>
      render(LicensesListComponent, {
        providers: [
          provideZonelessChangeDetection(),
          { provide: LicenseService, useValue: service },
          { provide: Router, useValue: routerMock(vi.fn()) }
        ]
      })

    it('onPage updates the request page', async () => {
      const { request, service } = buildService()
      const { fixture } = await renderWith(service)

      fixture.componentInstance.onPage(3)

      expect(request().page).toBe(3)
    })

    it('onPageSize sets the size and resets to page 1', async () => {
      const { request, service } = buildService()
      const { fixture } = await renderWith(service)
      fixture.componentInstance.onPage(3)

      fixture.componentInstance.onPageSize(25)

      expect(request()).toMatchObject({ page: 1, pageSize: 25 })
    })

    it('onSort sets orders and resets to page 1', async () => {
      const { request, service } = buildService()
      const { fixture } = await renderWith(service)
      fixture.componentInstance.onPage(3)

      fixture.componentInstance.onSort({ orderBy: 'customerName', orderType: 'desc' })

      expect(request()).toMatchObject({ page: 1, orders: [{ orderBy: 'customerName', orderType: 'desc' }] })
    })

    it('onSort(null) clears orders and resets to page 1', async () => {
      const { request, service } = buildService()
      const { fixture } = await renderWith(service)
      fixture.componentInstance.onSort({ orderBy: 'customerName', orderType: 'asc' })

      fixture.componentInstance.onSort(null)

      expect(request().orders).toBeUndefined()
      expect(request().page).toBe(1)
    })

    it('onSearch sets the term (undefined when cleared) and resets to page 1', async () => {
      const { request, service } = buildService()
      const { fixture } = await renderWith(service)
      fixture.componentInstance.onPage(3)

      fixture.componentInstance.onSearch('acme')
      expect(request()).toMatchObject({ page: 1, search: 'acme' })

      fixture.componentInstance.onSearch('')
      expect(request().search).toBeUndefined()
    })

    it('only marks allowlisted columns as filterable', async () => {
      const { service } = buildService()
      const { fixture } = await renderWith(service)
      const filterableOf = (key: string) => fixture.componentInstance.columns.find(c => c.key === key)?.filterable

      // In LICENSE allowed filters → opt-in filterable.
      expect(filterableOf('customerName')).toBe(true)
      expect(filterableOf('subSolutionAreaName')).toBe(true)
      expect(filterableOf('metric')).toBe(true)
      // Derived/enriched or out of the allowlist → not filterable (would 400 on the backend).
      expect(filterableOf('contractNumber')).not.toBe(true)
      expect(filterableOf('licensedUnits')).not.toBe(true)
      expect(filterableOf('currentUnits')).not.toBe(true)
      expect(filterableOf('consumptionPctFmt')).not.toBe(true)
      expect(filterableOf('healthStatus')).not.toBe(true)
    })

    it('onFilters sets the filters and resets to page 1, keeping the active order', async () => {
      const { request, service } = buildService()
      const { fixture } = await renderWith(service)
      request.set({ page: 4, pageSize: 10, orders: [{ orderBy: 'customerName', orderType: 'asc' }] })

      const filters = [{ column: 'customerName', columnLabel: 'Cliente', operator: 'starts_with', value: 'Ac' }]
      fixture.componentInstance.onFilters(filters)

      expect(request().filters).toEqual(filters)
      expect(request().page).toBe(1)
      expect(request().orders).toEqual([{ orderBy: 'customerName', orderType: 'asc' }])
    })

    it('keeps the table mounted when a filter yields zero results (so filters stay reachable)', async () => {
      const { request, service } = buildService(paginated([]))
      request.set({
        page: 1,
        pageSize: 10,
        filters: [{ column: 'metric', columnLabel: 'Métrica', operator: 'eq', value: 'FUE' }]
      })

      await renderWith(service)

      // The full-replacement message would hide the toolbar, trapping the user with an unclearable filter.
      expect(screen.queryByText('No hay licencias registradas')).toBeNull()
      expect(screen.getByText('Filtros')).toBeTruthy()
      expect(screen.getByText('No se encontraron registros')).toBeTruthy()
    })

    it('exposes the API total from the loaded page', async () => {
      const { service } = buildService({ total: 42, page: 1, pageSize: 10, totalPages: 5, items: [] })
      const { fixture } = await renderWith(service)

      expect(fixture.componentInstance.total()).toBe(42)
    })
  })

  it('renders the customer and solution of each license', async () => {
    const license = LicenseMother.withConsumption({ customerName: 'Acme Corp', subSolutionAreaName: 'BTP' })
    await renderList({ value: paginated([license]) })

    expect(screen.getByText('Acme Corp')).toBeTruthy()
    expect(screen.getByText('BTP')).toBeTruthy()
  })

  it('renders the health status as a translated badge', async () => {
    const license = LicenseMother.withConsumption({ licensedUnits: 200, currentUnits: 50 })
    await renderList({ value: paginated([license]) })

    expect(license.healthStatus).toBe(HealthStatusEnum.UNDERUSED)
    expect(screen.getByText('Infrautilizada')).toBeTruthy()
  })

  it('navigates to the license detail on the "view" action', async () => {
    const navigate = vi.fn()
    const license = LicenseMother.withConsumption()
    const { fixture } = await renderList({ value: paginated([license]) }, { navigate })

    fixture.componentInstance.onAction({ action: 'view', row: license as unknown as Record<string, unknown> })

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/licenses', license.id])
  })

  it('exports from the backend with the current orders and downloads the returned file', async () => {
    const blob = new Blob(['data'])
    const exportSpy = vi.fn().mockResolvedValue({ blob, filename: 'licencias-20260707.csv' })
    const service = {
      request: signal({ page: 1, pageSize: 20, orders: [{ orderBy: 'customerName', orderType: 'asc' }] }),
      licenses: {
        isLoading: signal(false),
        error: signal(undefined),
        value: signal(paginated([LicenseMother.withConsumption()]))
      },
      export: exportSpy,
      resetRequest: vi.fn()
    } as unknown as LicenseService

    const { fixture } = await render(LicensesListComponent, {
      providers: [
        provideZonelessChangeDetection(),
        { provide: LicenseService, useValue: service },
        { provide: Router, useValue: routerMock(vi.fn()) }
      ]
    })

    await fixture.componentInstance.onExport('csv')

    // The service reads search/orders from its own request signal, so the host only passes the format.
    expect(exportSpy).toHaveBeenCalledWith('csv')
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'licencias-20260707.csv')
  })
})
