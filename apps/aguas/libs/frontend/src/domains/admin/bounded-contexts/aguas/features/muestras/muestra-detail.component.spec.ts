import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { vi } from 'vitest'
import { MuestraDto } from '@app/shared/domain'
import { MuestraDetailComponent } from './muestra-detail.component'
import { MuestraService } from '../../../../../../core/services/muestra.service'

const routeWith = (id: string | null) => ({ snapshot: { paramMap: { get: () => id } } })

/**
 * Registro mínimo declarado aquí y no importado de mocks/: el generador de app
 * reubica los mocks junto al servicio (core/services/mocks), así que una ruta
 * relativa desde la pantalla se rompe según el layout.
 */
const record = () =>
  ({ id: '019eb800-0000-7000-8000-000000000001', codigo: 'Registro de prueba' }) as unknown as MuestraDto

describe('MuestraDetailComponent — ficha', () => {
  const setup = (id: string | null, findOne = vi.fn().mockResolvedValue(record())) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: routeWith(id) },
        { provide: MuestraService, useValue: { findOne, update: vi.fn(), remove: vi.fn() } },
        // el componente se declara como proveedor: sin plantilla que renderizar,
        // TestBed.inject basta para ejercitar su lógica de carga
        MuestraDetailComponent
      ]
    })
    return { component: TestBed.inject(MuestraDetailComponent), findOne }
  }

  beforeEach(() => TestBed.resetTestingModule())

  it('carga el registro del id de la ruta', async () => {
    const { component, findOne } = setup(record().id)
    await component.load()

    expect(findOne).toHaveBeenCalledWith(record().id)
    expect(component.muestra()).toEqual(record())
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

    expect(component.format({ ...record(), codigo: null } as never, { key: 'codigo', label: 'x' })).toBe('—')
  })
})
