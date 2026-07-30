import { Provider } from '@angular/core'
import { AuthService } from '@app/frontend/core/services/auth.service'
import { CurrentUserDto, UserRoleEnum } from '@app/shared/domain'

/**
 * El acelerador todavía no emite módulo de autenticación en el backend, así que
 * `GET /auth/me` responde 404 y el usuario quedaría sin permisos de escritura
 * (listados en solo lectura). Hasta que exista ese módulo, en local se inyecta un
 * administrador. Sustituir por el AuthService real al conectar el plugin de auth.
 */
class LocalAdminAuthService extends AuthService {
  private static readonly ADMIN: CurrentUserDto = {
    id: '00000000-0000-7000-8000-000000000000',
    email: 'admin@local',
    name: 'Admin Local',
    role: UserRoleEnum.ADMIN
  }

  override async loadCurrentUser(): Promise<CurrentUserDto | null> {
    this.setCurrentUser(LocalAdminAuthService.ADMIN)
    return LocalAdminAuthService.ADMIN
  }
}

export const devAuthProvider: Provider = { provide: AuthService, useClass: LocalAdminAuthService }
