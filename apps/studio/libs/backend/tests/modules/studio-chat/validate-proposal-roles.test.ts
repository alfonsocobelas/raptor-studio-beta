import { validateDesign } from '@app/backend/contexts/studio/chat/validate-proposal'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'

/** Spec 76: los roles del diseño amplían los otorgables de la matriz en el gate del chat. */
const design = (over: Partial<DesignPayload>): DesignPayload => ({
  appName: 'clinica',
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
  pages: [{ title: 'Pacientes', blocks: [{ kind: 'table', resource: 'paciente' }] }],
  ...over
})

describe('validateDesign — roles personalizados (spec 76)', () => {
  const conAcceso = (roles?: DesignPayload['roles']): DesignPayload => {
    const base = design({ roles })
    base.resources[0].access = { view: ['user', 'perito'], create: [], edit: [], delete: [] }
    return base
  }

  it('la matriz puede otorgar a un rol declarado en el diseño', () => {
    expect(() => validateDesign(conAcceso([{ name: 'perito', label: 'Perito' }]))).not.toThrow()
  })

  it('un rol NO declarado se rechaza con el mensaje del schema', () => {
    expect(() => validateDesign(conAcceso())).toThrow(/perito.*not a grantable role/s)
  })

  it('unos roles mal formados se rechazan enteros (mismo gate que defineApp)', () => {
    expect(() => validateDesign(design({ roles: [{ name: 'admin', label: 'Jefe' }] }))).toThrow(/reserved/)
  })
})
