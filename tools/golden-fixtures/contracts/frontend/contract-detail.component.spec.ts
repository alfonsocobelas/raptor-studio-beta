import { HttpErrorResponse } from '@angular/common/http'
import { provideZonelessChangeDetection, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import {
  BillingFrequencyEnum,
  ContractDto,
  LicenseStatusEnum,
  LicenseWithConsumptionDto,
  RenewalTypeEnum
} from '@sap-licenses/shared/domain'
import { ContractMother } from '../../../../../../../tests/mothers/contract.mother'
import { LicenseMother } from '../../../../../../../tests/mothers/license.mother'
import { ContractDetailService } from '../../../../../../core/services/contract-detail.service'
import { ContractDetailComponent } from './contract-detail.component'

type Spy = ReturnType<typeof vi.fn>

interface ResourceState {
  isLoading?: boolean
  error?: Error | HttpErrorResponse
  licenses?: LicenseWithConsumptionDto[]
  licensesLoading?: boolean
  licensesError?: Error
}

const paginated = <T>(items: T[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 100,
  totalPages: 1
})

// Mock fiel a la semántica real de resource(): value() LANZA en estado de error;
// hasValue() devuelve false sin lanzar (ver BaseWritableResource en @angular/core).
const mockDetailService = (contract: ContractDto | undefined, state: ResourceState = {}) => {
  const value = signal(contract)
  return {
    contractId: { set: vi.fn() },
    contract: {
      value: () => {
        if (state.error) {
          throw new Error('Resource is currently in an error state')
        }
        return value()
      },
      hasValue: () => !state.error && value() !== undefined,
      isLoading: signal(state.isLoading ?? false),
      error: signal(state.error)
    },
    licenses: {
      value: signal(state.licenses ? paginated(state.licenses) : state.licensesLoading ? undefined : paginated([])),
      isLoading: signal(state.licensesLoading ?? false),
      error: signal(state.licensesError)
    }
  } as unknown as ContractDetailService
}

const renderDetail = (contract: ContractDto | undefined, navigate: Spy = vi.fn(), state: ResourceState = {}) =>
  render(ContractDetailComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: ContractDetailService, useValue: mockDetailService(contract, state) },
      { provide: Router, useValue: { navigate } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => contract?.id ?? '019eb713-19bb-7000-8000-000000000010' } } }
      }
    ]
  })

describe('ContractDetailComponent', () => {
  it('renders the header with contract number and customer name', async () => {
    const contract = ContractMother.one({ contractNumber: 'AVV-FER-2023-001', customerName: 'Ferrovial' })
    await renderDetail(contract)

    expect(screen.getByText('AVV-FER-2023-001')).toBeTruthy()
    expect(screen.getByText('Ferrovial')).toBeTruthy()
  })

  it('renders a Mixto badge for a mixed contract (spec 39: cloud + on-prem components)', async () => {
    const contract = ContractMother.one({ contractType: 'mixed' as ContractDto['contractType'] })
    await renderDetail(contract)

    expect(screen.getByText('Mixto')).toBeTruthy()
  })

  it('renders a Mantenimiento badge for a maintenance contract (spec 44)', async () => {
    const contract = ContractMother.one({ contractType: 'maintenance' as ContractDto['contractType'] })
    await renderDetail(contract)

    expect(screen.getByText('Mantenimiento')).toBeTruthy()
  })

  it('renders "—" for the contract number and start date when null (maintenance, spec 44)', async () => {
    const contract = ContractMother.one({
      contractType: 'maintenance' as ContractDto['contractType'],
      contractNumber: null,
      startDate: null
    })
    await renderDetail(contract)

    expect(screen.getByRole('heading', { level: 1 }).textContent?.trim()).toBe('—')
    // startDate null + separador estático: "— —" en la línea de vigencia
    expect(screen.getByText(/—\s*—/)).toBeTruthy()
  })

  it('renders the vigencia dates as dd-MM-yyyy (spec 40)', async () => {
    const contract = ContractMother.one({ startDate: '2024-01-01', endDate: '2028-01-31' })
    await renderDetail(contract)

    expect(screen.getByText(/01-01-2024/)).toBeTruthy()
    expect(screen.getByText(/31-01-2028/)).toBeTruthy()
  })

  it('renders the total value as "—" when it is null (contract without licenses, spec 40)', async () => {
    const contract = ContractMother.one({ totalValue: null })
    await renderDetail(contract)

    expect(screen.getByText(/—/)).toBeTruthy()
  })

  it('renders the SAP data fields', async () => {
    const contract = ContractMother.one({
      businessModel: 'Indirect Sales (Resell)',
      cmsCaseId: '3061954184',
      subSolutionAreas: ['Operate & Service']
    })
    await renderDetail(contract)

    expect(screen.getByText('Indirect Sales (Resell)')).toBeTruthy()
    expect(screen.getByText('3061954184')).toBeTruthy()
    expect(screen.getByText('Operate & Service')).toBeTruthy()
  })

  it('shows billing frequency and renewal type as Spanish labels, not raw enum values', async () => {
    const contract = ContractMother.one({
      billingFrequency: BillingFrequencyEnum.QUARTERLY,
      renewalType: RenewalTypeEnum.AUTO
    })
    await renderDetail(contract)

    expect(screen.getByText('Trimestral')).toBeTruthy()
    expect(screen.getByText('Automática')).toBeTruthy()
    expect(screen.queryByText('quarterly')).toBeNull()
    expect(screen.queryByText('auto')).toBeNull()
  })

  it('renders the semiannual billing frequency label (spec 45)', async () => {
    const contract = ContractMother.one({ billingFrequency: BillingFrequencyEnum.SEMIANNUAL })
    await renderDetail(contract)

    expect(screen.getByText('Semestral')).toBeTruthy()
    expect(screen.queryByText('semiannual')).toBeNull()
  })

  it('hides the notes section when there are no notes', async () => {
    await renderDetail(ContractMother.one({ notes: '' }))
    expect(screen.queryByText('Notas')).toBeNull()
  })

  it('shows the notes section when notes are present', async () => {
    await renderDetail(ContractMother.one({ notes: 'Renovación en negociación' }))
    expect(screen.getByText('Renovación en negociación')).toBeTruthy()
  })

  it('navigates to the customer detail when the customer link is clicked', async () => {
    const navigate = vi.fn()
    const contract = ContractMother.one({ customerId: '019eb713-19bb-7000-8000-0000000000aa' })
    const { fixture } = await renderDetail(contract, navigate)

    fixture.componentInstance.navigateToCustomer(contract.customerId)

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/customers', contract.customerId])
  })

  it('shows the not-found state when there is no contract', async () => {
    await renderDetail(undefined)
    expect(screen.getByText('Contrato no encontrado')).toBeTruthy()
  })

  it('shows the loading state while the contract resolves, not the not-found message', async () => {
    await renderDetail(undefined, vi.fn(), { isLoading: true })

    expect(screen.getByText('Cargando contrato…')).toBeTruthy()
    expect(screen.queryByText('Contrato no encontrado')).toBeNull()
  })

  it('shows the error state when the API fails, not the not-found message', async () => {
    await renderDetail(undefined, vi.fn(), { error: new Error('boom') })

    expect(screen.getByText('No se pudo cargar el contrato')).toBeTruthy()
    expect(screen.queryByText('Contrato no encontrado')).toBeNull()
  })

  it('renders the contract licenses in the licenses section', async () => {
    const license = LicenseMother.withConsumption({
      solutionName: 'SAP Signavio Process Insights',
      licensedUnits: 130,
      pricePerUnit: 250,
      status: LicenseStatusEnum.ACTIVE
    })
    await renderDetail(ContractMother.one(), vi.fn(), { licenses: [license] })

    expect(screen.getByText('Licencias del contrato')).toBeTruthy()
    expect(screen.getByText('SAP Signavio Process Insights')).toBeTruthy()
    expect(screen.getByText('FUE')).toBeTruthy()
    expect(screen.getByText('130')).toBeTruthy()
    expect(screen.getByText('250')).toBeTruthy()
    expect(screen.getByText('Activa')).toBeTruthy()
  })

  it('navigates to the license detail on the view action', async () => {
    const navigate = vi.fn()
    const license = LicenseMother.withConsumption({ id: 'license-1' })
    const { fixture } = await renderDetail(ContractMother.one(), navigate, { licenses: [license] })

    fixture.componentInstance.onLicenseAction({ action: 'view', row: { id: 'license-1' } })

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/licenses', 'license-1'])
  })

  it('shows a loading state in the licenses section while licenses load', async () => {
    await renderDetail(ContractMother.one(), vi.fn(), { licensesLoading: true })

    expect(screen.getByText('Cargando licencias…')).toBeTruthy()
  })

  it('shows an error state in the licenses section when the API fails', async () => {
    await renderDetail(ContractMother.one(), vi.fn(), { licensesError: new Error('boom') })

    expect(screen.getByText('No se pudieron cargar las licencias')).toBeTruthy()
  })

  it('shows the table empty state when the contract has no licenses', async () => {
    await renderDetail(ContractMother.one(), vi.fn(), { licenses: [] })

    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('shows the not-found state when the API responds 404', async () => {
    const notFound = new HttpErrorResponse({ status: 404, statusText: 'Not Found' })
    await renderDetail(undefined, vi.fn(), { error: notFound })

    expect(screen.getByText('Contrato no encontrado')).toBeTruthy()
    expect(screen.queryByText('No se pudo cargar el contrato')).toBeNull()
  })
})
