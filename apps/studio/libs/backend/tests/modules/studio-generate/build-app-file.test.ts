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
})
