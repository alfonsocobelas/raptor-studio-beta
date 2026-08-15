import type { ResourceDefinition } from '@raptor/schema'
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

  /** Modelo mínimo con los ejemplos indicados por campo. */
  const withSamples = (samples: Record<string, (string | number)[]>): ResourceDefinition =>
    ({
      ...paciente,
      fields: {
        id: { type: 'uuid', pk: true },
        ...Object.fromEntries(
          Object.entries(samples).map(([name, values]) => [
            name,
            {
              type: 'string',
              required: true,
              samples: values,
              vo: { name: `Paciente${name}`, fieldName: name },
              form: { control: 'text', label: name, section: 'general' }
            }
          ])
        )
      }
    }) as unknown as ResourceDefinition

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

  it('siembra tantas filas como ejemplos aporte el modelo (hasta 10)', () => {
    const model = withSamples({
      nombre: ['Luna', 'Simba', 'Nala', 'Toby', 'Kira', 'Rocco'],
      especie: ['Perro', 'Gato', 'Perro', 'Conejo', 'Gato', 'Perro']
    })

    expect(renderEntrypoints(model, true).seedItems).toHaveLength(6)
  })

  it('no pasa de 10 filas aunque haya más ejemplos: una demo, no una carga masiva', () => {
    const many = Array.from({ length: 25 }, (_, i) => `Nombre ${i}`)

    expect(renderEntrypoints(withSamples({ nombre: many }), true).seedItems).toHaveLength(10)
  })

  it('sin ejemplos mantiene las dos filas de siempre', () => {
    expect(renderEntrypoints(withSamples({}), true).seedItems).toHaveLength(2)
  })

  it('un campo con voShared sin-espacios-interiores NO se siembra con «Label seed N»', () => {
    // contract.contractNumber (voShared ContractNumber, noInnerWhitespace) recibía
    // 'Nº Contrato seed 1' y el seed del oro abortaba en su propio VO
    const model = {
      ...paciente,
      fields: {
        id: { type: 'uuid', pk: true },
        chip: {
          type: 'string',
          required: true,
          voShared: { name: 'ContractNumber' },
          form: { control: 'text', label: 'Nº Chip', section: 'general' }
        }
      }
    } as unknown as ResourceDefinition

    const [primera] = renderEntrypoints(model, true).seedItems

    expect(primera.join(' ')).toContain("chip: 'SEED-PACIENTE-1'")
  })

  it('los campos del period se siembran como intervalos reales, aunque el fin sea opcional', () => {
    // sin esto el cronograma (spec 30) nace con barras abiertas y un eje de 30 días
    const model = {
      ...paciente,
      period: { start: 'desde', end: 'hasta' },
      fields: {
        id: { type: 'uuid', pk: true },
        desde: { type: 'date', required: true, form: { control: 'date', label: 'Desde', section: 'general' } },
        hasta: { type: 'date', nullable: true, form: { control: 'date', label: 'Hasta', section: 'general' } }
      }
    } as unknown as ResourceDefinition

    const [primera, segunda] = renderEntrypoints(model, true).seedItems

    expect(primera.join(' ')).toContain("desde: '2026-01-01'")
    expect(primera.join(' ')).toContain("hasta: '2026-07-28'")
    // filas escalonadas: barras distintas en el cronograma
    expect(segunda.join(' ')).toContain("desde: '2026-02-01'")
    expect(segunda.join(' ')).toContain("hasta: '2026-08-28'")
  })

  it('la fila N usa el ejemplo N de cada campo, sin mezclar', () => {
    const model = withSamples({
      nombre: ['Luna', 'Simba', 'Nala'],
      especie: ['Perro', 'Gato', 'Hurón']
    })

    const [, segunda] = renderEntrypoints(model, true).seedItems

    expect(segunda.join(' ')).toContain("'Simba'")
    expect(segunda.join(' ')).toContain("'Gato'")
  })
})
