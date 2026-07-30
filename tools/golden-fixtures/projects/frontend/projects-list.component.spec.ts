import { provideZonelessChangeDetection, signal } from '@angular/core'
import { Router } from '@angular/router'
import { render, screen } from '@testing-library/angular'
import { vi } from 'vitest'
import { toast } from '@spartan-ng/brain/sonner'
import { ProjectDto } from '@sap-licenses/shared/domain'
import { ProjectMother } from '../../../../../../../tests/mothers/project.mother'
import { OffsetPaginatedOutput, ProjectService } from '../../../../../../core/services/project.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { ProjectFormValue } from './project-dialog.component'
import { ProjectsListComponent } from './projects-list.component'

vi.mock('../../../../../../shared/utils/download-file', () => ({ downloadBlob: vi.fn() }))

vi.mock('@spartan-ng/brain/sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

interface MockState {
  loading?: boolean
  error?: unknown
  value?: OffsetPaginatedOutput<ProjectDto>
}

type Spy = ReturnType<typeof vi.fn>

const paginated = (items: ProjectDto[]): OffsetPaginatedOutput<ProjectDto> => ({
  total: items.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items
})

const mockService = (
  state: MockState,
  spies: { create?: Spy; update?: Spy; remove?: Spy; export?: Spy; resetRequest?: Spy } = {}
) =>
  ({
    request: signal({ page: 1, pageSize: 10 }),
    resetRequest: spies.resetRequest ?? vi.fn(),
    projects: {
      isLoading: signal(state.loading ?? false),
      error: signal(state.error),
      value: signal(state.value)
    },
    create: spies.create ?? vi.fn(),
    update: spies.update ?? vi.fn(),
    remove: spies.remove ?? vi.fn(),
    export: spies.export ?? vi.fn().mockResolvedValue({ blob: new Blob(['x']), filename: 'proyectos-20260707.csv' })
  }) as unknown as ProjectService

const routerMock = (previousUrl?: string) => ({
  navigate: vi.fn(),
  getCurrentNavigation: () =>
    previousUrl ? { previousNavigation: { finalUrl: { toString: () => previousUrl } } } : null
})

const renderList = (
  state: MockState,
  spies: { create?: Spy; update?: Spy; remove?: Spy; export?: Spy; resetRequest?: Spy } = {},
  previousUrl?: string,
  canWrite = true
) =>
  render(ProjectsListComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: ProjectService, useValue: mockService(state, spies) },
      { provide: Router, useValue: routerMock(previousUrl) },
      { provide: AuthService, useValue: { canWrite: signal(canWrite) } }
    ]
  })

const formValue = (overrides: Partial<ProjectFormValue> = {}): ProjectFormValue => ({
  name: 'S/4HANA Rollout',
  customerId: '019eb713-19bb-7000-8000-0000000000a1',
  customerName: 'Acme Corp',
  description: '',
  startDate: '2026-01-15',
  endDate: '2026-12-31',
  status: 'active' as ProjectFormValue['status'],
  implementer: 'AVVALE' as ProjectFormValue['implementer'],
  ...overrides
})

describe('ProjectsListComponent', () => {
  // El backend ya devuelve 403 a un viewer que intente escribir; esto evita ofrecerle acciones que
  // solo pueden acabar en error.
  it('hides the write actions from a viewer', async () => {
    await renderList({ value: paginated(ProjectMother.list(1)) }, {}, undefined, false)

    expect(screen.queryByRole('button', { name: /nuevo proyecto/i })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  })

  it('shows the write actions to a user who can write', async () => {
    await renderList({ value: paginated(ProjectMother.list(1)) })

    expect(screen.getByRole('button', { name: /nuevo proyecto/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
  })

  beforeEach(() => vi.clearAllMocks())

  it('resets the service request on init when entering from outside the section', async () => {
    const resetRequest = vi.fn()
    await renderList({ value: paginated(ProjectMother.list(1)) }, { resetRequest }, '/sap-licensing/customers')
    expect(resetRequest).toHaveBeenCalledTimes(1)
  })

  it('keeps the service request when staying inside the projects section', async () => {
    const resetRequest = vi.fn()
    await renderList({ value: paginated(ProjectMother.list(1)) }, { resetRequest }, '/sap-licensing/projects')
    expect(resetRequest).not.toHaveBeenCalled()
  })

  it('always shows the page heading', async () => {
    await renderList({ value: paginated(ProjectMother.list(1)) })
    expect(screen.getByText('Proyectos')).toBeTruthy()
  })

  it('exports from the backend and downloads the returned file', async () => {
    const exportSpy = vi.fn().mockResolvedValue({ blob: new Blob(['x']), filename: 'proyectos-20260707.xlsx' })
    const { fixture } = await renderList({ value: paginated(ProjectMother.list(1)) }, { export: exportSpy })

    await fixture.componentInstance.onExport('xlsx')

    expect(exportSpy).toHaveBeenCalledWith('xlsx')
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'proyectos-20260707.xlsx')
  })

  it('shows the loading state while fetching', async () => {
    await renderList({ loading: true })
    expect(screen.getByText('Cargando proyectos…')).toBeTruthy()
  })

  it('shows the error state when the request fails', async () => {
    await renderList({ error: new Error('boom') })
    expect(screen.getByText('No se pudieron cargar los proyectos')).toBeTruthy()
  })

  it('shows the empty state when there are no projects', async () => {
    await renderList({ value: paginated([]) })
    expect(screen.getByText('No hay proyectos registrados')).toBeTruthy()
  })

  it('shows the data table with projects when data is available', async () => {
    const projects = ProjectMother.list(2)
    await renderList({ value: paginated(projects) })

    expect(screen.getByText(projects[0].name)).toBeTruthy()
    expect(screen.getByText(projects[1].name)).toBeTruthy()
  })

  it('updates the request page on onPage', async () => {
    const { fixture } = await renderList({ value: paginated(ProjectMother.list(1)) })
    const cmp = fixture.componentInstance

    cmp.onPage(3)

    expect(cmp.currentPage()).toBe(3)
  })

  it('resets to page 1 and stores the order on onSort', async () => {
    const { fixture } = await renderList({ value: paginated(ProjectMother.list(1)) })
    const cmp = fixture.componentInstance

    cmp.onSort({ orderBy: 'name', orderType: 'desc' })

    expect(cmp.currentPage()).toBe(1)
    expect(cmp.sortColumn()).toBe('name')
    expect(cmp.sortDirection()).toBe('desc')
  })

  it('resets to page 1 and stores the term (undefined when cleared) on onSearch', async () => {
    const { fixture } = await renderList({ value: paginated(ProjectMother.list(1)) })
    const cmp = fixture.componentInstance
    cmp.onPage(3)

    cmp.onSearch('acme')
    expect(cmp.currentPage()).toBe(1)
    expect(cmp.search()).toBe('acme')

    cmp.onSearch('')
    expect(cmp.search()).toBe('')
  })

  it('keeps the table mounted when a search yields zero results', async () => {
    const { fixture } = await renderList({ value: paginated([]) })
    fixture.componentInstance.onSearch('zzz')
    fixture.detectChanges()

    expect(screen.queryByText('No hay proyectos registrados')).toBeNull()
    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('marks the allowlisted columns as filterable, badges included', async () => {
    const { fixture } = await renderList({ value: paginated(ProjectMother.list(1)) })
    const filterableOf = (key: string) => fixture.componentInstance.columns.find(c => c.key === key)?.filterable

    // In PROJECT allowed filters → opt-in filterable (badges filter by eq through the dropdown).
    expect(filterableOf('name')).toBe(true)
    expect(filterableOf('customerName')).toBe(true)
    expect(filterableOf('status')).toBe(true)
    expect(filterableOf('implementer')).toBe(true)
    expect(filterableOf('origin')).toBe(true)
    // Dates stay out (range filters are deferred; free text would not match the DB value).
    expect(filterableOf('startDate')).not.toBe(true)
    expect(filterableOf('endDate')).not.toBe(true)
  })

  it('onFilters sets the filters and resets to page 1, keeping the active order', async () => {
    const { fixture } = await renderList({ value: paginated(ProjectMother.list(1)) })
    const cmp = fixture.componentInstance
    cmp.onPage(3)
    cmp.onSort({ orderBy: 'name', orderType: 'asc' })

    const filters = [{ column: 'status', columnLabel: 'Estado', operator: 'eq', value: 'active' }]
    cmp.onFilters(filters)

    expect(cmp.currentPage()).toBe(1)
    expect(cmp.hasActiveFilters()).toBe(true)
    expect(cmp.sortColumn()).toBe('name')
  })

  it('keeps the table mounted when a filter yields zero results (so filters stay reachable)', async () => {
    const { fixture } = await renderList({ value: paginated([]) })
    fixture.componentInstance.onFilters([{ column: 'status', columnLabel: 'Estado', operator: 'eq', value: 'closed' }])
    fixture.detectChanges()

    // The full-replacement message would hide the toolbar, trapping the user with an unclearable filter.
    expect(screen.queryByText('No hay proyectos registrados')).toBeNull()
    expect(screen.getByText('Filtros')).toBeTruthy()
    expect(screen.getByText('No se encontraron registros')).toBeTruthy()
  })

  it('renders the status badge label', async () => {
    const project = ProjectMother.one({ status: 'active' as ProjectDto['status'] })
    await renderList({ value: paginated([project]) })

    expect(screen.getByText('Activo')).toBeTruthy()
  })

  it('renders the implementer badge label', async () => {
    const project = ProjectMother.one({ implementer: 'THIRD_PARTY' as ProjectDto['implementer'] })
    await renderList({ value: paginated([project]) })

    expect(screen.getByText('Tercero')).toBeTruthy()
  })

  it('renders the origin badge: SAP for ME_SAP projects (spec 46)', async () => {
    const project = ProjectMother.one({ origin: 'ME_SAP' as ProjectDto['origin'], sapProjectId: '100001' })
    await renderList({ value: paginated([project]) })

    expect(screen.getByText('SAP')).toBeTruthy()
  })

  it('renders the origin badge: Manual for MANUAL projects (spec 46)', async () => {
    const project = ProjectMother.one({ origin: 'MANUAL' as ProjectDto['origin'] })
    await renderList({ value: paginated([project]) })

    expect(screen.getByText('Manual')).toBeTruthy()
  })

  it('renders a dash for a null startDate (ME_SAP without kickOffDate, spec 46)', async () => {
    const project = ProjectMother.one({
      origin: 'ME_SAP' as ProjectDto['origin'],
      startDate: null,
      endDate: null
    })
    await renderList({ value: paginated([project]) })

    // startDate y endDate null → ambos guion (celdas date, convención spec 40)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })

  it('hides the delete action for ME_SAP rows and keeps it for MANUAL ones (spec 46)', async () => {
    const meSap = ProjectMother.one({
      id: '019eb713-19bb-7000-8000-000000000046',
      name: 'Procurement (100001)',
      origin: 'ME_SAP' as ProjectDto['origin'],
      sapProjectId: '100001'
    })
    const manual = ProjectMother.one({ origin: 'MANUAL' as ProjectDto['origin'] })
    await renderList({ value: paginated([meSap, manual]) })

    expect(screen.getAllByLabelText('Editar')).toHaveLength(2)
    expect(screen.getAllByLabelText('Eliminar')).toHaveLength(1)
  })

  it('onSave for an ME_SAP project updates only the manual fields (spec 46)', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const meSap = ProjectMother.one({ origin: 'ME_SAP' as ProjectDto['origin'], sapProjectId: '100001' })
    const { fixture } = await renderList({ value: paginated([meSap]) }, { update })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: meSap as unknown as Record<string, unknown> })
    await cmp.onSave(
      formValue({ description: 'Nota del KAM', implementer: 'THIRD_PARTY' as ProjectFormValue['implementer'] })
    )

    expect(update).toHaveBeenCalledWith(meSap.id, { description: 'Nota del KAM', implementer: 'THIRD_PARTY' })
  })

  it('the "edit" action selects the project and opens the dialog', async () => {
    const project = ProjectMother.one()
    const { fixture } = await renderList({ value: paginated([project]) })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: project as unknown as Record<string, unknown> })

    expect(cmp.dialogOpen()).toBe(true)
    expect(cmp.editingProject()).toEqual(project)
  })

  it('the "delete" action selects the project and opens the confirmation', async () => {
    const project = ProjectMother.one()
    const { fixture } = await renderList({ value: paginated([project]) })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'delete', row: project as unknown as Record<string, unknown> })

    expect(cmp.deleteDialogOpen()).toBe(true)
    expect(cmp.deletingProject()).toEqual(project)
  })

  it('openCreate opens the dialog in create mode', async () => {
    const { fixture } = await renderList({ value: paginated([]) })
    const cmp = fixture.componentInstance

    cmp.openCreate()

    expect(cmp.dialogOpen()).toBe(true)
    expect(cmp.editingProject()).toBeNull()
  })

  it('onSave creates a new project and shows a success toast', async () => {
    const create = vi.fn().mockResolvedValue(undefined)
    const { fixture } = await renderList({ value: paginated([]) }, { create })
    const cmp = fixture.componentInstance

    cmp.openCreate()
    await cmp.onSave(formValue())

    expect(create).toHaveBeenCalledOnce()
    expect(create.mock.calls[0][0]).toMatchObject({ name: 'S/4HANA Rollout' })
    expect(toast.success).toHaveBeenCalledWith('Proyecto creado correctamente')
  })

  it('onSave updates the editing project and shows a success toast', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const project = ProjectMother.one()
    const { fixture } = await renderList({ value: paginated([project]) }, { update })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'edit', row: project as unknown as Record<string, unknown> })
    await cmp.onSave(formValue({ name: 'Renamed' }))

    expect(update).toHaveBeenCalledWith(project.id, expect.objectContaining({ name: 'Renamed' }))
    expect(toast.success).toHaveBeenCalledWith('Proyecto actualizado correctamente')
  })

  it('confirmDelete removes the selected project and shows a success toast', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    const project = ProjectMother.one()
    const { fixture } = await renderList({ value: paginated([project]) }, { remove })
    const cmp = fixture.componentInstance

    cmp.onAction({ action: 'delete', row: project as unknown as Record<string, unknown> })
    await cmp.confirmDelete()

    expect(remove).toHaveBeenCalledWith(project.id)
    expect(toast.success).toHaveBeenCalledWith('Proyecto eliminado')
  })

  it('confirmDelete does nothing when no project is selected', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    const { fixture } = await renderList({ value: paginated([]) }, { remove })
    const cmp = fixture.componentInstance

    await cmp.confirmDelete()

    expect(remove).not.toHaveBeenCalled()
  })
})
