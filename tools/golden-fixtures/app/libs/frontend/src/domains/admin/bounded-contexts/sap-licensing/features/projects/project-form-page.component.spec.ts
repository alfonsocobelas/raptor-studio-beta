import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { vi } from 'vitest'
import { ProjectFormPageComponent } from './project-form-page.component'
import { ProjectService } from '../../../../../../core/services/project.service'
import { CustomerService } from '../../../../../../core/services/customer.service'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AuthService } from '../../../../../../core/services/auth.service'

const routeWith = (id: string | null) => ({ snapshot: { paramMap: { get: () => id } } })

const RECORD_ID = '019eb800-0000-7000-8000-000000000001'

describe('ProjectFormPageComponent — página-formulario', () => {
  const setup = (id: string | null, findOne = vi.fn().mockResolvedValue({ id: RECORD_ID })) => {
    const service = {
      findOne,
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined)
    }
    const router = { navigate: vi.fn() }
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: routeWith(id) },
        { provide: ProjectService, useValue: service },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: AuthService, useValue: { canWrite: () => true } },
        {
          provide: CustomerService,
          useValue: { lookup: () => Promise.resolve([]), findOne: () => new Promise(() => undefined) }
        },
        // el componente se declara como proveedor: sin plantilla que renderizar,
        // TestBed.inject basta para ejercitar la lógica de carga y guardado
        ProjectFormPageComponent
      ]
    })
    return { component: TestBed.inject(ProjectFormPageComponent), findOne, service, router }
  }

  beforeEach(() => TestBed.resetTestingModule())

  it('sin id en la ruta nace en modo alta y no carga nada', () => {
    const { component, findOne } = setup(null)

    expect(component.editingId()).toBeNull()
    expect(findOne).not.toHaveBeenCalled()
  })

  it('con id carga el registro y queda en modo edición', async () => {
    const { component, findOne } = setup(RECORD_ID)
    await component.load(RECORD_ID)

    expect(findOne).toHaveBeenCalledWith(RECORD_ID)
    expect(component.editingId()).toBe(RECORD_ID)
    expect(component.notFound()).toBe(false)
    expect(component.loading()).toBe(false)
  })

  it('un registro inexistente marca notFound', async () => {
    const { component } = setup(RECORD_ID, vi.fn().mockRejectedValue({ status: 404 }))
    await component.load(RECORD_ID)

    expect(component.notFound()).toBe(true)
    expect(component.loading()).toBe(false)
  })

  it('con el form inválido guardar no llama al service', async () => {
    const { component, service } = setup(null)
    await component.save()

    expect(service.create).not.toHaveBeenCalled()
    expect(service.update).not.toHaveBeenCalled()
  })
})
