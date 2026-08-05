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

  it('acepta una referencia a una entidad declarada', () => {
    const design: DesignPayload = {
      appName: 'vetcare',
      resources: [
        vehiculo,
        {
          ...vehiculo,
          name: 'cita',
          plural: 'citas',
          labelSingular: 'Cita',
          labelPlural: 'Citas',
          fields: [
            { name: 'motivo', label: 'Motivo', type: 'string' as const },
            { name: 'vehiculo', label: 'Vehículo', type: 'ref' as const, refTo: 'vehiculo' }
          ]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).not.toThrow()
  })

  it('rechaza una referencia a una entidad que no existe: sería una FK rota', () => {
    const design: DesignPayload = {
      appName: 'vetcare',
      resources: [
        {
          ...vehiculo,
          fields: [{ name: 'duenio', label: 'Dueño', type: 'ref' as const, refTo: 'fantasma' }]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/vehiculo.*fantasma/i)
  })

  it('rechaza una referencia a sí misma: el canon no la emite', () => {
    const design: DesignPayload = {
      appName: 'vetcare',
      resources: [
        {
          ...vehiculo,
          fields: [{ name: 'padre', label: 'Padre', type: 'ref' as const, refTo: 'vehiculo' }]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/sí misma|itself/i)
  })

  it('rechaza un enum sin valores: un conjunto cerrado vacío no cierra nada', () => {
    const design: DesignPayload = {
      appName: 'inmo',
      resources: [
        { ...vehiculo, fields: [{ name: 'estado', label: 'Estado', type: 'enum' as const, values: [] }] }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/estado.*valores|values/i)
  })

  it('rechaza un enum con valores repetidos', () => {
    const design: DesignPayload = {
      appName: 'inmo',
      resources: [
        {
          ...vehiculo,
          fields: [
            {
              name: 'estado',
              label: 'Estado',
              type: 'enum' as const,
              values: [
                { value: 'alta', label: 'Alta' },
                { value: 'alta', label: 'Alta duplicada' }
              ]
            }
          ]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/repetid|duplicad/i)
  })
})
