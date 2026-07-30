import { Component, signal } from '@angular/core'
import { provideZonelessChangeDetection } from '@angular/core'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { fireEvent, render, screen, waitFor } from '@testing-library/angular'
import { CustomerMother } from '../../../../../../../tests/mothers/customer.mother'
import { CustomerDialogComponent, CustomerFormValue } from './customer-dialog.component'

@Component({
  selector: 'app-host',
  imports: [HlmDialogImports, CustomerDialogComponent],
  template: `
    <hlm-dialog state="open">
      <app-customer-dialog [customer]="customer()" (saved)="onSaved($event)" />
    </hlm-dialog>
  `
})
class HostComponent {
  readonly customer = signal<ReturnType<typeof CustomerMother.one> | null>(null)
  readonly savedEvents: CustomerFormValue[] = []
  onSaved(value: CustomerFormValue): void {
    this.savedEvents.push(value)
  }
}

const renderDialog = async (customer: ReturnType<typeof CustomerMother.one> | null = null) => {
  const result = await render(HostComponent, { providers: [provideZonelessChangeDetection()] })
  if (customer) {
    result.fixture.componentInstance.customer.set(customer)
    result.detectChanges()
  }
  return result.fixture.componentInstance
}

describe('CustomerDialogComponent', () => {
  it('renders the form with "Datos generales" and "Notas" sections in create mode', async () => {
    await renderDialog()

    expect(screen.getByText('Nuevo cliente')).toBeTruthy()
    expect(screen.getByText('Datos generales')).toBeTruthy()
    expect(screen.getByText('Notas')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Crear' })).toBeTruthy()
  })

  it('disables submit and does not emit when required fields are empty', async () => {
    const host = await renderDialog()

    const submit = screen.getByRole('button', { name: 'Crear' }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)

    fireEvent.click(submit)
    expect(host.savedEvents.length).toBe(0)
  })

  it('keeps submit disabled when name is filled but ID SAP is empty', async () => {
    await renderDialog()

    fireEvent.input(screen.getByLabelText('Nombre'), { target: { value: 'Globex SA' } })

    expect((screen.getByRole('button', { name: 'Crear' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits saved with the form values when required fields are filled and submitted', async () => {
    const host = await renderDialog()

    fireEvent.input(screen.getByLabelText('ID SAP'), { target: { value: '1799999' } })
    fireEvent.input(screen.getByLabelText('Nombre'), { target: { value: 'Globex SA' } })
    fireEvent.input(screen.getByLabelText('CIF / NIF'), { target: { value: 'B99999999' } })
    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }))
    fireEvent.click(screen.getByRole('option', { name: 'Cloud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))

    expect(host.savedEvents.length).toBe(1)
    expect(host.savedEvents[0]).toMatchObject({
      sapId: '1799999',
      name: 'Globex SA',
      taxId: 'B99999999',
      customerType: 'cloud'
    })
  })

  it('prefills the form and shows edit labels in edit mode', async () => {
    const customer = CustomerMother.one({
      sapId: '1797407',
      name: 'Acme Corp',
      taxId: 'B12345678',
      customerType: 'hybrid'
    })
    await renderDialog(customer)

    expect(screen.getByText('Editar cliente')).toBeTruthy()
    expect((screen.getByLabelText('ID SAP') as HTMLInputElement).value).toBe('1797407')
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Acme Corp')
    expect((screen.getByLabelText('CIF / NIF') as HTMLInputElement).value).toBe('B12345678')
    expect(screen.getByRole('combobox', { name: 'Tipo' }).textContent).toContain('Hybrid')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy()
  })

  it('requires a customer type: submit stays disabled until one is selected', async () => {
    await renderDialog()

    fireEvent.input(screen.getByLabelText('ID SAP'), { target: { value: '1799999' } })
    fireEvent.input(screen.getByLabelText('Nombre'), { target: { value: 'Globex SA' } })
    expect((screen.getByRole('button', { name: 'Crear' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }))
    fireEvent.click(screen.getByRole('option', { name: 'On-prem' }))
    expect((screen.getByRole('button', { name: 'Crear' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows a required error for the customer type once touched and left empty', async () => {
    await renderDialog()

    // Abrir y cerrar sin elegir marca el control como touched. Ojo: hay dos backdrops
    // apilados (diálogo + popover del select); el del select es el último.
    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }))
    const backdrops = document.querySelectorAll('.cdk-overlay-backdrop')
    fireEvent.click(backdrops[backdrops.length - 1])

    await waitFor(() => expect(screen.getByText('Obligatorio')).toBeTruthy())
  })

  it('renders the type select as a styled Spartan select, not a native one', async () => {
    await renderDialog()

    expect(document.querySelector('select')).toBeNull()
    // Sin valor (null) el trigger muestra el placeholder
    expect(screen.getByRole('combobox', { name: 'Tipo' }).textContent).toContain('Seleccionar tipo')
  })
})
