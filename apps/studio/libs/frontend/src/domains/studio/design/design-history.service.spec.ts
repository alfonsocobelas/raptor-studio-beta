import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { DesignStore } from './design-store'
import { ACTIVE_DESIGN_KEY, DesignHistoryService } from './design-history.service'

/**
 * Spec 21, TASK-03: el borrador no se pierde. Autosave con reposo (una escritura
 * por ráfaga), restauración al arrancar por el gate (applyExternal) y cambio de
 * diseño guardando lo pendiente. El activo vive en localStorage (estado de
 * ventana); los diseños, en disco (estado del proyecto).
 */
describe('DesignHistoryService', () => {
  let http: HttpTestingController
  let store: DesignStore

  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
    http = TestBed.inject(HttpTestingController)
    store = TestBed.inject(DesignStore)
  })
  afterEach(() => {
    vi.useRealTimers()
    http.verify()
  })

  /** El effect corre en el tick y el debounce con timers falsos. */
  const settle = (): void => {
    TestBed.tick()
    vi.advanceTimersByTime(1100)
  }

  /** Deja correr las continuaciones de las promesas (los timers están congelados). */
  const microtasks = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  }

  it('una ráfaga de mutaciones emite UNA sola escritura tras el reposo', async () => {
    const service = TestBed.inject(DesignHistoryService)
    TestBed.tick()

    store.addResource('Pedido')
    TestBed.tick()
    store.addResource('Cliente')
    settle()

    const put = http.expectOne(req => req.method === 'PUT' && req.url.startsWith('/api/v1/studio/designs/'))
    expect((put.request.body as { resources: unknown[] }).resources).toHaveLength(2)
    put.flush({ slug: 'mi-app' })
    await microtasks()
    expect(service.saveState()).toBe('saved')
  })

  it('el primer guardado deriva el slug del appName y lo fija como activo', async () => {
    TestBed.inject(DesignHistoryService)
    TestBed.tick()

    store.setAppName('VetCare 2')
    TestBed.tick()
    store.addResource('Paciente')
    settle()

    const put = http.expectOne(req => req.method === 'PUT')
    expect(put.request.url).toBe('/api/v1/studio/designs/vetcare-2')
    put.flush({ slug: 'vetcare-2' })
    await microtasks()
    expect(localStorage.getItem(ACTIVE_DESIGN_KEY)).toBe('vetcare-2')
  })

  it('al arrancar restaura el diseño activo por el gate', async () => {
    localStorage.setItem(ACTIVE_DESIGN_KEY, 'vetcare')
    const service = TestBed.inject(DesignHistoryService)

    const started = service.init()
    http.expectOne('/api/v1/studio/designs/vetcare').flush({
      appName: 'vetcare',
      resources: [
        {
          name: 'paciente',
          plural: 'pacientes',
          labelSingular: 'Paciente',
          labelPlural: 'Pacientes',
          gender: 'm',
          fields: [{ name: 'nombre', label: 'Nombre', type: 'string' }]
        }
      ],
      pages: []
    })
    await microtasks()
    http.expectOne('/api/v1/studio/designs').flush([])
    await started

    expect(store.appName()).toBe('vetcare')
    expect(store.resources().map(r => r.name)).toEqual(['paciente'])
  })

  it('un diseño corrupto o inválido deja el lienzo vacío con el motivo, sin romper', async () => {
    localStorage.setItem(ACTIVE_DESIGN_KEY, 'roto')
    const service = TestBed.inject(DesignHistoryService)

    const started = service.init()
    http
      .expectOne('/api/v1/studio/designs/roto')
      .flush({ message: 'El diseño «roto» está corrupto' }, { status: 400, statusText: 'Bad Request' })
    await microtasks()
    http.expectOne('/api/v1/studio/designs').flush([])
    await started

    expect(store.resources()).toEqual([])
    expect(service.saveState()).toBe('error')
    expect(service.lastProblem()).toContain('roto')
  })

  it('cambiar de diseño guarda lo pendiente antes de cargar el nuevo', async () => {
    const service = TestBed.inject(DesignHistoryService)
    TestBed.tick()
    store.addResource('Pedido')
    TestBed.tick()

    const switched = service.select('boutique')
    // primero la escritura de lo pendiente…
    http.expectOne(req => req.method === 'PUT').flush({ slug: 'mi-app' })
    await microtasks()
    // …después la carga del nuevo y el refresco de la lista
    http.expectOne('/api/v1/studio/designs/boutique').flush({ appName: 'boutique', resources: [], pages: [] })
    await microtasks()
    http.expectOne('/api/v1/studio/designs').flush([])
    await switched

    expect(store.appName()).toBe('boutique')
    expect(localStorage.getItem(ACTIVE_DESIGN_KEY)).toBe('boutique')
  })
})
