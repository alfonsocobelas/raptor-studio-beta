import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/frontend/domains/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'sap-licensing/customers',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/sap-licensing/features/customers/customers-list.component').then(
        m => m.CustomersListComponent
      )
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
