import { Component, signal } from '@angular/core'
import { provideZonelessChangeDetection } from '@angular/core'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { fireEvent, render, screen } from '@testing-library/angular'
import { CustomerMother } from '../../../../../../../tests/mothers/customer.mother'
import { ContactDialogComponent, ContactFormValue } from './contact-dialog.component'

@Component({
  selector: 'app-host',
  imports: [HlmDialogImports, ContactDialogComponent],
  template: `
    <hlm-dialog state="open">
      <app-contact-dialog [contact]="contact()" (saved)="onSaved($event)" />
    </hlm-dialog>
  `
})
class HostComponent {
  readonly contact = signal<ReturnType<typeof CustomerMother.contact> | null>(null)
  readonly savedEvents: ContactFormValue[] = []
  onSaved(value: ContactFormValue): void {
    this.savedEvents.push(value)
  }
}

const renderDialog = async (contact: ReturnType<typeof CustomerMother.contact> | null = null) => {
  const result = await render(HostComponent, { providers: [provideZonelessChangeDetection()] })
  if (contact) {
    result.fixture.componentInstance.contact.set(contact)
    result.detectChanges()
  }
  return result.fixture.componentInstance
}

describe('ContactDialogComponent', () => {
  it('renders the form and the create button in create mode', async () => {
    await renderDialog()

    expect(screen.getByText('Nuevo contacto')).toBeTruthy()
    expect(screen.getByLabelText('Nombre')).toBeTruthy()
    expect(screen.getByLabelText('Cargo')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Teléfono')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Crear' })).toBeTruthy()
  })

  it('disables submit and does not emit when name is empty', async () => {
    const host = await renderDialog()

    const submit = screen.getByRole('button', { name: 'Crear' }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)

    fireEvent.click(submit)
    expect(host.savedEvents.length).toBe(0)
  })

  it('keeps submit disabled when the email format is invalid', async () => {
    await renderDialog()

    fireEvent.input(screen.getByLabelText('Nombre'), { target: { value: 'Jane Doe' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })

    expect((screen.getByRole('button', { name: 'Crear' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables submit with an empty email (email is optional)', async () => {
    await renderDialog()

    fireEvent.input(screen.getByLabelText('Nombre'), { target: { value: 'Jane Doe' } })

    expect((screen.getByRole('button', { name: 'Crear' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('emits saved with the form values, including isPrimary from the checkbox', async () => {
    const host = await renderDialog()

    fireEvent.input(screen.getByLabelText('Nombre'), { target: { value: 'Jane Doe' } })
    fireEvent.input(screen.getByLabelText('Cargo'), { target: { value: 'CTO' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'jane@acme.com' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))

    expect(host.savedEvents.length).toBe(1)
    expect(host.savedEvents[0]).toEqual({
      name: 'Jane Doe',
      role: 'CTO',
      email: 'jane@acme.com',
      phone: '',
      isPrimary: true
    })
  })

  it('prefills the form and shows edit labels in edit mode', async () => {
    const contact = CustomerMother.contact({ name: 'Alice Smith', role: 'Director', email: 'alice@acme.com' })
    await renderDialog(contact)

    expect(screen.getByText('Editar contacto')).toBeTruthy()
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Alice Smith')
    expect((screen.getByLabelText('Cargo') as HTMLInputElement).value).toBe('Director')
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('alice@acme.com')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy()
  })
})
