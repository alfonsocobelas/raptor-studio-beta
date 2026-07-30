import { HttpErrorResponse } from '@angular/common/http'
import { provideZonelessChangeDetection, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { fireEvent, render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { toast } from '@spartan-ng/brain/sonner'
import { LicenseDetailDto } from '@sap-licenses/shared/domain'
import { LicenseMother } from '../../../../../../../tests/mothers/license.mother'
import { LicenseDetailService } from '../../../../../../core/services/license-detail.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { LicenseDetailComponent } from './license-detail.component'

vi.mock('@spartan-ng/brain/sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

type Spy = ReturnType<typeof vi.fn>

interface DetailOpts {
  navigate?: Spy
  addConsumption?: Spy
  canWrite?: boolean
}

const mockDetailService = (license: LicenseDetailDto | undefined, opts: DetailOpts = {}) =>
  ({
    licenseId: { set: vi.fn() },
    license: { value: signal(license), reload: vi.fn() },
    addConsumption: opts.addConsumption ?? vi.fn().mockResolvedValue(undefined)
  }) as unknown as LicenseDetailService

const renderDetail = (license: LicenseDetailDto | undefined, opts: DetailOpts = {}) =>
  render(LicenseDetailComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: LicenseDetailService, useValue: mockDetailService(license, opts) },
      { provide: Router, useValue: { navigate: opts.navigate ?? vi.fn() } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => license?.id ?? '019eb713-19bb-7000-8000-000000000030' } } }
      },
      { provide: AuthService, useValue: { canWrite: signal(opts.canWrite ?? true) } }
    ]
  })

describe('LicenseDetailComponent', () => {
  beforeEach(() => vi.clearAllMocks())

  // Registrar consumo es la única escritura de la pantalla; el backend la rechaza con 403 para un
  // viewer, así que no se le ofrece el formulario.
  it('hides the manual consumption form from a viewer', async () => {
    await renderDetail(LicenseMother.detail(), { canWrite: false })

    expect(screen.queryByText('Registrar consumo manual')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar' })).toBeNull()
  })

  it('shows the manual consumption form to a user who can write', async () => {
    await renderDetail(LicenseMother.detail())

    expect(screen.getByText('Registrar consumo manual')).toBeTruthy()
  })

  it('renders the header with solution, customer and contract link', async () => {
    const license = LicenseMother.detail({ subSolutionAreaName: 'SAP Integration Suite', customerName: 'Ferrovial' })
    await renderDetail(license)

    expect(screen.getByRole('heading', { level: 1, name: 'SAP Integration Suite' })).toBeTruthy()
    expect(screen.getByText(/Ferrovial/)).toBeTruthy()
    expect(screen.getByText(/Contrato AVV-FER-2023-001/)).toBeTruthy()
  })

  it('renders the 3 KPI values', async () => {
    const license = LicenseMother.detail({ licensedUnits: 200, currentUnits: 50 })
    await renderDetail(license)

    expect(screen.getByText('200')).toBeTruthy()
    expect(screen.getByText(/\(25\.0%\)/)).toBeTruthy()
    expect(screen.getByText('Infrautilizada')).toBeTruthy()
  })

  it('renders the consumption history rows', async () => {
    const license = LicenseMother.detail({
      consumption: [
        LicenseMother.consumption({ id: 'r1', periodYear: 2026, periodMonth: 1, units: 55 }),
        LicenseMother.consumption({ id: 'r2', periodYear: 2026, periodMonth: 2, units: 60 })
      ]
    })
    await renderDetail(license)

    expect(screen.getByText('2026-02')).toBeTruthy()
    expect(screen.getByText('2026-01')).toBeTruthy()
  })

  it('orders the history by most recent period and caps at 6 months', async () => {
    const records = Array.from({ length: 7 }, (_, i) =>
      LicenseMother.consumption({ id: `r${i}`, periodYear: 2026, periodMonth: i + 1, units: (i + 1) * 10 })
    )
    const license = LicenseMother.detail({ consumption: records })
    const { fixture } = await renderDetail(license)
    const history = fixture.componentInstance.history()

    expect(history).toHaveLength(6)
    expect(history[0].periodMonth).toBe(7)
    expect(history.some(r => r.periodMonth === 1)).toBe(false)
  })

  describe('history progress derives from the snapshot, never from a local unclamped ratio', () => {
    it('matches the card percentage on the row whose units equal the snapshot', async () => {
      // snapshot: 2.016.349 / techo implícito 2.000.000 → 100.8% (caso RBA, spec 48)
      const license = LicenseMother.detail({ licensedUnits: 20, currentUnits: 2016349 })
      license.consumptionPct = 100.8
      const { fixture } = await renderDetail(license)

      const pct = fixture.componentInstance.historyPct(2016349)

      // misma fuente que la card: jamás el ratio local units/licensedUnits (10081745%)
      expect(pct).toBeCloseTo(100.8, 1)
    })

    it('scales older periods proportionally with the snapshot ratio', async () => {
      const license = LicenseMother.detail({ licensedUnits: 20, currentUnits: 2016349 })
      license.consumptionPct = 100.8
      const { fixture } = await renderDetail(license)

      const pct = fixture.componentInstance.historyPct(1000000)

      expect(pct).toBeCloseTo((1000000 / 2016349) * 100.8, 1)
    })

    it('returns null instead of inventing a percentage when the snapshot has no ratio', async () => {
      const license = LicenseMother.detail({ currentUnits: 0 })
      license.consumptionPct = 0
      const { fixture } = await renderDetail(license)

      expect(fixture.componentInstance.historyPct(500)).toBeNull()
      expect(fixture.componentInstance.historyPctLabel(500)).toBe('—')
    })

    it('renders the derived percentage in the history row', async () => {
      const license = LicenseMother.detail({
        licensedUnits: 100,
        currentUnits: 60,
        consumption: [LicenseMother.consumption({ id: 'r1', periodYear: 2026, periodMonth: 6, units: 60 })]
      })
      await renderDetail(license)

      expect(screen.getByText('60%')).toBeTruthy()
    })
  })

  it('shows the not-found state when there is no license', async () => {
    await renderDetail(undefined)
    expect(screen.getByText('Licencia no encontrada.')).toBeTruthy()
  })

  it('navigates to the contract when the contract link is used', async () => {
    const navigate = vi.fn()
    const license = LicenseMother.detail({ contractId: '019eb713-19bb-7000-8000-000000000010' })
    const { fixture } = await renderDetail(license, { navigate })

    fixture.componentInstance.navigateToContract()

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/contracts', license.contractId])
  })

  it('goes back to the licenses list', async () => {
    const navigate = vi.fn()
    const { fixture } = await renderDetail(LicenseMother.detail(), { navigate })

    fixture.componentInstance.goBack()

    expect(navigate).toHaveBeenCalledWith(['/sap-licensing/licenses'])
  })

  it('is invalid when the consumption units are negative', async () => {
    const { fixture } = await renderDetail(LicenseMother.detail())
    fixture.componentInstance.consumptionForm.patchValue({ periodYear: 2026, periodMonth: 3, units: -1 })

    expect(fixture.componentInstance.consumptionForm.controls.units.invalid).toBe(true)
  })

  it('keeps periodMonth as a number when a month is picked from the select', async () => {
    const { fixture } = await renderDetail(LicenseMother.detail())
    const cmp = fixture.componentInstance

    fireEvent.click(screen.getByRole('combobox', { name: 'Mes' }))
    fireEvent.click(screen.getByRole('option', { name: '08' }))

    expect(cmp.consumptionForm.getRawValue().periodMonth).toBe(8)
    expect(document.querySelector('select')).toBeNull()
  })

  it('submits manual consumption with a generated id and MANUAL source', async () => {
    const addConsumption = vi.fn().mockResolvedValue(undefined)
    const { fixture } = await renderDetail(LicenseMother.detail(), { addConsumption })
    const cmp = fixture.componentInstance

    cmp.consumptionForm.patchValue({ periodYear: 2026, periodMonth: 5, units: 80 })
    await cmp.submitConsumption()

    expect(addConsumption).toHaveBeenCalledTimes(1)
    const dto = addConsumption.mock.calls[0][0]
    expect(dto).toMatchObject({ periodYear: 2026, periodMonth: 5, units: 80, source: 'MANUAL' })
    expect(typeof dto.id).toBe('string')
    expect(toast.success).toHaveBeenCalledWith('Consumo registrado correctamente')
    expect(cmp.consumptionForm.controls.units.value).toBe(0)
  })

  it('shows an error toast when the consumption submission fails', async () => {
    const addConsumption = vi.fn().mockRejectedValue(new Error('boom'))
    const { fixture } = await renderDetail(LicenseMother.detail(), { addConsumption })
    const cmp = fixture.componentInstance

    cmp.consumptionForm.patchValue({ periodYear: 2026, periodMonth: 5, units: 80 })
    await cmp.submitConsumption()

    expect(toast.error).toHaveBeenCalledWith('No se pudo registrar el consumo')
  })

  it('shows a period-conflict toast when the consumption period already exists', async () => {
    const addConsumption = vi.fn().mockRejectedValue(new HttpErrorResponse({ status: 409 }))
    const { fixture } = await renderDetail(LicenseMother.detail(), { addConsumption })
    const cmp = fixture.componentInstance

    cmp.consumptionForm.patchValue({ periodYear: 2026, periodMonth: 5, units: 80 })
    await cmp.submitConsumption()

    expect(toast.error).toHaveBeenCalledWith('Ya existe consumo registrado para ese periodo')
  })
})
