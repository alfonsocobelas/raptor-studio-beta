import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { vi } from 'vitest'
import { ContractDto } from '@sap-licenses/shared/domain'
import { ContractDetailComponent } from './contract-detail.component'
import { ContractService } from '../../../../../../core/services/contract.service'

const routeWith = (id: string | null) => ({ snapshot: { paramMap: { get: () => id } } })

/**
 * Registro mínimo declarado aquí y no importado de mocks/: el generador de app
 * reubica los mocks junto al servicio (core/services/mocks), así que una ruta
 * relativa desde la pantalla se rompe según el layout.
 */
const record = () =>
  ({ id: '019eb800-0000-7000-8000-000000000001', contractNumber: 'Registro de prueba' }) as unknown as ContractDto

describe('ContractDetailComponent — ficha', () => {
  const setup = (id: string | null, findOne = vi.fn().mockResolvedValue(record())) => {
    const service = { findOne, update: vi.fn(), remove: vi.fn(), terminate: vi.fn().mockResolvedValue(undefined) }
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: routeWith(id) },
        { provide: ContractService, useValue: service },
        // el componente se declara como proveedor: sin plantilla que renderizar,
        // TestBed.inject basta para ejercitar su lógica de carga
        ContractDetailComponent
      ]
    })
    return { component: TestBed.inject(ContractDetailComponent), findOne, service }
  }

  beforeEach(() => TestBed.resetTestingModule())

  it('carga el registro del id de la ruta', async () => {
    const { component, findOne } = setup(record().id)
    await component.load()

    expect(findOne).toHaveBeenCalledWith(record().id)
    expect(component.contract()).toEqual(record())
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

    expect(
      component.format({ ...record(), contractNumber: null } as never, { key: 'contractNumber', label: 'x' })
    ).toBe('—')
  })

  it('la transición «Terminar» llama al verbo del servicio y recarga la ficha', async () => {
    const { component, findOne, service } = setup(record().id)

    await component.terminate(record().id)

    expect(service.terminate).toHaveBeenCalledWith(record().id)
    // la carga del constructor más la recarga tras transicionar
    expect(findOne).toHaveBeenCalledTimes(2)
    expect(component.transitioning()).toBe(false)
  })
})
