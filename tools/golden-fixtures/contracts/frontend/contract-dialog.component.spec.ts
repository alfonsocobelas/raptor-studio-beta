import { Component, provideZonelessChangeDetection, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { ContractStatusEnum, ContractTypeEnum } from '@sap-licenses/shared/domain'
import { fireEvent, render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { CustomerService } from '../../../../../../core/services/customer.service'
import { CustomerMother } from '../../../../../../../tests/mothers/customer.mother'
import { ContractMother } from '../../../../../../../tests/mothers/contract.mother'
import { ContractDialogComponent } from './contract-dialog.component'

const customer = CustomerMother.one({ id: '019eb713-19bb-7000-8000-0000000000a1', name: 'Acme Corp' })

const mockCustomerService = () =>
  ({
    customers: { value: signal({ total: 1, page: 1, pageSize: 20, totalPages: 1, items: [customer] }) }
  }) as unknown as CustomerService

const build = (): ContractDialogComponent => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), { provide: CustomerService, useValue: mockCustomerService() }]
  })
  return TestBed.runInInjectionContext(() => new ContractDialogComponent())
}

describe('ContractDialogComponent', () => {
  it('starts invalid with the documented defaults', () => {
    const cmp = build()

    expect(cmp.form.invalid).toBe(true)
    expect(cmp.form.getRawValue()).toMatchObject({
      contractType: ContractTypeEnum.CLOUD,
      status: ContractStatusEnum.ACTIVE,
      source: 'AVVALE_SOLD',
      billingFrequency: 'yearly',
      renewalType: 'manual',
      currency: 'EUR',
      isFavorite: false
    })
  })

  it('is invalid when required fields are missing', () => {
    const cmp = build()
    cmp.form.patchValue({ contractNumber: '', customerId: '' })
    expect(cmp.form.invalid).toBe(true)
  })

  it('is invalid when endDate is before startDate', () => {
    const cmp = build()
    cmp.form.patchValue({
      contractNumber: 'AVV-1',
      customerId: customer.id,
      startDate: '2026-12-31',
      endDate: '2026-01-01'
    })
    expect(cmp.form.errors).toEqual({ dateRange: true })
  })

  it('does not expose a totalValue field: the contract value is derived from its licenses (spec 40)', () => {
    const cmp = build()
    expect('totalValue' in cmp.form.controls).toBe(false)
  })

  it('emits the form value with the resolved customerName and a null empty end date on save', () => {
    const cmp = build()
    const emitted = vi.fn()
    cmp.saved.subscribe(emitted)
    cmp.form.patchValue({
      contractType: ContractTypeEnum.ONPREM,
      contractNumber: 'AVV-2',
      customerId: customer.id,
      startDate: '2026-01-15',
      endDate: ''
    })

    cmp.save({ close: vi.fn() })

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted.mock.calls[0][0]).toMatchObject({
      contractType: ContractTypeEnum.ONPREM,
      contractNumber: 'AVV-2',
      customerId: customer.id,
      customerName: 'Acme Corp',
      startDate: '2026-01-15',
      endDate: null
    })
    // El valor total ya no forma parte del formulario ni del payload emitido
    expect('totalValue' in emitted.mock.calls[0][0]).toBe(false)
  })

  it('does not emit when startDate is missing (required)', () => {
    const cmp = build()
    const emitted = vi.fn()
    cmp.saved.subscribe(emitted)
    cmp.form.patchValue({
      contractType: ContractTypeEnum.ONPREM,
      contractNumber: 'AVV-3',
      customerId: customer.id,
      startDate: '',
      endDate: ''
    })

    cmp.save({ close: vi.fn() })

    expect(emitted).not.toHaveBeenCalled()
  })

  it('does not emit when the form is invalid', () => {
    const cmp = build()
    const emitted = vi.fn()
    cmp.saved.subscribe(emitted)

    cmp.save({ close: vi.fn() })

    expect(emitted).not.toHaveBeenCalled()
  })

  it('patches the form from the contract in edit mode', () => {
    const cmp = build()
    const contract = ContractMother.one({ contractNumber: 'AVV-EDIT', isFavorite: true })

    cmp.patchFromContract(contract)

    expect(cmp.form.getRawValue()).toMatchObject({
      contractNumber: 'AVV-EDIT',
      isFavorite: true,
      customerId: contract.customerId
    })
  })

  describe('rendered selects (Spartan, not native)', () => {
    @Component({
      selector: 'app-host',
      imports: [HlmDialogImports, ContractDialogComponent],
      template: `
        <hlm-dialog state="open">
          <app-contract-dialog />
        </hlm-dialog>
      `
    })
    class HostComponent {}

    const renderDialog = () =>
      render(HostComponent, {
        providers: [provideZonelessChangeDetection(), { provide: CustomerService, useValue: mockCustomerService() }]
      })

    it('renders no native select', async () => {
      await renderDialog()

      expect(document.querySelector('select')).toBeNull()
    })

    it('shows the default labels in the triggers and picks a customer from the listbox', async () => {
      await renderDialog()

      expect(screen.getByRole('combobox', { name: 'Tipo' }).textContent).toContain('Cloud')
      expect(screen.getByRole('combobox', { name: 'Estado' }).textContent).toContain('Activo')
      expect(screen.getByRole('combobox', { name: 'Facturación' }).textContent).toContain('Anual')
      expect(screen.getByRole('combobox', { name: 'Renovación' }).textContent).toContain('Manual')
      expect(screen.getByRole('combobox', { name: 'Origen' }).textContent).toContain('Vendido por Avvale')

      fireEvent.click(screen.getByRole('combobox', { name: 'Cliente' }))
      fireEvent.click(screen.getByRole('option', { name: 'Acme Corp' }))

      expect(screen.getByRole('combobox', { name: 'Cliente' }).textContent).toContain('Acme Corp')
    })
  })
})
