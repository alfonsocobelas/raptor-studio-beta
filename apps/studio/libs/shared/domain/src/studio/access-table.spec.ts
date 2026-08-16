import type { DraftResource } from './draft-resource'
import {
  ACCESS_CRUD_COLUMNS,
  accessRows,
  applyColumn,
  copyRoleAccess,
  roleSummary,
  toggleCapability
} from './access-table'

const cliente = (): DraftResource => ({
  name: 'cliente',
  plural: 'clientes',
  labelSingular: 'Cliente',
  labelPlural: 'Clientes',
  gender: 'm',
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'string' },
    { name: 'email', label: 'Email', type: 'string' }
  ]
})

const muestra = (): DraftResource => ({
  name: 'muestra',
  plural: 'muestras',
  labelSingular: 'Muestra',
  labelPlural: 'Muestras',
  gender: 'f',
  fields: [
    { name: 'punto', label: 'Punto', type: 'ref', refTo: 'cliente' },
    { name: 'estado', label: 'Estado', type: 'enum', values: [{ value: 'draft', label: 'Borrador' }] }
  ],
  state: {
    field: 'estado',
    initial: 'draft',
    transitions: [{ name: 'validate', label: 'Validar', from: ['draft'], to: 'valid' }]
  },
  access: { view: ['user', 'viewer'], create: ['user'], edit: ['user'], delete: [], transitions: { validate: ['user'] } }
})

describe('accessRows', () => {
  it('builds one row per entity with the four CRUD cells plus its transitions', () => {
    const rows = accessRows([cliente(), muestra()])

    expect(rows).toHaveLength(2)
    expect(rows[0].cells.map(c => c.capability)).toEqual(['view', 'create', 'edit', 'delete'])
    expect(rows[1].cells.map(c => c.capability)).toEqual(['view', 'create', 'edit', 'delete', 'validate'])
    expect(rows[1].cells[4].kind).toBe('transition')
    expect(rows[1].cells[4].label).toBe('Validar')
  })

  it('resolves effective roles per cell (defaults when access is absent)', () => {
    const [row] = accessRows([cliente()])

    expect(row.cells.find(c => c.capability === 'view')?.roles).toEqual(['user', 'viewer'])
    expect(row.cells.find(c => c.capability === 'delete')?.roles).toEqual(['user'])
  })

  it('derives the subtitle from real design facts', () => {
    const rows = accessRows([cliente(), muestra()])

    expect(rows[0].subtitle).toBe('2 campos')
    expect(rows[1].subtitle).toBe('2 campos · rel. Clientes · máquina de estados')
  })

  it('exposes the four CRUD column headers', () => {
    expect(ACCESS_CRUD_COLUMNS.map(c => c.capability)).toEqual(['view', 'create', 'edit', 'delete'])
    expect(ACCESS_CRUD_COLUMNS.map(c => c.label)).toEqual(['Ver', 'Crear', 'Editar', 'Borrar'])
  })
})

describe('toggleCapability', () => {
  it('returns the full explicit matrix with the capability flipped on', () => {
    const next = toggleCapability(cliente(), 'delete', 'viewer')

    expect(next).toEqual({
      view: ['user', 'viewer'],
      create: ['user'],
      edit: ['user'],
      delete: ['user', 'viewer']
    })
  })

  it('omits the transitions key when the entity has no state machine', () => {
    expect('transitions' in toggleCapability(cliente(), 'view', 'viewer')).toBe(false)
  })

  it('flips a granted capability off', () => {
    const next = toggleCapability(muestra(), 'create', 'user')

    expect(next.create).toEqual([])
    expect(next.delete).toEqual([])
  })

  it('toggles a transition verb and keeps role order stable user→viewer', () => {
    const resource = muestra()
    const next = toggleCapability(resource, 'validate', 'viewer')

    expect(next.transitions).toEqual({ validate: ['user', 'viewer'] })
  })

  it('never emits the legacy manage key', () => {
    const next = toggleCapability(cliente(), 'view', 'viewer')

    expect('manage' in next).toBe(false)
  })
})

describe('roleSummary', () => {
  it('counts visible entities and write capabilities for a role', () => {
    const summary = roleSummary([cliente(), muestra()], 'user')

    expect(summary).toEqual({ total: 2, view: 2, create: 2, edit: 2, delete: 1 })
  })

  it('admin sees and can do everything', () => {
    const summary = roleSummary([cliente(), muestra()], 'admin')

    expect(summary).toEqual({ total: 2, view: 2, create: 2, edit: 2, delete: 2 })
  })

  it('viewer with the default policy only views', () => {
    const summary = roleSummary([cliente()], 'viewer')

    expect(summary).toEqual({ total: 1, view: 1, create: 0, edit: 0, delete: 0 })
  })
})

describe('applyColumn', () => {
  it('grant-view turns the view capability on for the role', () => {
    const resource = { ...cliente(), access: { view: ['user' as const] } }

    expect(applyColumn(resource, 'viewer', 'grant-view').view).toEqual(['user', 'viewer'])
  })

  it('revoke-writes clears create, edit, delete and transitions for the role', () => {
    const next = applyColumn(muestra(), 'user', 'revoke-writes')

    expect(next.view).toEqual(['user', 'viewer'])
    expect(next.create).toEqual([])
    expect(next.edit).toEqual([])
    expect(next.delete).toEqual([])
    expect(next.transitions).toEqual({ validate: [] })
  })

  it('revoke-writes does not touch the other role', () => {
    const resource = { ...muestra(), access: { edit: ['user' as const, 'viewer' as const] } }

    expect(applyColumn(resource, 'viewer', 'revoke-writes').edit).toEqual(['user'])
  })
})

describe('copyRoleAccess', () => {
  it('copies every capability of one role onto another', () => {
    const next = copyRoleAccess(muestra(), 'user', 'viewer')

    expect(next.view).toEqual(['user', 'viewer'])
    expect(next.create).toEqual(['user', 'viewer'])
    expect(next.edit).toEqual(['user', 'viewer'])
    expect(next.delete).toEqual([])
    expect(next.transitions).toEqual({ validate: ['user', 'viewer'] })
  })

  it('removes what the source role does not have', () => {
    const resource = { ...cliente(), access: { view: ['viewer' as const], create: ['viewer' as const] } }

    const next = copyRoleAccess(resource, 'user', 'viewer')

    expect(next.view).toEqual([])
    expect(next.create).toEqual([])
  })
})
