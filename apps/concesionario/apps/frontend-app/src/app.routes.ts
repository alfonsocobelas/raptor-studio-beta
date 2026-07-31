import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/dealership/features/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      )
  },
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
