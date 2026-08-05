import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { vi } from 'vitest'
import { ProjectDto } from '@sap-licenses/shared/domain'
import { ProjectDetailComponent } from './project-detail.component'
import { ProjectService } from '../../../../../../core/services/project.service'

const routeWith = (id: string | null) => ({ snapshot: { paramMap: { get: () => id } } })

/**
 * Registro mínimo declarado aquí y no importado de mocks/: el generador de app
 * reubica los mocks junto al servicio (core/services/mocks), así que una ruta
 * relativa desde la pantalla se rompe según el layout.
 */
const record = () =>
  ({ id: '019eb800-0000-7000-8000-000000000001', customerName: 'Registro de prueba' }) as unknown as ProjectDto

describe('ProjectDetailComponent — ficha', () => {
  const setup = (id: string | null, findOne = vi.fn().mockResolvedValue(record())) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: routeWith(id) },
        { provide: ProjectService, useValue: { findOne, update: vi.fn(), remove: vi.fn() } }
      ]
    })
    return { component: TestBed.inject(ProjectDetailComponent), findOne }
  }

  beforeEach(() => TestBed.resetTestingModule())

  it('carga el registro del id de la ruta', async () => {
    const { component, findOne } = setup(record().id)
    await component.load()

    expect(findOne).toHaveBeenCalledWith(record().id)
    expect(component.project()).toEqual(record())
    expect(component.loading()).toBe(false)
  })

  it('marca no encontrado cuando la ruta no trae id', async () => {
    const { component } = setup(null)
    await component.load()

    expect(component.notFound()).toBe(true)
  })

  it('distingue un 404 de un error de red', async () => {
    const { component } = setup(record().id, vi.fn().mockRejectedValue({ status: 404 }))
    await component.load()

    expect(component.notFound()).toBe(true)
    expect(component.error()).toBe(false)
  })

  it('muestra un guion cuando el campo viene vacío', () => {
    const { component } = setup(record().id)

    expect(component.format({ ...record(), customerName: null } as never, { key: 'customerName', label: 'x' })).toBe(
      '—'
    )
  })
})
