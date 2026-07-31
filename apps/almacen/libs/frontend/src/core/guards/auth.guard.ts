import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { LOGIN_ROUTE } from '../http/api.constants'
import { UserRoleEnum } from '@app/shared/domain'
import { AuthService } from '../services/auth.service'

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)
  return auth.isAuthenticated() ? true : router.createUrlTree([LOGIN_ROUTE])
}

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)
  return auth.currentUser()?.role === UserRoleEnum.ADMIN ? true : router.createUrlTree(['/'])
}

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)
  return auth.isAuthenticated() ? router.createUrlTree(['/']) : true
}
