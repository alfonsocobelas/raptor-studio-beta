import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'studio' },
  {
    path: 'studio',
    loadComponent: () =>
      import('@app/frontend/domains/studio/design/studio-canvas.component').then(m => m.StudioCanvasComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/frontend/domains/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
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
