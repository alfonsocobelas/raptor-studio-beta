import { FakeChatAdapter } from '@app/backend/contexts/studio/chat/fake-chat.adapter'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'

const empty = (): DesignPayload => ({ appName: 'mi-app', resources: [], pages: [] })

describe('FakeChatAdapter — modo demo determinista (lienzo en blanco)', () => {
  const adapter = new FakeChatAdapter()

  it('crea una tabla NUEVA con campos tipados inferidos', async () => {
    const { design, reply } = await adapter.propose(
      [{ role: 'user', text: 'Crea una tabla de empleados con nombre, salario y fecha de alta' }],
      empty()
    )

    expect(design.resources).toHaveLength(1)
    const fields = design.resources[0].fields
    expect(fields.map(f => f.type)).toEqual(['string', 'number', 'date'])
    expect(design.pages).toContainEqual({ kind: 'resource', resource: 'empleado' })
    expect(reply).toContain('Empleados')
  })

  it('añade un KPI de una entidad existente (creando el dashboard)', async () => {
    const base = await adapter.propose([{ role: 'user', text: 'crea una tabla de vehiculos' }], empty())

    const { design } = await adapter.propose([{ role: 'user', text: 'añade un kpi de vehiculos' }], base.design)

    expect(design.pages[0]).toMatchObject({ kind: 'dashboard' })
  })

  it('quita una tabla y limpia sus KPIs', async () => {
    const a = await adapter.propose([{ role: 'user', text: 'crea una tabla de vehiculos' }], empty())
    const b = await adapter.propose([{ role: 'user', text: 'añade un kpi de vehiculos' }], a.design)

    const { design } = await adapter.propose([{ role: 'user', text: 'quita la tabla de vehiculos' }], b.design)

    expect(design.resources).toEqual([])
    expect(design.pages).toEqual([])
  })

  it('si no entiende, devuelve el diseño intacto con ayuda', async () => {
    const original = empty()
    const { design, reply } = await adapter.propose([{ role: 'user', text: 'hazme un sandwich' }], original)

    expect(design).toEqual(original)
    expect(reply).toContain('Modo demo')
  })
})
