import { DesignStore } from './design-store'

/**
 * Spec 22, TASK-03: el brief vive en el store como cualquier otra pieza del diseño — editable,
 * viaja en el export y se restaura con applyExternal. Fichero propio para no pisar el spec del
 * store que otra sesión tiene en vuelo.
 */
describe('DesignStore — brief de negocio (spec 22)', () => {
  let store: DesignStore

  beforeEach(() => {
    store = new DesignStore()
  })

  it('setBrief guarda un brief válido y lo expone', () => {
    const ok = store.setBrief({ business: 'Clínica veterinaria de barrio.', rules: ['Las citas duran 30 minutos'] })

    expect(ok).toBe(true)
    expect(store.brief()?.business).toContain('veterinaria')
    expect(store.lastError()).toBeNull()
  })

  it('setBrief rechaza los topes del schema y conserva el anterior', () => {
    store.setBrief({ business: 'Negocio válido.' })

    const ok = store.setBrief({ business: 'x'.repeat(1201) })

    expect(ok).toBe(false)
    expect(store.brief()?.business).toBe('Negocio válido.')
    expect(store.lastError()).toContain('brief.business')
  })

  it('setBrief(undefined) lo borra', () => {
    store.setBrief({ business: 'Algo.' })

    expect(store.setBrief(undefined)).toBe(true)
    expect(store.brief()).toBeUndefined()
  })

  it('setResourceBrief deja la frase en la entidad y respeta su tope', () => {
    store.addResource('Paciente')

    expect(store.setResourceBrief('paciente', 'Un paciente de la clínica; su historial vive aquí.')).toBe(true)
    expect(store.resources()[0].brief).toContain('historial')

    expect(store.setResourceBrief('paciente', 'x'.repeat(501))).toBe(false)
    expect(store.resources()[0].brief).toContain('historial')
  })

  it('setResourceBrief con texto vacío la quita', () => {
    store.addResource('Paciente')
    store.setResourceBrief('paciente', 'Una frase.')

    expect(store.setResourceBrief('paciente', '   ')).toBe(true)
    expect(store.resources()[0].brief).toBeUndefined()
  })

  it('el export lleva el brief de la app (el de entidad viaja al expandir, TASK-04)', () => {
    store.addPage('table', 'Pacientes')
    store.setBrief({ business: 'Clínica veterinaria.' })

    const exported = JSON.parse(store.exportJson()) as { brief?: { business: string } }

    expect(exported.brief?.business).toBe('Clínica veterinaria.')
  })

  it('applyExternal restaura el brief que venga en el diseño', () => {
    const ok = store.applyExternal({
      appName: 'vetcare',
      resources: [],
      pages: [],
      brief: { business: 'Contado por el chat.' }
    })

    expect(ok).toBe(true)
    expect(store.brief()?.business).toBe('Contado por el chat.')
  })

  it('applyExternal sin brief lo deja vacío: el diseño externo es la verdad completa', () => {
    store.setBrief({ business: 'Anterior.' })

    store.applyExternal({ appName: 'x', resources: [], pages: [] })

    expect(store.brief()).toBeUndefined()
  })

  it('applyExternal con un brief fuera de tope se rechaza entero', () => {
    const ok = store.applyExternal({
      appName: 'x',
      resources: [],
      pages: [],
      brief: { business: 'x'.repeat(1201) }
    })

    expect(ok).toBe(false)
    expect(store.lastError()).toContain('brief.business')
  })
})
