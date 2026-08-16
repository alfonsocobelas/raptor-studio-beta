import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/frontend/domains/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'aguas/muestras',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/muestras/muestras-list.component').then(
        m => m.MuestrasListComponent
      )
  },
  {
    path: 'aguas/muestras/papelera',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/muestras/muestras-trash.component').then(
        m => m.MuestrasTrashComponent
      )
  },
  {
    path: 'aguas/muestras/:id',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/muestras/muestra-detail.component').then(
        m => m.MuestraDetailComponent
      )
  },
  {
    path: 'aguas/clientes',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/clientes/clientes-list.component').then(
        m => m.ClientesListComponent
      )
  },
  {
    path: 'aguas/clientes/papelera',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/clientes/clientes-trash.component').then(
        m => m.ClientesTrashComponent
      )
  },
  {
    path: 'aguas/puntos',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/puntos/puntos-list.component').then(
        m => m.PuntosListComponent
      )
  },
  {
    path: 'aguas/puntos/papelera',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/puntos/puntos-trash.component').then(
        m => m.PuntosTrashComponent
      )
  },
  {
    path: 'aguas/parametros',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/parametros/parametros-list.component').then(
        m => m.ParametrosListComponent
      )
  },
  {
    path: 'aguas/parametros/papelera',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/aguas/features/parametros/parametros-trash.component').then(
        m => m.ParametrosTrashComponent
      )
  }
]
