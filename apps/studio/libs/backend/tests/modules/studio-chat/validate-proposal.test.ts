import { validateDesign } from '@app/backend/contexts/studio/chat/validate-proposal'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'

const vehiculo = {
  name: 'vehiculo',
  plural: 'vehiculos',
  labelSingular: 'Vehículo',
  labelPlural: 'Vehículos',
  gender: 'm' as const,
  fields: [{ name: 'matricula', label: 'Matrícula', type: 'string' as const }]
}

describe('validateDesign — gate determinista del diseño', () => {
  it('acepta un diseño válido con entidades nuevas', () => {
    const design: DesignPayload = {
      appName: 'flotas',
      resources: [vehiculo],
      pages: [{ title: 'Vehículos', blocks: [{ kind: 'table', resource: 'vehiculo' }] }]
    }

    expect(() => validateDesign(design)).not.toThrow()
  })

  it('acepta un lienzo vacío (estado válido de diseño)', () => {
    expect(() => validateDesign({ appName: 'x', resources: [], pages: [] })).not.toThrow()
  })

  it('rechaza páginas que referencian entidades no declaradas', () => {
    const design: DesignPayload = {
      appName: 'flotas',
      resources: [vehiculo],
      pages: [{ title: 'Rota', blocks: [{ kind: 'table', resource: 'fantasma' }] }]
    }

    expect(() => validateDesign(design)).toThrow(/entidad inexistente: fantasma/)
  })

  it('rechaza entidades cuyo draft no expande a un resource-schema válido', () => {
    const design: DesignPayload = {
      appName: 'flotas',
      resources: [{ ...vehiculo, name: 'Mal Nombre' }],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow()
  })
})
