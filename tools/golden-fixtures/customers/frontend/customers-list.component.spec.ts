import { provideZonelessChangeDetection, signal } from '@angular/core'
import { Router } from '@angular/router'
import { render, screen } from '@testing-library/angular'
import { beforeEach, vi } from 'vitest'
import { toast } from '@spartan-ng/brain/sonner'
import {
  CustomerRequest,
  CustomerService,
  OffsetPaginatedOutput
} from '../../../../../../core/services/customer.service'
import { CustomerDto } from '@sap-licenses/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { CustomerMother } from '../../../../../../../tests/mothers/customer.mother'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { CustomersListComponent } from './customers-list.component'
import { CustomerFormValue } from './customer-dialog.component'

vi.mock('@spartan-ng/brain/sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

vi.mock('../../../../../../shared/utils/download-file', () => ({ downloadBlob: vi.fn() }))

interface MockState {
  loading?: boolean
  error?: unknown
  value?: OffsetPaginatedOutput<CustomerDto>
  archivedCount?: number
}

const paginated = (items: CustomerDto[]): OffsetPaginatedOutput<CustomerDto> => ({
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  items
})

type Spy = ReturnType<typeof vi.fn>

const mockService = (
  state: MockState,
  spies: { create?: Spy; update?: Spy; export?: Spy; resetRequest?: Spy } = {},
  request = signal<CustomerRequest>({ page: 1, pageSize: 20 })
) =>
  ({
    request,
    resetRequest: spies.resetRequest ?? vi.fn(),
    customers: {
      isLoading: signal(state.loading ?? false),
      error: signal(state.error),
      value: signal(state.value)
    },
    archivedCount: signal(state.archivedCount ?? 0),
    create: spies.create ?? vi.fn(),
    update: spies.update ?? vi.fn(),
    export: spies.export ?? vi.fn().mockResolvedValue({ blob: new Blob(['x']), filename: 'clientes-20260707.csv' })
  }) as unknown as CustomerService

interface RenderOpts {
  navigate?: Spy
  create?: Spy
  update?: Spy
  export?: Spy
  resetRequest?: Spy
  request?: ReturnType<typeof signal<CustomerRequest>>
  previousUrl?: string
  canWrite?: boolean
}

const routerMock = (navigate: Spy, previousUrl?: string) => ({
  navigate,
  getCurrentNavigation: () =>
    previousUrl ? { previousNavigation: { finalUrl: { toString: () => previousUrl } } } : null
})

const renderList = (state: MockState, opts: RenderOpts = {}) =>
  render(CustomersListComponent, {
    providers: [
      provideZonelessChangeDetection(),
      {
        provide: CustomerService,
        useValue: mockService(
          state,
          { create: opts.create, update: opts.update, export: opts.export, resetRequest: opts.resetRequest },
          opts.request ?? signal<CustomerRequest>({ page: 1, pageSize: 20 })
        )
      },
      { provide: Router, useValue: routerMock(opts.navigate ?? vi.fn(), opts.previousUrl) },
      { provide: AuthService, useValue: { canWrite: signal(opts.canWrite ?? true) } }
    ]
  })

const formValue = (overrides: Partial<CustomerFormValue> = {}): CustomerFormValue => ({
  sapId: '1799999',
  name: 'Globex SA',
  taxId: 'B99999999',
  industry: 'Tech',
  address: 'Calle 1',
  phone: '+34999',
  notes: '',
  customerType: 'cloud',
  ...overrides
})

describe('CustomersListComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // El backend ya devuelve 403 a un viewer que intente escribir; esto evita ofrecerle acciones que
  // solo pueden acabar en error.
  it('hides the write actions from a viewer', async () => {
    await renderList({ value: paginated([CustomerMother.one()]) }, { canWrite: false })

    expect(screen.queryByRole('button', { name: /nuevo cliente/i })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Ver ficha' })).toBeTruthy()
  })

  it('shows the write actions to a user who can write', async () => {
    await renderList({ value: paginated([CustomerMother.one()]) }, { canWrite: true })

    expect(screen.getByRole('button', { name: /nuevo cliente/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
  })

  it('resets the service request on init when entering from outside the section', async () => {
    const resetRequest = vi.fn()
    await renderList(
      { value: paginated([CustomerMother.one()]) },
      { resetRequest, previousUrl: '/sap-licensing/contracts' }
    )
    expect(resetRequest).toHaveBeenCalledTimes(1)
  })

  it('keeps the service request when returning from a customer detail', async () => {
    const resetRequest = vi.fn()
    await renderList(
      { value: paginated([CustomerMother.one()]) },
      { resetRequest, previousUrl: '/sap-licensing/customers/0197f8a2-1111-7000-8000-000000000001' }
    )
    expect(resetRequest).not.toHaveBeenCalled()
  })

  it('exports from the backend and downloads the returned file', async () => {
    const exportSpy = vi.fn().mockResolvedValue({ blob: new Blob(['x']), filename: 'clientes-20260707.csv' })
    const { fixture } = await renderList({ value: paginated(CustomerMother.list(1)) }, { export: exportSpy })

    await fixture.componentInstance.onExport('csv')

    expect(exportSpy).toHaveBeenCalledWith('csv')
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'clientes-20260707.csv')
  })

  it('always shows the page heading', async () => {
    await renderList({ value: paginated(CustomerMother.list(1)) })

    expect(screen.getByText('Clientes')).toBeTruthy()
  })

  it('shows the loading state while fetching', async () => {
    await renderList({ loading: true })

    expect(screen.getByText('Cargando clientes…')).toBeTruthy()
  })

  it('shows the error state when the request fails', async () => {
    await renderList({ error: new Error('boom') })

    expect(screen.getByText('No se pudieron cargar los clientes')).toBeTruthy()
  })

  it('shows the empty state when there are no customers', async () => {
    await renderList({ value: paginated([]) })

    expect(screen.getByText('No hay clientes registrados')).toBeTruthy()
  })

  it('shows the data table with customers when data is available', async () => {
    const customers = CustomerMother.list(2)
    await renderList({ value: paginated(customers) })

    expect(screen.getByText(customers[0].name)).toBeTruthy()
    expect(screen.getByText(customers[1].name)).toBeTruthy()
  })

  it('shows the Tipo column with the SAP customerType badge', async () => {
    const customers = [CustomerMother.one({ customerType: 'hybrid' })]
    await renderList({ value: paginated(customers) })

    expect(screen.getByText('Tipo')).toBeTruthy()
    expect(screen.getByText('Hybrid')).toBeTruthy()
  })

  it('navigates to the customer detail on the "view" action', async () => {
    const navigate = vi.fn()
    const customer = CustomerMother.one()
    const { fixture } = await renderList({ value: paginated([customer]) }, { navigate })

    fixture.componentInstance.onAction({ action: 'view', row: customer as unknown as Record<string, unknown> })

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/customers', customer.id])
  })

  it('openCreate opens the dialog in create mode', async () => {
    const { fixture } = await renderList({ value: paginated([]) })
    const cmp = fixture.componentInstance

    cmp.openCreate()

    expect(cmp.dialogOpen()).toBe(true)
    expect(cmp.editingCustomer()).toBeNull()
  })

  it('the "edit" action opens the dialog with the selected customer', async () => {
    const customer = CustomerMother.one()
    const { fixture } = await renderList({ value: paginated([customer]) })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: customer as unknown as Record<string, unknown> })

    expect(cmp.dialogOpen()).toBe(true)
    expect(cmp.editingCustomer()).toEqual(customer)
  })

  it('onSave creates a new customer with a generated id', async () => {
    const create = vi.fn()
    const { fixture } = await renderList({ value: paginated([]) }, { create })
    const cmp = fixture.componentInstance

    cmp.openCreate()
    cmp.onSave(formValue({ sapId: '1788888', name: 'New Co' }))

    expect(create).toHaveBeenCalledTimes(1)
    const dto = create.mock.calls[0][0]
    expect(dto).toMatchObject({ sapId: '1788888', name: 'New Co' })
    expect(typeof dto.id).toBe('string')
    expect(dto.id.length).toBeGreaterThan(0)
    expect(cmp.dialogOpen()).toBe(false)
  })

  it('onSave updates the existing customer in edit mode', async () => {
    const update = vi.fn()
    const customer = CustomerMother.one()
    const { fixture } = await renderList({ value: paginated([customer]) }, { update })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: customer as unknown as Record<string, unknown> })
    cmp.onSave(formValue({ name: 'Renamed' }))

    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0][0]).toBe(customer.id)
    expect(update.mock.calls[0][1]).toMatchObject({ name: 'Renamed' })
    expect(cmp.dialogOpen()).toBe(false)
  })

  it('offers no delete action (customers are governed by the sync, spec 32)', async () => {
    const { fixture } = await renderList({ value: paginated([CustomerMother.one()]) })

    expect(fixture.componentInstance.actions().some(a => a.action === 'delete')).toBe(false)
  })

  it('renders the lifecycle status as a badge column', async () => {
    const archived = CustomerMother.one({ status: 'archived', name: 'Zombie Inc' })
    await renderList({ value: paginated([archived]) })

    expect(screen.getByText('Archivado')).toBeTruthy()
  })

  it('onToggleArchived sets includeArchived on the request and resets to page 1', async () => {
    const request = signal<CustomerRequest>({ page: 4, pageSize: 20 })
    const { fixture } = await renderList({ value: paginated([CustomerMother.one()]) }, { request })

    fixture.componentInstance.onToggleArchived(true)

    expect(request().includeArchived).toBe(true)
    expect(request().page).toBe(1)
  })

  it('reflects includeArchived from the request in the toggle state', async () => {
    const request = signal<CustomerRequest>({ page: 1, pageSize: 20, includeArchived: true })
    const { fixture } = await renderList({ value: paginated([CustomerMother.one()]) }, { request })

    expect(fixture.componentInstance.includeArchived()).toBe(true)
  })

  it('shows the archived count next to the toggle label', async () => {
    await renderList({ value: paginated([CustomerMother.one()]), archivedCount: 5 })

    expect(screen.getByText('Incluir archivados (5)')).toBeTruthy()
  })

  it('keeps the table (and the toggle) mounted when all customers are archived', async () => {
    // Con el toggle dentro de la toolbar de la tabla, el estado vacío no puede tragarse
    // la tabla si hay archivados: dejaría el toggle inalcanzable y los datos ocultos.
    await renderList({ value: paginated([]), archivedCount: 3 })

    expect(screen.queryByText('No hay clientes registrados')).toBeNull()
    expect(screen.getByRole('switch')).toBeTruthy()
    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('disables the toggle when there are no archived customers', async () => {
    await renderList({ value: paginated([CustomerMother.one()]), archivedCount: 0 })

    const toggle = screen.getByRole('switch') as HTMLButtonElement
    expect(toggle.disabled).toBe(true)
  })

  it('enables the toggle when there are archived customers', async () => {
    await renderList({ value: paginated([CustomerMother.one()]), archivedCount: 2 })

    const toggle = screen.getByRole('switch') as HTMLButtonElement
    expect(toggle.disabled).toBe(false)
  })

  it('shows a success toast after creating a customer', async () => {
    const create = vi.fn().mockResolvedValue(undefined)
    const { fixture } = await renderList({ value: paginated([]) }, { create })
    const cmp = fixture.componentInstance

    cmp.openCreate()
    await cmp.onSave(formValue())

    expect(toast.success).toHaveBeenCalledWith('Cliente creado correctamente')
  })

  it('shows a success toast after updating a customer', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const customer = CustomerMother.one()
    const { fixture } = await renderList({ value: paginated([customer]) }, { update })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: customer as unknown as Record<string, unknown> })
    await cmp.onSave(formValue({ name: 'Renamed' }))

    expect(toast.success).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })

  it('shows an error toast when creating a customer fails', async () => {
    const create = vi.fn().mockRejectedValue(new Error('boom'))
    const { fixture } = await renderList({ value: paginated([]) }, { create })
    const cmp = fixture.componentInstance

    cmp.openCreate()
    await cmp.onSave(formValue())

    expect(toast.error).toHaveBeenCalledWith('No se pudo crear el cliente')
  })
})

describe('CustomersListComponent — server-side pagination', () => {
  const withTotal = (items: CustomerDto[], total: number): OffsetPaginatedOutput<CustomerDto> => ({
    total,
    page: 1,
    pageSize: 10,
    totalPages: Math.max(1, Math.ceil(total / 10)),
    items
  })

  const setup = (state: MockState) => {
    const request = signal<CustomerRequest>({ page: 1, pageSize: 10 })
    const service = {
      request,
      customers: {
        isLoading: signal(state.loading ?? false),
        error: signal(state.error),
        value: signal(state.value)
      },
      archivedCount: signal(state.archivedCount ?? 0),
      create: vi.fn(),
      update: vi.fn(),
      resetRequest: vi.fn()
    } as unknown as CustomerService
    return { service, request }
  }

  const renderWith = (service: CustomerService) =>
    render(CustomersListComponent, {
      providers: [
        provideZonelessChangeDetection(),
        { provide: CustomerService, useValue: service },
        { provide: Router, useValue: routerMock(vi.fn()) }
      ]
    })

  it('shows the API total in the footer, not the number of loaded rows', async () => {
    const { service } = setup({ value: withTotal(CustomerMother.list(2), 28) })

    await renderWith(service)

    expect(screen.getByText(/de 28 registros/)).toBeTruthy()
  })

  it('onPage updates the request page', async () => {
    const { service, request } = setup({ value: withTotal(CustomerMother.list(2), 28) })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onPage(3)

    expect(request().page).toBe(3)
  })

  it('onSearch sets the term (undefined when cleared) and resets to page 1', async () => {
    const { service, request } = setup({ value: withTotal(CustomerMother.list(2), 28) })
    request.set({ page: 4, pageSize: 10 })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onSearch('acme')
    expect(request().search).toBe('acme')
    expect(request().page).toBe(1)

    fixture.componentInstance.onSearch('')
    expect(request().search).toBeUndefined()
  })

  it('keeps the table mounted when a search yields zero results', async () => {
    const { service, request } = setup({ value: withTotal([], 0) })
    request.set({ page: 1, pageSize: 10, search: 'zzz' })

    await renderWith(service)

    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('onPageSize updates the page size and resets to page 1', async () => {
    const { service, request } = setup({ value: withTotal(CustomerMother.list(2), 28) })
    request.set({ page: 3, pageSize: 10 })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onPageSize(25)

    expect(request().pageSize).toBe(25)
    expect(request().page).toBe(1)
  })

  it('onSort sets orders and resets to page 1; null clears orders', async () => {
    const { service, request } = setup({ value: withTotal(CustomerMother.list(2), 28) })
    request.set({ page: 4, pageSize: 10 })
    const { fixture } = await renderWith(service)

    fixture.componentInstance.onSort({ orderBy: 'name', orderType: 'asc' })
    expect(request().orders).toEqual([{ orderBy: 'name', orderType: 'asc' }])
    expect(request().page).toBe(1)

    fixture.componentInstance.onSort(null)
    expect(request().orders).toBeUndefined()
  })

  it('shows the empty state when the total is zero', async () => {
    const { service } = setup({ value: withTotal([], 0) })

    await renderWith(service)

    expect(screen.getByText('No hay clientes registrados')).toBeTruthy()
  })

  it('only marks allowlisted columns as filterable', async () => {
    const { service } = setup({ value: withTotal(CustomerMother.list(1), 1) })
    const { fixture } = await renderWith(service)
    const filterableOf = (key: string) => fixture.componentInstance.columns.find(c => c.key === key)?.filterable

    // In CUSTOMER allowed filters → opt-in filterable.
    expect(filterableOf('name')).toBe(true)
    expect(filterableOf('industry')).toBe(true)
    expect(filterableOf('taxId')).toBe(true)
    // Not in the allowlist → not filterable (would 400 on the backend).
    expect(filterableOf('address')).not.toBe(true)
    expect(filterableOf('phone')).not.toBe(true)
  })

  it('onFilters sets the filters and resets to page 1, keeping the active order', async () => {
    const { service, request } = setup({ value: withTotal(CustomerMother.list(2), 28) })
    request.set({ page: 4, pageSize: 10, orders: [{ orderBy: 'name', orderType: 'asc' }] })
    const { fixture } = await renderWith(service)

    const filters = [{ column: 'name', columnLabel: 'Nombre', operator: 'starts_with', value: 'Ac' }]
    fixture.componentInstance.onFilters(filters)

    expect(request().filters).toEqual(filters)
    expect(request().page).toBe(1)
    expect(request().orders).toEqual([{ orderBy: 'name', orderType: 'asc' }])
  })

  it('keeps the table mounted when a filter yields zero results (so filters stay reachable)', async () => {
    const { service, request } = setup({ value: withTotal([], 0) })
    request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'industry', columnLabel: 'Industria', operator: 'eq', value: 'Retail' }]
    })

    await renderWith(service)

    // The full-replacement message would hide the toolbar, trapping the user with an unclearable filter.
    expect(screen.queryByText('No hay clientes registrados')).toBeNull()
    expect(screen.getByText('Filtros')).toBeTruthy()
    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('keeps the table mounted while reloading if previous data is present', async () => {
    const customers = CustomerMother.list(2)
    const { service } = setup({ loading: true, value: withTotal(customers, 28) })

    await renderWith(service)

    // Reloading a page must not swap the table for the full-screen "Cargando…".
    expect(screen.queryByText('Cargando clientes…')).toBeNull()
    expect(screen.getByText(customers[0].name)).toBeTruthy()
  })

  it('shows the full loading state only on the first load (no value yet)', async () => {
    const { service } = setup({ loading: true })

    await renderWith(service)

    expect(screen.getByText('Cargando clientes…')).toBeTruthy()
  })

  it('only marks allowedOrders columns as sortable', async () => {
    const { service } = setup({ value: withTotal(CustomerMother.list(1), 1) })
    const { fixture } = await renderWith(service)
    const sortableOf = (key: string) => fixture.componentInstance.columns.find(c => c.key === key)?.sortable

    // Not in CUSTOMER_ALLOWED_ORDERS → not sortable (would 400 on the backend).
    expect(sortableOf('address')).toBe(false)
    expect(sortableOf('phone')).toBe(false)
    // In allowedOrders → sortable (undefined defaults to sortable in the DataTable).
    expect(sortableOf('name')).not.toBe(false)
    expect(sortableOf('taxId')).not.toBe(false)
    expect(sortableOf('industry')).not.toBe(false)
    expect(sortableOf('city')).not.toBe(false)
    expect(sortableOf('country')).not.toBe(false)
    // customerType joined CUSTOMER_ALLOWED_ORDERS (spec 43, TASK-12): now sortable.
    expect(sortableOf('customerType')).not.toBe(false)
  })

  it('renders the city and country columns', async () => {
    const customer = CustomerMother.one({ city: 'Barcelona', country: 'Spain' })
    const { service } = setup({ value: withTotal([customer], 1) })

    await renderWith(service)

    expect(screen.getByText('Barcelona')).toBeTruthy()
    expect(screen.getByText('Spain')).toBeTruthy()
  })

  it('keeps the table mounted when the resource clears its value during a page reload', async () => {
    const customers = CustomerMother.list(2)
    const value = signal<OffsetPaginatedOutput<CustomerDto> | undefined>(withTotal(customers, 28))
    const loading = signal(false)
    const service = {
      request: signal<CustomerRequest>({ page: 1, pageSize: 10 }),
      customers: { isLoading: loading, error: signal(undefined), value },
      archivedCount: signal(0),
      create: vi.fn(),
      update: vi.fn(),
      resetRequest: vi.fn()
    } as unknown as CustomerService
    const { fixture } = await renderWith(service)
    expect(screen.getByText(customers[0].name)).toBeTruthy()

    // A page change makes resource() clear value() while loading — the table must NOT
    // be swapped for the full-screen loading text, or its internal currentPage resets.
    value.set(undefined)
    loading.set(true)
    fixture.detectChanges()

    expect(screen.queryByText('Cargando clientes…')).toBeNull()
    expect(screen.getByText(customers[0].name)).toBeTruthy()
  })
})
