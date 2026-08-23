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
    path: 'sap-licensing/contracts/cronograma',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/sap-licensing/features/contracts/contracts-gantt.component').then(
        m => m.ContractsGanttComponent
      )
  },
  {
    path: 'sap-licensing/contracts/tablero',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/sap-licensing/features/contracts/contracts-kanban.component').then(
        m => m.ContractsKanbanComponent
      )
  },
  {
    path: 'sap-licensing/contracts/:id',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/sap-licensing/features/contracts/contract-detail.component').then(
        m => m.ContractDetailComponent
      )
  },
  {
    path: 'sap-licensing/licenses',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/sap-licensing/features/licenses/licenses-list.component').then(
        m => m.LicensesListComponent
      )
  }
]
