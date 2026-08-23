import { Injectable, computed, signal } from '@angular/core'
import { CurrentUserDto, LoginDto, UserRoleEnum } from '@app/shared/domain'

/**
 * Doble de previsualización del AuthService emitido (spec 57). Mismo NOMBRE de clase a
 * propósito: las copias sincronizadas de las vistas de sistema lo inyectan sin tocar su
 * código — el sync solo reescribe la ruta del import. Todo es inerte: datos de muestra
 * dentro, ninguna red fuera.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<CurrentUserDto>({
    id: '01900000-0000-7000-8000-000000000001',
    email: 'admin@app.local',
    name: 'Admin Local',
    role: UserRoleEnum.ADMIN
  })

  readonly currentUser = this._currentUser.asReadonly()
  readonly isAuthenticated = computed(() => true)
  readonly isAdmin = computed(() => true)

  async login(_dto: LoginDto): Promise<CurrentUserDto> {
    return this._currentUser()
  }

  async logout(): Promise<void> {
    // inerte: la vista de sistema se mira, no se usa
  }

  async changePassword(_dto: { currentPassword: string; newPassword: string }): Promise<void> {
    // inerte
  }
}
