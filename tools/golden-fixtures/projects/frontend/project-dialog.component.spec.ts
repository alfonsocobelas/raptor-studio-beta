import { DatePipe } from '@angular/common'
import { Component, provideZonelessChangeDetection, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { ProjectImplementerEnum, ProjectOriginEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'
import { fireEvent, render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { CustomerMother } from '../../../../../../../tests/mothers/customer.mother'
import { ProjectMother } from '../../../../../../../tests/mothers/project.mother'
import { CustomerService } from '../../../../../../core/services/customer.service'
import { ProjectDialogComponent } from './project-dialog.component'

const customer = CustomerMother.one({ id: '019eb713-19bb-7000-8000-0000000000a1', name: 'Acme Corp' })

const mockCustomerService = () =>
  ({
    customers: { value: signal({ total: 1, page: 1, pageSize: 20, totalPages: 1, items: [customer] }) }
  }) as unknown as CustomerService

const configure = () =>
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      DatePipe,
      { provide: CustomerService, useValue: mockCustomerService() }
    ]
  })

const build = (): ProjectDialogComponent => {
  configure()
  return TestBed.runInInjectionContext(() => new ProjectDialogComponent())
}

// Variante con el input project poblado (isMeSap/sapInfo derivan del input, no del form).
const buildWith = (project: ReturnType<typeof ProjectMother.one> | null): ProjectDialogComponent => {
  configure()
  const fixture = TestBed.createComponent(ProjectDialogComponent)
  fixture.componentRef.setInput('project', project)
  fixture.detectChanges()
  return fixture.componentInstance
}

describe('ProjectDialogComponent', () => {
  it('starts invalid with the documented defaults', () => {
    const cmp = build()

    expect(cmp.form.invalid).toBe(true)
    expect(cmp.form.getRawValue()).toMatchObject({
      status: ProjectStatusEnum.PLANNING,
      implementer: ProjectImplementerEnum.AVVALE,
      description: ''
    })
  })

  it('is invalid when required fields are missing', () => {
    const cmp = build()
    cmp.form.patchValue({ name: '', customerId: '', startDate: '' })
    expect(cmp.form.invalid).toBe(true)
  })

  it('is invalid when endDate is before startDate', () => {
    const cmp = build()
    cmp.form.patchValue({
      name: 'Rollout',
      customerId: customer.id,
      startDate: '2026-12-31',
      endDate: '2026-01-01'
    })
    expect(cmp.form.errors).toEqual({ dateRange: true })
  })

  it('is valid when endDate equals startDate', () => {
    const cmp = build()
    cmp.form.patchValue({
      name: 'Rollout',
      customerId: customer.id,
      startDate: '2026-01-01',
      endDate: '2026-01-01'
    })
    expect(cmp.form.valid).toBe(true)
  })

  it('emits the form value with the resolved customerName and a null empty end date on save', () => {
    const cmp = build()
    const emitted = vi.fn()
    cmp.saved.subscribe(emitted)
    cmp.form.patchValue({
      name: 'S/4HANA Rollout',
      customerId: customer.id,
      startDate: '2026-01-15',
      endDate: '',
      status: ProjectStatusEnum.ACTIVE,
      implementer: ProjectImplementerEnum.THIRD_PARTY
    })

    cmp.save({ close: vi.fn() })

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted.mock.calls[0][0]).toMatchObject({
      name: 'S/4HANA Rollout',
      customerId: customer.id,
      customerName: 'Acme Corp',
      startDate: '2026-01-15',
      endDate: null,
      status: ProjectStatusEnum.ACTIVE,
      implementer: ProjectImplementerEnum.THIRD_PARTY
    })
  })

  it('does not emit when the form is invalid', () => {
    const cmp = build()
    const emitted = vi.fn()
    cmp.saved.subscribe(emitted)

    cmp.save({ close: vi.fn() })

    expect(emitted).not.toHaveBeenCalled()
  })

  it('patches the form from an existing project', () => {
    const cmp = build()
    TestBed.tick()
    cmp.patchFromProject({
      id: 'x',
      customerId: customer.id,
      customerName: 'Acme Corp',
      name: 'Existing',
      description: 'desc',
      startDate: '2026-02-01',
      endDate: null,
      status: ProjectStatusEnum.ONHOLD,
      implementer: ProjectImplementerEnum.AVVALE,
      origin: ProjectOriginEnum.MANUAL,
      sapProjectId: null,
      atRisk: null,
      inEscalation: null,
      nbrOfWaves: null,
      waveStage: null,
      waveStatus: null,
      planToGoLive: null
    })

    expect(cmp.form.getRawValue()).toMatchObject({
      name: 'Existing',
      customerId: customer.id,
      description: 'desc',
      startDate: '2026-02-01',
      endDate: '',
      status: ProjectStatusEnum.ONHOLD
    })
  })

  describe('SAP data section for ME_SAP projects (spec 46)', () => {
    const meSapProject = () =>
      ProjectMother.one({
        origin: ProjectOriginEnum.ME_SAP,
        sapProjectId: '100001',
        name: 'Procurement (100001)',
        nbrOfWaves: 3,
        waveStage: 'Implementing',
        waveStatus: 'Green',
        planToGoLive: '2026-10-14',
        atRisk: null,
        inEscalation: null
      })

    it('isMeSap derives from the input project origin', () => {
      const cmp = buildWith(meSapProject())

      expect(cmp.isMeSap()).toBe(true)
    })

    it('isMeSap is false for a MANUAL project', () => {
      expect(buildWith(ProjectMother.one({ origin: ProjectOriginEnum.MANUAL })).isMeSap()).toBe(false)
    })

    it('isMeSap is false in create mode', () => {
      expect(buildWith(null).isMeSap()).toBe(false)
    })

    it('formats the SAP fields for display, dashing the never-observed ones', () => {
      const cmp = buildWith(meSapProject())

      expect(cmp.sapInfo()).toEqual([
        { label: 'Go-live planificado', value: '14-10-2026' },
        { label: 'Nº de waves', value: '3' },
        { label: 'Fase de la wave', value: 'Implementing' },
        { label: 'Estado de la wave', value: 'Green' },
        { label: 'En riesgo', value: '—' },
        { label: 'En escalación', value: '—' }
      ])
    })

    it('disables the sync-governed controls and keeps description/implementer editable', () => {
      const cmp = buildWith(meSapProject())

      expect(cmp.form.controls.name.disabled).toBe(true)
      expect(cmp.form.controls.customerId.disabled).toBe(true)
      expect(cmp.form.controls.status.disabled).toBe(true)
      expect(cmp.form.controls.startDate.disabled).toBe(true)
      expect(cmp.form.controls.endDate.disabled).toBe(true)
      expect(cmp.form.controls.description.enabled).toBe(true)
      expect(cmp.form.controls.implementer.enabled).toBe(true)
    })

    it('stays valid for an ME_SAP project without startDate (the disabled control skips required)', () => {
      const cmp = buildWith(ProjectMother.one({ origin: ProjectOriginEnum.ME_SAP, sapProjectId: '1', startDate: null }))

      expect(cmp.form.valid).toBe(true)
    })

    it('keeps every control enabled for a MANUAL project', () => {
      const cmp = buildWith(ProjectMother.one({ origin: ProjectOriginEnum.MANUAL }))

      expect(cmp.form.controls.name.enabled).toBe(true)
      expect(cmp.form.controls.startDate.enabled).toBe(true)
    })

    it('dashes a missing go-live and waves count', () => {
      const cmp = buildWith(
        ProjectMother.one({
          origin: ProjectOriginEnum.ME_SAP,
          sapProjectId: '100001',
          planToGoLive: null,
          nbrOfWaves: null,
          waveStage: null,
          waveStatus: null,
          atRisk: 'X',
          inEscalation: 'Yes'
        })
      )

      expect(cmp.sapInfo()).toEqual([
        { label: 'Go-live planificado', value: '—' },
        { label: 'Nº de waves', value: '—' },
        { label: 'Fase de la wave', value: '—' },
        { label: 'Estado de la wave', value: '—' },
        { label: 'En riesgo', value: 'X' },
        { label: 'En escalación', value: 'Yes' }
      ])
    })
  })

  describe('rendered selects (Spartan, not native)', () => {
    @Component({
      selector: 'app-host',
      imports: [HlmDialogImports, ProjectDialogComponent],
      template: `
        <hlm-dialog state="open">
          <app-project-dialog />
        </hlm-dialog>
      `
    })
    class HostComponent {}

    const renderDialog = () =>
      render(HostComponent, {
        providers: [
          provideZonelessChangeDetection(),
          DatePipe,
          { provide: CustomerService, useValue: mockCustomerService() }
        ]
      })

    it('renders no native select', async () => {
      await renderDialog()

      expect(document.querySelector('select')).toBeNull()
    })

    it('shows the default labels in the triggers and picks a customer from the listbox', async () => {
      await renderDialog()

      expect(screen.getByRole('combobox', { name: 'Estado' }).textContent).toContain('Planificación')
      expect(screen.getByRole('combobox', { name: 'Implementador' }).textContent).toContain('AVVALE')

      fireEvent.click(screen.getByRole('combobox', { name: 'Cliente' }))
      fireEvent.click(screen.getByRole('option', { name: 'Acme Corp' }))

      expect(screen.getByRole('combobox', { name: 'Cliente' }).textContent).toContain('Acme Corp')
    })
  })
})
