import { provideZonelessChangeDetection, signal } from '@angular/core'
import { By } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { toast } from '@spartan-ng/brain/sonner'
import { BillingFrequencyEnum, ContractDto, ContractTypeEnum } from '@sap-licenses/shared/domain'
import { ContractMother } from '../../../../../../../tests/mothers/contract.mother'
import { CustomerMother } from '../../../../../../../tests/mothers/customer.mother'
import {
  ContractRequest,
  ContractService,
  OffsetPaginatedOutput
} from '../../../../../../core/services/contract.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { CustomerService } from '../../../../../../core/services/customer.service'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { ContractDialogComponent, ContractFormValue } from './contract-dialog.component'
import { ContractsListComponent } from './contracts-list.component'

vi.mock('@spartan-ng/brain/sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

vi.mock('../../../../../../shared/utils/download-file', () => ({ downloadBlob: vi.fn() }))

interface MockState {
  loading?: boolean
  error?: unknown
  value?: OffsetPaginatedOutput<ContractDto>
}

const paginated = (items: ContractDto[]): OffsetPaginatedOutput<ContractDto> => ({
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  items
})

type Spy = ReturnType<typeof vi.fn>

const mockService = (state: MockState, spies: { create?: Spy; update?: Spy; export?: Spy; resetRequest?: Spy } = {}) =>
  ({
    request: signal({ page: 1, pageSize: 20 }),
    resetRequest: spies.resetRequest ?? vi.fn(),
    contracts: {
      isLoading: signal(state.loading ?? false),
      error: signal(state.error),
      value: signal(state.value)
    },
    create: spies.create ?? vi.fn(),
    update: spies.update ?? vi.fn(),
    export: spies.export ?? vi.fn().mockResolvedValue({ blob: new Blob(['x']), filename: 'contratos-20260707.csv' })
  }) as unknown as ContractService

interface RenderOpts {
  navigate?: Spy
  create?: Spy
  update?: Spy
  export?: Spy
  resetRequest?: Spy
  previousUrl?: string
  canWrite?: boolean
}

const routerMock = (navigate: Spy, previousUrl?: string) => ({
  navigate,
  getCurrentNavigation: () =>
    previousUrl ? { previousNavigation: { finalUrl: { toString: () => previousUrl } } } : null
})

const renderList = (state: MockState, opts: RenderOpts = {}) =>
  render(ContractsListComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: ContractService, useValue: mockService(state, opts) },
      { provide: Router, useValue: routerMock(opts.navigate ?? vi.fn(), opts.previousUrl) },
      { provide: AuthService, useValue: { canWrite: signal(opts.canWrite ?? true) } }
    ]
  })

const formValue = (overrides: Partial<ContractFormValue> = {}): ContractFormValue => ({
  contractType: 'cloud' as ContractFormValue['contractType'],
  contractNumber: 'AVV-NEW-2026-001',
  customerId: '019eb713-19bb-7000-8000-0000000000a1',
  customerName: 'Acme Corp',
  startDate: '2026-01-01',
  endDate: '2027-01-01',
  status: 'active' as ContractFormValue['status'],
  currency: 'EUR',
  billingFrequency: 'yearly' as ContractFormValue['billingFrequency'],
  renewalType: 'manual' as ContractFormValue['renewalType'],
  source: 'AVVALE_SOLD' as ContractFormValue['source'],
  isFavorite: false,
  notes: '',
  ...overrides
})

describe('ContractsListComponent', () => {
  // El backend ya devuelve 403 a un viewer que intente escribir; esto evita ofrecerle acciones que
  // solo pueden acabar en error.
  it('hides the write actions from a viewer', async () => {
    await renderList({ value: paginated(ContractMother.list(1)) }, { canWrite: false })

    expect(screen.queryByRole('button', { name: /nuevo contrato/i })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeTruthy()
  })

  it('shows the write actions to a user who can write', async () => {
    await renderList({ value: paginated(ContractMother.list(1)) }, { canWrite: true })

    expect(screen.getByRole('button', { name: /nuevo contrato/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
  })

  beforeEach(() => vi.clearAllMocks())

  it('resets the service request on init when entering from outside the section', async () => {
    const resetRequest = vi.fn()
    await renderList(
      { value: paginated(ContractMother.list(1)) },
      { resetRequest, previousUrl: '/sap-licensing/customers' }
    )
    expect(resetRequest).toHaveBeenCalledTimes(1)
  })

  it('keeps the service request when returning from a contract detail', async () => {
    const resetRequest = vi.fn()
    await renderList(
      { value: paginated(ContractMother.list(1)) },
      { resetRequest, previousUrl: '/sap-licensing/contracts/0197f8a2-1111-7000-8000-000000000001' }
    )
    expect(resetRequest).not.toHaveBeenCalled()
  })

  it('always shows the page heading', async () => {
    await renderList({ value: paginated(ContractMother.list(1)) })
    expect(screen.getByText('Contratos')).toBeTruthy()
  })

  it('exports from the backend and downloads the returned file', async () => {
    const exportSpy = vi.fn().mockResolvedValue({ blob: new Blob(['x']), filename: 'contratos-20260707.xlsx' })
    const { fixture } = await renderList({ value: paginated(ContractMother.list(1)) }, { export: exportSpy })

    await fixture.componentInstance.onExport('xlsx')

    expect(exportSpy).toHaveBeenCalledWith('xlsx')
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'contratos-20260707.xlsx')
  })

  it('shows the loading state while fetching', async () => {
    await renderList({ loading: true })
    expect(screen.getByText('Cargando contratos…')).toBeTruthy()
  })

  it('shows the error state when the request fails', async () => {
    await renderList({ error: new Error('boom') })
    expect(screen.getByText('No se pudieron cargar los contratos')).toBeTruthy()
  })

  it('shows the empty state when there are no contracts', async () => {
    await renderList({ value: paginated([]) })
    expect(screen.getByText('No hay contratos registrados')).toBeTruthy()
  })

  it('shows the data table with contracts when data is available', async () => {
    const contracts = ContractMother.list(2)
    await renderList({ value: paginated(contracts) })

    expect(screen.getByText(contracts[0].contractNumber ?? '')).toBeTruthy()
    expect(screen.getByText(contracts[1].contractNumber ?? '')).toBeTruthy()
  })

  it('shows the billing frequency as a Spanish label, not the raw enum value', async () => {
    const contract = ContractMother.one({ billingFrequency: BillingFrequencyEnum.YEARLY })
    await renderList({ value: paginated([contract]) })

    expect(screen.getByText('Anual')).toBeTruthy()
    expect(screen.queryByText('yearly')).toBeNull()
  })

  it('formats totalValue as EUR currency', async () => {
    const contract = ContractMother.one({ totalValue: 1250000 })
    const { fixture } = await renderList({ value: paginated([contract]) })

    expect(fixture.componentInstance.rows()[0]['totalValue']).toContain('1.250.000')
  })

  it('renders totalValue as "—" when it is null (contract without licenses, spec 40)', async () => {
    const contract = ContractMother.one({ totalValue: null })
    const { fixture } = await renderList({ value: paginated([contract]) })

    expect(fixture.componentInstance.rows()[0]['totalValue']).toBe('—')
  })

  it('shows a maintenance badge for maintenance contracts (spec 44)', async () => {
    const contract = ContractMother.one({ contractType: ContractTypeEnum.MAINTENANCE })
    await renderList({ value: paginated([contract]) })

    expect(screen.getByText('Mantenimiento')).toBeTruthy()
  })

  it('renders "—" for a null contractNumber and startDate (maintenance contracts, spec 44)', async () => {
    const contract = ContractMother.one({
      contractType: ContractTypeEnum.MAINTENANCE,
      contractNumber: null,
      startDate: null
    })
    await renderList({ value: paginated([contract]) })

    // Dos guiones: contractNumber (celda de texto) + startDate (celda de fecha)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })

  it('navigates to the contract detail on the "view" action', async () => {
    const navigate = vi.fn()
    const contract = ContractMother.one()
    const { fixture } = await renderList({ value: paginated([contract]) }, { navigate })

    fixture.componentInstance.onAction({ action: 'view', row: contract as unknown as Record<string, unknown> })

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/contracts', contract.id])
  })

  it('openCreate opens the dialog in create mode', async () => {
    const { fixture } = await renderList({ value: paginated([]) })
    const cmp = fixture.componentInstance

    cmp.openCreate()

    expect(cmp.dialogOpen()).toBe(true)
    expect(cmp.editingContract()).toBeNull()
  })

  it('the "edit" action selects the contract and opens the dialog', async () => {
    const contract = ContractMother.one()
    const { fixture } = await renderList({ value: paginated([contract]) })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: contract as unknown as Record<string, unknown> })

    expect(cmp.dialogOpen()).toBe(true)
    expect(cmp.editingContract()).toEqual(contract)
  })

  it('offers no delete action (contracts are governed by the sync, spec 32)', async () => {
    const { fixture } = await renderList({ value: paginated([ContractMother.one()]) })

    expect(fixture.componentInstance.actions().some(a => a.action === 'delete')).toBe(false)
  })

  it('onSave creates a new contract with a generated id', async () => {
    const create = vi.fn().mockResolvedValue(undefined)
    const { fixture } = await renderList({ value: paginated([]) }, { create })
    const cmp = fixture.componentInstance

    cmp.openCreate()
    await cmp.onSave(formValue({ contractNumber: 'AVV-X' }))

    expect(create).toHaveBeenCalledTimes(1)
    const dto = create.mock.calls[0][0]
    expect(dto).toMatchObject({ contractNumber: 'AVV-X', customerName: 'Acme Corp' })
    expect(typeof dto.id).toBe('string')
    expect(cmp.dialogOpen()).toBe(false)
    expect(toast.success).toHaveBeenCalledWith('Contrato creado correctamente')
  })

  it('onSave updates the existing contract in edit mode', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const contract = ContractMother.one()
    const { fixture } = await renderList({ value: paginated([contract]) }, { update })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: contract as unknown as Record<string, unknown> })
    await cmp.onSave(formValue({ contractNumber: 'AVV-EDITED' }))

    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0][0]).toBe(contract.id)
    expect(update.mock.calls[0][1]).toMatchObject({ contractNumber: 'AVV-EDITED' })
    expect(toast.success).toHaveBeenCalledWith('Contrato actualizado correctamente')
  })

  it('shows an error toast when creating a contract fails', async () => {
    const create = vi.fn().mockRejectedValue(new Error('boom'))
    const { fixture } = await renderList({ value: paginated([]) }, { create })
    const cmp = fixture.componentInstance

    cmp.openCreate()
    await cmp.onSave(formValue())

    expect(toast.error).toHaveBeenCalledWith('No se pudo crear el contrato')
  })

  it('remounts the dialog with a fresh form when reopening after entering data', async () => {
    const customer = CustomerMother.one({ id: '019eb713-19bb-7000-8000-0000000000a1', name: 'Acme Corp' })
    const customerService = {
      customers: { value: signal({ total: 1, page: 1, pageSize: 20, totalPages: 1, items: [customer] }) }
    } as unknown as CustomerService
    const { fixture } = await render(ContractsListComponent, {
      providers: [
        provideZonelessChangeDetection(),
        { provide: ContractService, useValue: mockService({ value: paginated([]) }) },
        { provide: Router, useValue: routerMock(vi.fn()) },
        { provide: CustomerService, useValue: customerService }
      ]
    })
    const cmp = fixture.componentInstance
    const dialog = () =>
      fixture.debugElement.query(By.directive(ContractDialogComponent))?.componentInstance as
        | ContractDialogComponent
        | undefined

    // Open "Nuevo contrato" and dirty a field.
    cmp.openCreate()
    fixture.detectChanges()
    await fixture.whenStable()
    const firstInstance = dialog()
    expect(firstInstance).toBeDefined()
    firstInstance!.form.controls.contractNumber.setValue('AVV-STALE-VALUE')

    // Close the dialog (Cancel / backdrop → host resets dialogOpen).
    cmp.dialogOpen.set(false)
    fixture.detectChanges()
    await fixture.whenStable()
    expect(dialog()).toBeUndefined()

    // Reopen in create mode: a fresh component with an empty form, not the stale one.
    cmp.openCreate()
    fixture.detectChanges()
    await fixture.whenStable()
    const secondInstance = dialog()
    expect(secondInstance).toBeDefined()
    expect(secondInstance).not.toBe(firstInstance)
    expect(secondInstance!.form.controls.contractNumber.value).toBe('')
  })
})

describe('ContractsListComponent — server-side pagination', () => {
  const withTotal = (items: ContractDto[], total: number): OffsetPaginatedOutput<ContractDto> => ({
    total,
    page: 1,
    pageSize: 10,
    totalPages: Math.max(1, Math.ceil(total / 10)),
    items
  })

  const setup = (state: MockState) => {
    const request = signal<ContractRequest>({ page: 1, pageSize: 10 })
    const service = {
      request,
      contracts: {
        isLoading: signal(state.loading ?? false),
        error: signal(state.error),
        value: signal(state.value)
      },
      create: vi.fn(),
      update: vi.fn(),
      resetRequest: vi.fn()
    } as unknown as ContractService
    return { service, request }
  }

  const renderWith = (service: ContractService) =>
    render(ContractsListComponent, {
      providers: [
        provideZonelessChangeDetection(),
        { provide: ContractService, useValue: service },
        { provide: Router, useValue: routerMock(vi.fn()) }
      ]
    })

  it('shows the API total in the footer, not the number of loaded rows', async () => {
    const { service } = setup({ value: withTotal(ContractMother.list(2), 28) })

    await renderWith(service)

    expect(screen.getByText(/de 28 registros/)).toBeTruthy()
  })

  it('onPage updates the request page', async () => {
    const { service, request } = setup({ value: withTotal(ContractMother.list(2), 28) })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onPage(3)

    expect(request().page).toBe(3)
  })

  it('onPageSize updates the page size and resets to page 1', async () => {
    const { service, request } = setup({ value: withTotal(ContractMother.list(2), 28) })
    request.set({ page: 3, pageSize: 10 })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onPageSize(25)

    expect(request().pageSize).toBe(25)
    expect(request().page).toBe(1)
  })

  it('onSort sets orders and resets to page 1; null clears orders', async () => {
    const { service, request } = setup({ value: withTotal(ContractMother.list(2), 28) })
    request.set({ page: 4, pageSize: 10 })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onSort({ orderBy: 'contractNumber', orderType: 'asc' })
    expect(request().orders).toEqual([{ orderBy: 'contractNumber', orderType: 'asc' }])
    expect(request().page).toBe(1)

    fixture.componentInstance.onSort(null)
    expect(request().orders).toBeUndefined()
  })

  it('onSearch sets the term (undefined when cleared) and resets to page 1', async () => {
    const { service, request } = setup({ value: withTotal(ContractMother.list(2), 28) })
    request.set({ page: 4, pageSize: 10, orders: [{ orderBy: 'contractNumber', orderType: 'asc' }] })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onSearch('acme')
    expect(request().search).toBe('acme')
    expect(request().page).toBe(1)
    // Orders and filters survive a search change.
    expect(request().orders).toEqual([{ orderBy: 'contractNumber', orderType: 'asc' }])

    fixture.componentInstance.onSearch('')
    expect(request().search).toBeUndefined()
  })

  it('exposes the persisted search term for the table input binding', async () => {
    const { service, request } = setup({ value: withTotal(ContractMother.list(2), 28) })
    request.set({ page: 1, pageSize: 10, search: 'acme' })
    const { fixture } = await renderWith(service)

    expect(fixture.componentInstance.search()).toBe('acme')
  })

  it('keeps the table mounted when a search yields zero results (so the search box stays reachable)', async () => {
    const { service, request } = setup({ value: withTotal([], 0) })
    request.set({ page: 1, pageSize: 10, search: 'zzz' })

    await renderWith(service)

    expect(screen.queryByText('No hay contratos registrados')).toBeNull()
    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('shows the empty state when the total is zero', async () => {
    const { service } = setup({ value: withTotal([], 0) })

    await renderWith(service)

    expect(screen.getByText('No hay contratos registrados')).toBeTruthy()
  })

  it('keeps the table mounted when a filter yields zero results (so filters stay reachable)', async () => {
    const { service, request } = setup({ value: withTotal([], 0) })
    request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'status', columnLabel: 'Estado', operator: 'eq', value: 'expiring' }]
    })

    await renderWith(service)

    // The full-replacement message would hide the toolbar, trapping the user with an unclearable filter.
    expect(screen.queryByText('No hay contratos registrados')).toBeNull()
    // The DataTable stays mounted (its own empty row + the Filtros control remain visible).
    expect(screen.getByText('Filtros')).toBeTruthy()
    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('keeps the table mounted when the resource clears its value during a page reload', async () => {
    const contracts = ContractMother.list(2)
    const value = signal<OffsetPaginatedOutput<ContractDto> | undefined>(withTotal(contracts, 28))
    const loading = signal(false)
    const service = {
      request: signal<ContractRequest>({ page: 1, pageSize: 10 }),
      contracts: { isLoading: loading, error: signal(undefined), value },
      create: vi.fn(),
      update: vi.fn(),
      resetRequest: vi.fn()
    } as unknown as ContractService
    const { fixture } = await renderWith(service)
    expect(screen.getByText(contracts[0].contractNumber ?? '')).toBeTruthy()

    value.set(undefined)
    loading.set(true)
    fixture.detectChanges()

    expect(screen.queryByText('Cargando contratos…')).toBeNull()
    expect(screen.getByText(contracts[0].contractNumber ?? '')).toBeTruthy()
  })

  it('only marks allowedOrders columns as sortable', async () => {
    const { service } = setup({ value: withTotal(ContractMother.list(1), 1) })
    const { fixture } = await renderWith(service)
    const sortableOf = (key: string) => fixture.componentInstance.columns.find(c => c.key === key)?.sortable

    // Not in CONTRACT_ALLOWED_ORDERS → not sortable (would 400 on the backend).
    expect(sortableOf('contractType')).toBe(false)
    expect(sortableOf('source')).toBe(false)
    expect(sortableOf('billingFrequency')).toBe(false)
    // In allowedOrders → sortable (undefined defaults to sortable in the DataTable).
    expect(sortableOf('contractNumber')).not.toBe(false)
    expect(sortableOf('status')).not.toBe(false)
  })

  it('maps every contract type to a badge, including mixed (spec 39)', async () => {
    const { service } = setup({ value: withTotal(ContractMother.list(1), 1) })
    const { fixture } = await renderWith(service)
    const badgeMap = fixture.componentInstance.columns.find(c => c.key === 'contractType')?.badgeMap

    expect(badgeMap?.['cloud']).toMatchObject({ label: 'Cloud' })
    expect(badgeMap?.['onprem']).toMatchObject({ label: 'On-premise' })
    expect(badgeMap?.['mixed']).toMatchObject({ label: 'Mixto' })
  })

  it('only marks allowlisted columns as filterable', async () => {
    const { service } = setup({ value: withTotal(ContractMother.list(1), 1) })
    const { fixture } = await renderWith(service)
    const filterableOf = (key: string) => fixture.componentInstance.columns.find(c => c.key === key)?.filterable

    // In CONTRACT allowed filters → opt-in filterable.
    expect(filterableOf('contractNumber')).toBe(true)
    expect(filterableOf('customerName')).toBe(true)
    expect(filterableOf('contractType')).toBe(true)
    expect(filterableOf('status')).toBe(true)
    expect(filterableOf('source')).toBe(true)
    // Not in the allowlist → not filterable (would 400 on the backend).
    expect(filterableOf('startDate')).not.toBe(true)
    expect(filterableOf('totalValue')).not.toBe(true)
    expect(filterableOf('billingFrequency')).not.toBe(true)
  })

  it('onFilters sets the filters and resets to page 1, keeping the active order', async () => {
    const { service, request } = setup({ value: withTotal(ContractMother.list(2), 28) })
    request.set({ page: 4, pageSize: 10, orders: [{ orderBy: 'contractNumber', orderType: 'asc' }] })
    const { fixture } = await renderWith(service)

    const filters = [{ column: 'status', columnLabel: 'Estado', operator: 'eq', value: 'active' }]
    fixture.componentInstance.onFilters(filters)

    expect(request().filters).toEqual(filters)
    expect(request().page).toBe(1)
    expect(request().orders).toEqual([{ orderBy: 'contractNumber', orderType: 'asc' }])
  })
})
