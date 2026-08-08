import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/frontend/domains/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'fincaraiz/propiedades',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/fincaraiz/features/propiedades/propiedades-list.component').then(
        m => m.PropiedadsListComponent
      )
  },
  {
    path: 'fincaraiz/propiedades/galeria',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/fincaraiz/features/propiedades/propiedades-gallery.component').then(
        m => m.PropiedadesGalleryComponent
      )
  },
  {
    path: 'fincaraiz/propiedades/:id',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/fincaraiz/features/propiedades/propiedad-detail.component').then(
        m => m.PropiedadDetailComponent
      )
  },
  {
    path: 'fincaraiz/visitas',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/fincaraiz/features/visitas/visitas-list.component').then(
        m => m.VisitasListComponent
      )
  },
  {
    path: 'fincaraiz/visitas/:id',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/fincaraiz/features/visitas/visita-detail.component').then(
        m => m.VisitaDetailComponent
      )
  },
  {
    path: 'fincaraiz/agentes',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/fincaraiz/features/agentes/agentes-list.component').then(
        m => m.AgentesListComponent
      )
  },
  {
    path: 'fincaraiz/agentes/:id',
    loadComponent: () =>
      import('@app/frontend/domains/admin/bounded-contexts/fincaraiz/features/agentes/agente-detail.component').then(
        m => m.AgenteDetailComponent
      )
  }
]
