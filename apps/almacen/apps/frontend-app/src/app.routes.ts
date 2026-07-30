import { Routes } from '@angular/router'
import { authGuard, loginGuard } from '@app/frontend/core/guards/auth.guard'

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('@app/frontend/domains/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('@app/frontend/domains/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('@app/frontend/domains/auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'accept-invitation',
    loadComponent: () => import('@app/frontend/domains/auth/set-password.component').then(m => m.SetPasswordComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'warehouse/garments' },
  {
    path: 'warehouse/garments',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/warehouse/features/garments/garments-list.component').then(
        m => m.GarmentsListComponent
      )
  },
  {
    path: 'warehouse/suppliers',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/warehouse/features/suppliers/suppliers-list.component').then(
        m => m.SuppliersListComponent
      )
  },
  {
    path: 'warehouse/movements',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/warehouse/features/movements/movements-list.component').then(
        m => m.MovementsListComponent
      )
  }
]
