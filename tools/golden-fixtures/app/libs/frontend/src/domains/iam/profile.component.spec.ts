import { provideZonelessChangeDetection, signal } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { CurrentUserDto, UserRoleEnum } from '@app/shared/domain'
import { fireEvent, render, screen, waitFor } from '@testing-library/angular'
import { vi } from 'vitest'
import { AuthService } from '../../core/services/auth.service'
import { ProfileComponent } from './profile.component'

const USER: CurrentUserDto = {
  id: '019eb800-0000-7000-8000-000000000123',
  email: 'admin@app.local',
  name: 'Admin Local',
  role: UserRoleEnum.ADMIN
}

const setup = (changePassword = vi.fn(), user: CurrentUserDto | null = USER) =>
  render(ProfileComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: AuthService, useValue: { currentUser: signal(user), changePassword } }
    ]
  })

const fillForm = (current: string, newPass: string, confirm: string) => {
  fireEvent.input(screen.getByLabelText('Contraseña actual'), { target: { value: current } })
  fireEvent.input(screen.getByLabelText('Nueva contraseña'), { target: { value: newPass } })
  fireEvent.input(screen.getByLabelText('Repite la nueva contraseña'), { target: { value: confirm } })
}

const submitButton = (): HTMLButtonElement => screen.getByRole('button', { name: 'Guardar' })

describe('ProfileComponent — datos de la cuenta', () => {
  it('muestra nombre, email y rol del usuario en sesión', async () => {
    await setup()

    expect(screen.getByText('Admin Local')).toBeTruthy()
    expect(screen.getByText('admin@app.local')).toBeTruthy()
    expect(screen.getByText('Administrador')).toBeTruthy()
  })
})

describe('ProfileComponent — validación', () => {
  it('deshabilita el envío mientras el formulario es inválido', async () => {
    await setup()

    expect(submitButton().disabled).toBe(true)

    fillForm('current-pass-1', 'short', 'short')
    expect(submitButton().disabled).toBe(true)

    fillForm('current-pass-1', 'new-password-1', 'new-password-1')
    expect(submitButton().disabled).toBe(false)
  })

  it('señala la confirmación que no coincide', async () => {
    await setup()

    fillForm('current-pass-1', 'new-password-1', 'different-pass-1')

    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
    expect(submitButton().disabled).toBe(true)
  })
})

describe('ProfileComponent — estados del envío', () => {
  it('401 muestra "contraseña actual incorrecta" y permite reintentar', async () => {
    const changePassword = vi.fn().mockRejectedValue(new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    await setup(changePassword)

    fillForm('wrong-pass-1', 'new-password-1', 'new-password-1')
    fireEvent.click(submitButton())

    expect(await screen.findByText('La contraseña actual no es correcta')).toBeTruthy()
    expect(submitButton().disabled).toBe(false)
  })

  it('cualquier otro error muestra el mensaje genérico reintentable', async () => {
    const changePassword = vi.fn().mockRejectedValue(new HttpErrorResponse({ status: 500 }))
    await setup(changePassword)

    fillForm('current-pass-1', 'new-password-1', 'new-password-1')
    fireEvent.click(submitButton())

    expect(await screen.findByText(/No se pudo cambiar la contraseña/i)).toBeTruthy()
    expect(submitButton().disabled).toBe(false)
  })

  it('el éxito confirma, limpia el formulario y envió exactamente el DTO', async () => {
    const changePassword = vi.fn().mockResolvedValue(undefined)
    await setup(changePassword)

    fillForm('current-pass-1', 'new-password-1', 'new-password-1')
    fireEvent.click(submitButton())

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'current-pass-1',
        newPassword: 'new-password-1'
      })
    )
    expect(await screen.findByText('Contraseña actualizada')).toBeTruthy()
    expect((screen.getByLabelText('Contraseña actual') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Nueva contraseña') as HTMLInputElement).value).toBe('')
  })

  it('un envío nuevo limpia el error anterior', async () => {
    const changePassword = vi
      .fn()
      .mockRejectedValueOnce(new HttpErrorResponse({ status: 401 }))
      .mockResolvedValueOnce(undefined)
    await setup(changePassword)

    fillForm('wrong-pass-1', 'new-password-1', 'new-password-1')
    fireEvent.click(submitButton())
    expect(await screen.findByText('La contraseña actual no es correcta')).toBeTruthy()

    fillForm('current-pass-1', 'new-password-1', 'new-password-1')
    fireEvent.click(submitButton())

    await waitFor(() => expect(screen.queryByText('La contraseña actual no es correcta')).toBeNull())
    expect(await screen.findByText('Contraseña actualizada')).toBeTruthy()
  })
})
