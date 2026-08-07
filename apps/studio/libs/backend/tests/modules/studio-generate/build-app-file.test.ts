import { buildAppFile } from '@app/backend/contexts/studio/generate/build-app-file'
import { describeGenerationFailure } from '@app/backend/contexts/studio/generate/generation-failure'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'

const design: DesignPayload = {
  appName: 'clinica',
  palette: 'ocean',
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
  pages: [{ title: 'Pacientes', blocks: [{ kind: 'table', resource: 'paciente' }] }]
}

describe('buildAppFile — el artefacto que consume el generador', () => {
  it('traduce las vistas del lienzo a páginas del app-schema', () => {
    expect(buildAppFile(design, 'clinica').pages).toEqual([
      { kind: 'resource', resource: 'paciente', label: 'Pacientes' }
    ])
  })

  it('la paleta elegida en el lienzo viaja al artefacto: lo que ves es lo que se genera', () => {
    expect(buildAppFile(design, 'clinica').theme).toEqual({ id: 'ocean' })
  })

  it('sin paleta elegida no declara tema (la app sale neutra)', () => {
    expect(buildAppFile({ ...design, palette: undefined }, 'clinica').theme).toBeUndefined()
  })

  it('neutral tampoco declara tema: es exactamente lo que ya se emite', () => {
    expect(buildAppFile({ ...design, palette: 'neutral' }, 'clinica').theme).toBeUndefined()
  })

  it('expande las entidades del lienzo a resource-schemas completos', () => {
    const file = buildAppFile(design, 'clinica')

    expect(file.resources[0]).toMatchObject({ name: 'paciente', schemaVersion: 1 })
  })

  it('describe un timeout como lo que es: una carpeta a medias, no una app', () => {
    const message = describeGenerationFailure({ killed: true, signal: 'SIGTERM' })

    expect(message).toMatch(/tiempo|timeout/i)
    expect(message).toMatch(/a medias|incompleta/i)
  })

  it('un fallo normal no se disfraza de timeout', () => {
    expect(describeGenerationFailure({ killed: false, message: 'boom' })).toContain('boom')
  })

  it('los puertos elegidos viajan al artefacto', () => {
    const file = buildAppFile({ ...design, ports: { api: 3010, web: 4341, postgres: 5443 } }, 'clinica')

    expect(file.ports).toEqual({ api: 3010, web: 4341, postgres: 5443 })
  })

  it('sin puertos elegidos no declara nada: la app sale con los del esqueleto', () => {
    expect(buildAppFile(design, 'clinica').ports).toBeUndefined()
  })
})

/** Spec 22, TASK-04: la frontera copia el brief — la app generada nace con memoria del negocio. */
describe('buildAppFile — el brief cruza la frontera (spec 22)', () => {
  it('copia el brief de la app y el de cada entidad expandida', () => {
    const design = {
      appName: 'vetcare',
      resources: [
        {
          name: 'paciente',
          plural: 'pacientes',
          labelSingular: 'Paciente',
          labelPlural: 'Pacientes',
          gender: 'm' as const,
          fields: [{ name: 'nombre', label: 'Nombre', type: 'string' as const }],
          brief: 'Un paciente de la clínica; su historial vive aquí.'
        }
      ],
      pages: [],
      brief: { business: 'Clínica veterinaria de barrio.', rules: ['Las citas duran 30 minutos'] }
    }

    const file = buildAppFile(design, 'vetcare')

    expect(file.brief?.business).toBe('Clínica veterinaria de barrio.')
    expect(file.resources[0].brief).toBe('Un paciente de la clínica; su historial vive aquí.')
  })

  it('sin brief no aparece la clave: ningún schema existente cambia', () => {
    const design = { appName: 'x', resources: [], pages: [] }

    expect('brief' in buildAppFile(design, 'x')).toBe(false)
  })
})
