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
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/frontend/domains/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'sap-licensing/contracts',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/sap-licensing/features/contracts/contracts-list.component').then(
        m => m.ContractsListComponent
      )
  },
  {
    path: 'sap-licensing/projects',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/sap-licensing/features/projects/projects-list.component').then(
        m => m.ProjectsListComponent
      )
  }
]
