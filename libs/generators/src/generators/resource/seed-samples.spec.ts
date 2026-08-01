import type { ResourceDefinition } from '@acc/schema'
import { renderEntrypoints } from './build-entrypoints'

/**
 * Las semillas del código emitido usan los `samples` del schema (los ejemplos del
 * dominio que aporta el chat del estudio) en vez de «Nombre seed 1».
 */
describe('semillas — datos coherentes con el dominio', () => {
  const paciente = {
    schemaVersion: 1,
    name: 'paciente',
    plural: 'pacientes',
    context: 'vetcare',
    schemaName: 'vetcare',
    labels: { singular: 'Paciente', plural: 'Pacientes' },
    formSections: [{ id: 'general', title: 'Datos' }],
    fields: {
      id: { type: 'uuid', pk: true },
      nombre: {
        type: 'string',
        required: true,
        samples: ['Luna', 'Toby', 'Nala'],
        vo: { name: 'PacienteNombre', fieldName: 'Nombre' },
        form: { control: 'text', label: 'Nombre', section: 'general' }
      },
      // opcional: antes se saltaba y salía vacío en la app
      raza: {
        type: 'string',
        samples: ['Border Collie', 'Común europeo'],
        vo: { name: 'PacienteRaza', fieldName: 'Raza' },
        form: { control: 'text', label: 'Raza', section: 'general' }
      },
      pesoKg: {
        type: 'number',
        required: true,
        samples: [18.4, 4.2],
        vo: { name: 'PacientePeso', fieldName: 'Peso' },
        form: { control: 'number', label: 'Peso', section: 'general' }
      },
      vacunado: {
        type: 'boolean',
        required: true,
        samples: ['Sí', 'No'],
        vo: { name: 'PacienteVacunado', fieldName: 'Vacunado' },
        form: { control: 'checkbox', label: 'Vacunado', section: 'general' }
      },
      fechaNacimiento: {
        type: 'date',
        required: true,
        samples: ['14/03/2021', '02/11/2019'],
        vo: { name: 'PacienteFecha', fieldName: 'Fecha' },
        form: { control: 'date', label: 'Fecha', section: 'general' }
      }
    }
  } as unknown as ResourceDefinition

  const seeds = (): string[][] => renderEntrypoints(paciente, true).seedItems

  it('usa los samples del dominio en cada fila', () => {
    const [first, second] = seeds()

    expect(first).toContain("nombre: 'Luna'")
    expect(second).toContain("nombre: 'Toby'")
  })

  it('rellena también los campos opcionales que traen samples', () => {
    expect(seeds()[0]).toContain("raza: 'Border Collie'")
  })

  it('convierte al literal que espera el DTO: número, booleano «Sí/No» y fecha dd/mm/aaaa', () => {
    const [first, second] = seeds()

    expect(first).toContain('pesoKg: 18.4')
    expect(first).toContain('vacunado: true')
    expect(second).toContain('vacunado: false')
    expect(first).toContain("fechaNacimiento: '2021-03-14'")
  })

  it('sin samples mantiene el comportamiento anterior (no rompe modelos existentes)', () => {
    const plain = {
      ...paciente,
      fields: {
        id: { type: 'uuid', pk: true },
        nombre: {
          type: 'string',
          required: true,
          vo: { name: 'X', fieldName: 'Nombre' },
          form: { control: 'text', label: 'Nombre', section: 'general' }
        }
      }
    } as unknown as ResourceDefinition

    expect(renderEntrypoints(plain, true).seedItems[0]).toContain("nombre: 'Nombre seed 1'")
  })
})
