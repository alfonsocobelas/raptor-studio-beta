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
  { path: '', pathMatch: 'full', redirectTo: 'dealership/vehicles' },
  {
    path: 'dealership/vehicles',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/dealership/features/vehicles/vehicles-list.component').then(
        m => m.VehiclesListComponent
      )
  },
  {
    path: 'dealership/clients',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/dealership/features/clients/clients-list.component').then(
        m => m.ClientsListComponent
      )
  },
  {
    path: 'dealership/sales',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/dealership/features/sales/sales-list.component').then(
        m => m.SalesListComponent
      )
  }
]
