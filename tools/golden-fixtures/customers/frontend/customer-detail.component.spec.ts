import { HttpErrorResponse } from '@angular/common/http'
import { provideZonelessChangeDetection, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { beforeEach, vi } from 'vitest'
import { toast } from '@spartan-ng/brain/sonner'
import {
  ContractDto,
  CustomerDetailDto,
  CustomerSummaryDto,
  LicenseWithConsumptionDto,
  ProjectDto,
  ProjectImplementerEnum,
  ProjectStatusEnum
} from '@sap-licenses/shared/domain'
import { ContractMother } from '../../../../../../../tests/mothers/contract.mother'
import { LicenseMother } from '../../../../../../../tests/mothers/license.mother'
import { ProjectMother } from '../../../../../../../tests/mothers/project.mother'
import { AuthService } from '../../../../../../core/services/auth.service'
import { CustomerService } from '../../../../../../core/services/customer.service'
import { CustomerDetailService } from '../../../../../../core/services/customer-detail.service'
import { CustomerMother } from '../../../../../../../tests/mothers/customer.mother'
import { CustomerDetailComponent } from './customer-detail.component'
import { CustomerFormValue } from './customer-dialog.component'
import { ContactFormValue } from './contact-dialog.component'

vi.mock('@spartan-ng/brain/sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

const paginated = <T>(items: T[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 100,
  totalPages: 1
})

interface DetailState {
  customerLoading?: boolean
  customerError?: Error | HttpErrorResponse
  summary?: CustomerSummaryDto
  summaryLoading?: boolean
  summaryError?: unknown
  contracts?: ContractDto[]
  contractsLoading?: boolean
  contractsError?: unknown
  licenses?: LicenseWithConsumptionDto[]
  licensesLoading?: boolean
  licensesError?: unknown
  projects?: ProjectDto[]
  projectsLoading?: boolean
  projectsError?: unknown
}

// Mock fiel a la semántica real de resource(): value() LANZA en estado de error;
// hasValue() devuelve false sin lanzar (ver BaseWritableResource en @angular/core).
const mockDetailService = (customer: CustomerDetailDto | undefined, state: DetailState = {}) => {
  const customerValue = signal(customer)
  return {
    customerId: signal<string | undefined>(undefined),
    customer: {
      value: () => {
        if (state.customerError) {
          throw new Error('Resource is currently in an error state')
        }
        return customerValue()
      },
      hasValue: () => !state.customerError && customerValue() !== undefined,
      isLoading: signal(state.customerLoading ?? false),
      error: signal(state.customerError)
    },
    summary: {
      value: signal(state.summary),
      isLoading: signal(state.summaryLoading ?? false),
      error: signal(state.summaryError)
    },
    contracts: {
      value: signal(state.contracts ? paginated(state.contracts) : state.contractsLoading ? undefined : paginated([])),
      isLoading: signal(state.contractsLoading ?? false),
      error: signal(state.contractsError)
    },
    licenses: {
      value: signal(state.licenses ? paginated(state.licenses) : state.licensesLoading ? undefined : paginated([])),
      isLoading: signal(state.licensesLoading ?? false),
      error: signal(state.licensesError)
    },
    projects: {
      value: signal(state.projects ? paginated(state.projects) : state.projectsLoading ? undefined : paginated([])),
      isLoading: signal(state.projectsLoading ?? false),
      error: signal(state.projectsError)
    },
    addContact: vi.fn().mockResolvedValue(undefined),
    updateContact: vi.fn().mockResolvedValue(undefined),
    removeContact: vi.fn().mockResolvedValue(undefined)
  } as unknown as CustomerDetailService
}

const renderDetail = (
  customer: CustomerDetailDto | undefined,
  routeId = 'route-id',
  update = vi.fn(),
  state: DetailState = { summary: CustomerMother.summary() },
  canWrite = true
) => {
  const detailService = mockDetailService(customer, state)
  const navigate = vi.fn()
  return render(CustomerDetailComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: CustomerDetailService, useValue: detailService },
      { provide: CustomerService, useValue: { update } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
      { provide: Router, useValue: { navigate } },
      { provide: AuthService, useValue: { canWrite: signal(canWrite) } }
    ]
  }).then(r => ({ ...r, detailService, update, navigate }))
}

const formValueOf = (detail: CustomerDetailDto): CustomerFormValue => ({
  sapId: detail.sapId,
  name: detail.name,
  taxId: detail.taxId ?? '',
  industry: detail.industry ?? '',
  address: detail.address ?? '',
  phone: detail.phone ?? '',
  notes: detail.notes ?? '',
  customerType: detail.customerType ?? 'cloud'
})

describe('CustomerDetailComponent', () => {
  // El backend ya devuelve 403 a un viewer que intente escribir; esto evita ofrecerle acciones que
  // solo pueden acabar en error.
  it('hides the write actions from a viewer', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { summary: CustomerMother.summary() }, false)

    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /a\u00f1adir contacto/i })).toBeNull()
  })

  it('shows the write actions to a user who can write', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { summary: CustomerMother.summary() }, true)

    expect(screen.getByRole('button', { name: /editar/i })).toBeTruthy()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets the service customer id from the route param', async () => {
    const { detailService } = await renderDetail(CustomerMother.detail(), 'abc-123')

    expect(detailService.customerId()).toBe('abc-123')
  })

  it('renders the customer name and details in the header', async () => {
    const customer = CustomerMother.detail({
      name: 'Acme Corp',
      taxId: 'B12345678',
      industry: 'Technology',
      city: 'Barcelona',
      country: 'Spain'
    })
    await renderDetail(customer)

    expect(screen.getByText('Acme Corp')).toBeTruthy()
    expect(screen.getByText('B12345678')).toBeTruthy()
    expect(screen.getByText('Technology')).toBeTruthy()
    expect(screen.getByText('Barcelona')).toBeTruthy()
    expect(screen.getByText('Spain')).toBeTruthy()
  })

  it('shows the customer type badge in the header', async () => {
    await renderDetail(CustomerMother.detail({ customerType: 'onprem' }))

    expect(screen.getByText('On-prem')).toBeTruthy()
  })

  it('renders the edit button', async () => {
    await renderDetail(CustomerMother.detail())

    expect(screen.getByRole('button', { name: /editar/i })).toBeTruthy()
  })

  it('shows the archived badge only for an archived customer (spec 32)', async () => {
    await renderDetail(CustomerMother.detail({ name: 'Zombie Inc', status: 'archived' }))

    expect(screen.getByText('Archivado')).toBeTruthy()
  })

  it('does not show the archived badge for an active customer', async () => {
    await renderDetail(CustomerMother.detail({ name: 'Acme Corp', status: 'active' }))

    expect(screen.queryByText('Archivado')).toBeNull()
  })

  it('offers no delete affordance (customers are governed by the sync)', async () => {
    await renderDetail(CustomerMother.detail())

    expect(screen.queryByRole('button', { name: /eliminar/i })).toBeNull()
  })

  it('renders the six tabs', async () => {
    await renderDetail(CustomerMother.detail())

    for (const tab of ['Resumen', 'Contratos', 'Licencias', 'Proyectos', 'QBRs', 'Contactos']) {
      expect(screen.getByRole('tab', { name: tab })).toBeTruthy()
    }
  })

  it('shows a not-found state when the customer does not exist', async () => {
    await renderDetail(undefined)

    expect(screen.getByText('Cliente no encontrado')).toBeTruthy()
  })

  it('shows the loading state while the customer resolves, not the not-found message', async () => {
    await renderDetail(undefined, 'route-id', vi.fn(), { customerLoading: true })

    expect(screen.getByText('Cargando cliente…')).toBeTruthy()
    expect(screen.queryByText('Cliente no encontrado')).toBeNull()
  })

  it('shows the error state when the API fails, not the not-found message', async () => {
    await renderDetail(undefined, 'route-id', vi.fn(), { customerError: new Error('boom') })

    expect(screen.getByText('No se pudo cargar el cliente')).toBeTruthy()
    expect(screen.queryByText('Cliente no encontrado')).toBeNull()
  })

  it('shows the not-found state when the API responds 404', async () => {
    const notFound = new HttpErrorResponse({ status: 404, statusText: 'Not Found' })
    await renderDetail(undefined, 'route-id', vi.fn(), { customerError: notFound })

    expect(screen.getByText('Cliente no encontrado')).toBeTruthy()
    expect(screen.queryByText('No se pudo cargar el cliente')).toBeNull()
  })

  it('shows the four KPI cards in the summary tab', async () => {
    await renderDetail(CustomerMother.detail())

    expect(screen.getByText('Contratos activos')).toBeTruthy()
    expect(screen.getByText('Proyectos activos')).toBeTruthy()
    expect(screen.getByText('Alertas activas')).toBeTruthy()
  })

  it('shows the summary counts in the KPI cards', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), {
      summary: CustomerMother.summary({ activeContracts: 3, licenses: 12, activeProjects: 4 })
    })

    expect(within(screen.getByTestId('kpi-contratos-activos')).getByText('3')).toBeTruthy()
    expect(within(screen.getByTestId('kpi-licencias')).getByText('12')).toBeTruthy()
    expect(within(screen.getByTestId('kpi-proyectos-activos')).getByText('4')).toBeTruthy()
  })

  it('keeps the active alerts KPI at zero (no alerts module in v1)', async () => {
    await renderDetail(CustomerMother.detail())

    expect(within(screen.getByTestId('kpi-alertas-activas')).getByText('0')).toBeTruthy()
  })

  it('shows a loading placeholder in the KPIs while the summary loads', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { summaryLoading: true })

    expect(screen.getAllByText('…')).toHaveLength(3)
  })

  it('shows a fallback in the KPIs when the summary fails', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { summaryError: new Error('boom') })

    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('renders the customer contracts in the contracts tab', async () => {
    const contract = ContractMother.one({
      contractNumber: 'AVV-2024-042',
      startDate: '2024-02-01',
      endDate: '2027-01-31',
      totalValue: 1250000
    })
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { contracts: [contract] })
    const tab = within(screen.getByTestId('tab-contratos'))

    expect(tab.getByText('AVV-2024-042')).toBeTruthy()
    expect(tab.getByText('01-02-2024')).toBeTruthy()
    expect(tab.getByText('31-01-2027')).toBeTruthy()
    expect(tab.getByText('1.250.000 €')).toBeTruthy()
    expect(tab.getByText('Activo')).toBeTruthy()
    expect(tab.getByText('Avvale')).toBeTruthy()
  })

  it('navigates to the contract detail when a contract row is clicked', async () => {
    const contract = ContractMother.one({ id: 'contract-1' })
    const { navigate } = await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { contracts: [contract] })

    fireEvent.click(within(screen.getByTestId('tab-contratos')).getByText(contract.contractNumber ?? ''))

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/contracts', 'contract-1'])
  })

  it('shows a loading state in the contracts tab while contracts load', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { contractsLoading: true })

    expect(within(screen.getByTestId('tab-contratos')).getByText('Cargando contratos…')).toBeTruthy()
  })

  it('shows an error state in the contracts tab when the API fails', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { contractsError: new Error('boom') })

    expect(within(screen.getByTestId('tab-contratos')).getByText('No se pudieron cargar los contratos')).toBeTruthy()
  })

  it('shows the empty state in the contracts tab when there are none', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { contracts: [] })

    expect(within(screen.getByTestId('tab-contratos')).getByText('Sin contratos')).toBeTruthy()
  })

  it('renders the customer licenses in the licenses tab, health badge included', async () => {
    const license = LicenseMother.withConsumption({
      subSolutionAreaName: 'SAP Integration Suite',
      solutionName: 'SAP Integration Suite',
      licensedUnits: 100,
      currentUnits: 60,
      contractNumber: 'AVV-2024-042'
    })
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { licenses: [license] })
    const tab = within(screen.getByTestId('tab-licencias'))

    expect(tab.getByText('SAP Integration Suite')).toBeTruthy()
    expect(tab.getByText('FUE')).toBeTruthy()
    expect(tab.getByText('100')).toBeTruthy()
    expect(tab.getByText('60')).toBeTruthy()
    expect(tab.getByText('60.0%')).toBeTruthy()
    expect(tab.getByText('Saludable')).toBeTruthy()
    expect(tab.getByText('AVV-2024-042')).toBeTruthy()
  })

  it('colors the consumption percentage by threshold', async () => {
    const licenses = [
      LicenseMother.withConsumption({ id: 'l1', licensedUnits: 100, currentUnits: 25 }), // underused → yellow
      LicenseMother.withConsumption({ id: 'l2', licensedUnits: 100, currentUnits: 60 }), // healthy → green
      LicenseMother.withConsumption({ id: 'l3', licensedUnits: 100, currentUnits: 98 }), // overused → orange
      LicenseMother.withConsumption({ id: 'l4', licensedUnits: 100, currentUnits: 120 }) // breach → destructive
    ]
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { licenses })
    const tab = within(screen.getByTestId('tab-licencias'))

    expect(tab.getByText('25.0%').className).toContain('text-yellow-600')
    expect(tab.getByText('60.0%').className).toContain('text-green-600')
    expect(tab.getByText('98.0%').className).toContain('text-orange-600')
    expect(tab.getByText('120.0%').className).toContain('text-destructive')
  })

  it('navigates to the license detail when a license row is clicked', async () => {
    const license = LicenseMother.withConsumption({ id: 'license-1' })
    const { navigate } = await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { licenses: [license] })

    fireEvent.click(within(screen.getByTestId('tab-licencias')).getByText(license.solutionName))

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/licenses', 'license-1'])
  })

  it('shows a loading state in the licenses tab while licenses load', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { licensesLoading: true })

    expect(within(screen.getByTestId('tab-licencias')).getByText('Cargando licencias…')).toBeTruthy()
  })

  it('shows an error state in the licenses tab when the API fails', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { licensesError: new Error('boom') })

    expect(within(screen.getByTestId('tab-licencias')).getByText('No se pudieron cargar las licencias')).toBeTruthy()
  })

  it('shows the empty state in the licenses tab when there are none', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { licenses: [] })

    expect(within(screen.getByTestId('tab-licencias')).getByText('Sin licencias')).toBeTruthy()
  })

  it('renders the customer projects in the projects tab', async () => {
    const project = ProjectMother.one({
      name: 'S/4HANA Rollout',
      startDate: '2026-01-15',
      endDate: '2026-12-31',
      status: ProjectStatusEnum.PLANNING,
      implementer: ProjectImplementerEnum.AVVALE
    })
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { projects: [project] })
    const tab = within(screen.getByTestId('tab-proyectos'))

    expect(tab.getByText('S/4HANA Rollout')).toBeTruthy()
    expect(tab.getByText('15-01-2026')).toBeTruthy()
    expect(tab.getByText('31-12-2026')).toBeTruthy()
    expect(tab.getByText('Planificación')).toBeTruthy()
    expect(tab.getByText('AVVALE')).toBeTruthy()
  })

  it('renders the origin badge and a dash for a null startDate in the projects tab (spec 46)', async () => {
    const project = ProjectMother.one({
      name: 'Procurement (100001)',
      origin: 'ME_SAP' as ProjectDto['origin'],
      sapProjectId: '100001',
      startDate: null,
      endDate: null
    })
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { projects: [project] })
    const tab = within(screen.getByTestId('tab-proyectos'))

    expect(tab.getByText('SAP')).toBeTruthy()
    // inicio y fin null → guion
    expect(tab.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })

  it('does not navigate when a project row is clicked (no detail view in v1)', async () => {
    const project = ProjectMother.one({ name: 'S/4HANA Rollout' })
    const { navigate } = await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { projects: [project] })

    fireEvent.click(within(screen.getByTestId('tab-proyectos')).getByText('S/4HANA Rollout'))

    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows a loading state in the projects tab while projects load', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { projectsLoading: true })

    expect(within(screen.getByTestId('tab-proyectos')).getByText('Cargando proyectos…')).toBeTruthy()
  })

  it('shows an error state in the projects tab when the API fails', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { projectsError: new Error('boom') })

    expect(within(screen.getByTestId('tab-proyectos')).getByText('No se pudieron cargar los proyectos')).toBeTruthy()
  })

  it('shows the empty state in the projects tab when there are none', async () => {
    await renderDetail(CustomerMother.detail(), 'route-id', vi.fn(), { projects: [] })

    expect(within(screen.getByTestId('tab-proyectos')).getByText('Sin proyectos')).toBeTruthy()
  })

  it('lists primary contacts in the summary tab', async () => {
    const detail = CustomerMother.detail({
      contacts: [
        CustomerMother.contact({ id: 'c1', name: 'Alice Primary', email: 'alice@acme.com', isPrimary: true }),
        CustomerMother.contact({ id: 'c2', name: 'Bob Secondary', email: 'bob@acme.com', isPrimary: false })
      ]
    })
    await renderDetail(detail)
    const summary = within(screen.getByTestId('tab-resumen'))

    expect(summary.getByText('alice@acme.com')).toBeTruthy()
    expect(summary.queryByText('bob@acme.com')).toBeNull()
  })

  it('shows the empty message when there are no primary contacts', async () => {
    const detail = CustomerMother.detail({
      contacts: [CustomerMother.contact({ isPrimary: false })]
    })
    await renderDetail(detail)

    expect(within(screen.getByTestId('tab-resumen')).getByText('Sin contactos registrados')).toBeTruthy()
  })

  it('lists all contacts in the contacts tab', async () => {
    const detail = CustomerMother.detail({
      contacts: [
        CustomerMother.contact({ id: 'c1', name: 'Alice', role: 'CTO', email: 'alice@x.com', isPrimary: true }),
        CustomerMother.contact({ id: 'c2', name: 'Bob', role: 'CFO', email: 'bob@x.com', isPrimary: false })
      ]
    })
    await renderDetail(detail)
    const contactsTab = within(screen.getByTestId('tab-contactos'))

    expect(contactsTab.getByText('bob@x.com')).toBeTruthy()
    expect(contactsTab.getByText('CFO')).toBeTruthy()
  })

  it('marks primary contacts with a "Principal" badge in the contacts tab', async () => {
    const detail = CustomerMother.detail({
      contacts: [CustomerMother.contact({ id: 'c1', name: 'Alice', isPrimary: true })]
    })
    await renderDetail(detail)

    // Header column "Principal" + the badge → more than one occurrence.
    expect(within(screen.getByTestId('tab-contactos')).getAllByText('Principal').length).toBeGreaterThan(1)
  })

  it('shows the empty state in the contacts tab when there are no contacts', async () => {
    const detail = CustomerMother.detail({ contacts: [] })
    await renderDetail(detail)

    expect(within(screen.getByTestId('tab-contactos')).getByText('Sin contactos')).toBeTruthy()
  })

  describe('contacts management', () => {
    const contactFormValue = (overrides: Partial<ContactFormValue> = {}): ContactFormValue => ({
      name: 'Jane Doe',
      role: 'CTO',
      email: '',
      phone: '',
      isPrimary: true,
      ...overrides
    })

    it('shows an enabled "Añadir contacto" button in the contacts tab', async () => {
      await renderDetail(CustomerMother.detail({ contacts: CustomerMother.contacts(2) }))

      const button = within(screen.getByTestId('tab-contactos')).getByRole('button', {
        name: /Añadir contacto/,
        hidden: true
      }) as HTMLButtonElement
      expect(button.disabled).toBe(false)
    })

    it('disables the "Añadir contacto" button when there are 20 contacts', async () => {
      await renderDetail(CustomerMother.detail({ contacts: CustomerMother.contacts(20) }))

      const button = within(screen.getByTestId('tab-contactos')).getByRole('button', {
        name: /Añadir contacto/,
        hidden: true
      }) as HTMLButtonElement
      expect(button.disabled).toBe(true)
    })

    it('renders per-row edit and delete actions', async () => {
      await renderDetail(CustomerMother.detail({ contacts: [CustomerMother.contact({ id: 'c1' })] }))
      const tab = within(screen.getByTestId('tab-contactos'))

      expect(tab.getByRole('button', { name: 'Editar contacto', hidden: true })).toBeTruthy()
      expect(tab.getByRole('button', { name: 'Eliminar contacto', hidden: true })).toBeTruthy()
    })

    it('shows only the empty-state CTA when there are no contacts, hiding the header button (spec 47)', async () => {
      await renderDetail(CustomerMother.detail({ contacts: [] }))

      const addButtons = within(screen.getByTestId('tab-contactos')).getAllByRole('button', {
        name: /Añadir contacto/,
        hidden: true
      })
      expect(addButtons.length).toBe(1)
    })

    it('shows only the header button when there is at least one contact (spec 47)', async () => {
      await renderDetail(CustomerMother.detail({ contacts: CustomerMother.contacts(1) }))

      const addButtons = within(screen.getByTestId('tab-contactos')).getAllByRole('button', {
        name: /Añadir contacto/,
        hidden: true
      })
      expect(addButtons.length).toBe(1)
    })

    it('openAddContact opens the dialog in add mode (no editing contact)', async () => {
      const { fixture } = await renderDetail(CustomerMother.detail())
      const cmp = fixture.componentInstance

      cmp.openAddContact()

      expect(cmp.contactDialogOpen()).toBe(true)
      expect(cmp.editingContact()).toBeNull()
    })

    it('openEditContact opens the dialog with the selected contact', async () => {
      const contact = CustomerMother.contact({ id: 'c1', name: 'Alice' })
      const { fixture } = await renderDetail(CustomerMother.detail({ contacts: [contact] }))
      const cmp = fixture.componentInstance

      cmp.openEditContact(contact)

      expect(cmp.contactDialogOpen()).toBe(true)
      expect(cmp.editingContact()).toEqual(contact)
    })

    it('onContactSaved in add mode generates an id and calls addContact', async () => {
      const detail = CustomerMother.detail({ id: 'cust-1' })
      const { fixture, detailService } = await renderDetail(detail, 'cust-1')
      const cmp = fixture.componentInstance

      cmp.openAddContact()
      await cmp.onContactSaved(contactFormValue({ name: 'New Guy', role: 'CTO' }))

      expect(vi.mocked(detailService.addContact)).toHaveBeenCalledWith(
        'cust-1',
        expect.objectContaining({ id: expect.any(String), name: 'New Guy', role: 'CTO', isPrimary: true })
      )
      expect(cmp.contactDialogOpen()).toBe(false)
      expect(toast.success).toHaveBeenCalled()
    })

    it('onContactSaved in edit mode calls updateContact with the contact id', async () => {
      const contact = CustomerMother.contact({ id: 'c1', name: 'Alice' })
      const detail = CustomerMother.detail({ id: 'cust-1', contacts: [contact] })
      const { fixture, detailService } = await renderDetail(detail, 'cust-1')
      const cmp = fixture.componentInstance

      cmp.openEditContact(contact)
      await cmp.onContactSaved(contactFormValue({ name: 'Alice Renamed' }))

      expect(vi.mocked(detailService.updateContact)).toHaveBeenCalledWith(
        'cust-1',
        'c1',
        expect.objectContaining({ name: 'Alice Renamed' })
      )
    })

    it('shows an error toast when saving a contact fails', async () => {
      const detail = CustomerMother.detail({ id: 'cust-1' })
      const { fixture, detailService } = await renderDetail(detail, 'cust-1')
      vi.mocked(detailService.addContact).mockRejectedValue(new Error('boom'))
      const cmp = fixture.componentInstance

      cmp.openAddContact()
      await cmp.onContactSaved(contactFormValue())

      expect(toast.error).toHaveBeenCalled()
    })

    it('requestDeleteContact stages the contact and confirmDeleteContact removes it', async () => {
      const contact = CustomerMother.contact({ id: 'c1' })
      const detail = CustomerMother.detail({ id: 'cust-1', contacts: [contact] })
      const { fixture, detailService } = await renderDetail(detail, 'cust-1')
      const cmp = fixture.componentInstance

      cmp.requestDeleteContact(contact)
      expect(cmp.pendingDelete()).toEqual(contact)

      await cmp.confirmDeleteContact()

      expect(vi.mocked(detailService.removeContact)).toHaveBeenCalledWith('cust-1', 'c1')
      expect(cmp.pendingDelete()).toBeNull()
      expect(toast.success).toHaveBeenCalled()
    })

    it('shows an error toast when deleting a contact fails', async () => {
      const contact = CustomerMother.contact({ id: 'c1' })
      const detail = CustomerMother.detail({ id: 'cust-1', contacts: [contact] })
      const { fixture, detailService } = await renderDetail(detail, 'cust-1')
      vi.mocked(detailService.removeContact).mockRejectedValue(new Error('boom'))
      const cmp = fixture.componentInstance

      cmp.requestDeleteContact(contact)
      await cmp.confirmDeleteContact()

      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('openEdit opens the edit dialog', async () => {
    const { fixture } = await renderDetail(CustomerMother.detail())
    const cmp = fixture.componentInstance

    cmp.openEdit()

    expect(cmp.dialogOpen()).toBe(true)
  })

  it('onSave updates the current customer and closes the dialog', async () => {
    const update = vi.fn()
    const detail = CustomerMother.detail({ id: 'cust-1' })
    const { fixture } = await renderDetail(detail, 'cust-1', update)
    const cmp = fixture.componentInstance

    const value: CustomerFormValue = {
      sapId: detail.sapId,
      name: 'Renamed',
      taxId: detail.taxId ?? '',
      industry: detail.industry ?? '',
      address: detail.address ?? '',
      phone: detail.phone ?? '',
      notes: detail.notes ?? '',
      customerType: detail.customerType ?? 'cloud'
    }
    cmp.openEdit()
    cmp.onSave(value)

    expect(update).toHaveBeenCalledWith('cust-1', value)
    expect(cmp.dialogOpen()).toBe(false)
  })

  it('shows a success toast after updating the customer', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const detail = CustomerMother.detail({ id: 'cust-1' })
    const { fixture } = await renderDetail(detail, 'cust-1', update)
    const cmp = fixture.componentInstance

    cmp.openEdit()
    await cmp.onSave(formValueOf(detail))

    expect(toast.success).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })

  it('shows an error toast when updating the customer fails', async () => {
    const update = vi.fn().mockRejectedValue(new Error('boom'))
    const detail = CustomerMother.detail({ id: 'cust-1' })
    const { fixture } = await renderDetail(detail, 'cust-1', update)
    const cmp = fixture.componentInstance

    cmp.openEdit()
    await cmp.onSave(formValueOf(detail))

    expect(toast.error).toHaveBeenCalledWith('No se pudo actualizar el cliente')
  })
})
