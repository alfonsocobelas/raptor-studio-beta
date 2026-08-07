import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { BusinessBrief, ResourceDefinition } from '@acc/schema'
import { appGenerator } from './app'
import { renderClaudeMd } from './brief-doc'
import { MODELS, registerModels } from '../resource/models/registry'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * Spec 22, TASK-05: el brief aterriza como CLAUDE.md en la raíz de la app generada — la memoria
 * del negocio que la spec de los huecos @ai leerá algún día. Markdown construido en generator.ts
 * (regla 8); sin brief no hay fichero, y las fixtures actuales no cambian.
 */
describe('renderClaudeMd — el markdown del brief', () => {
  const brief: BusinessBrief = {
    business: 'Clínica veterinaria de barrio: pacientes, citas y vacunas.',
    rules: ['Las citas duran 30 minutos', 'No se vacuna sin cita previa'],
    glossary: [{ term: 'ficha', means: 'el historial completo del paciente' }]
  }

  it('lleva negocio, reglas, glosario y una línea por entidad con brief', () => {
    const models = [
      { name: 'paciente', labels: { singular: 'Paciente' }, brief: 'Un paciente de la clínica.' },
      { name: 'cita', labels: { singular: 'Cita' }, brief: 'Media hora con un paciente.' }
    ] as unknown as ResourceDefinition[]

    const md = renderClaudeMd('vetcare', brief, models)

    expect(md).toContain('# vetcare — contexto del negocio')
    expect(md).toContain('Clínica veterinaria de barrio')
    expect(md).toContain('- Las citas duran 30 minutos')
    expect(md).toContain('- **ficha**: el historial completo del paciente')
    expect(md).toContain('- **Paciente**: Un paciente de la clínica.')
    expect(md).toContain('- **Cita**: Media hora con un paciente.')
  })

  it('las secciones vacías no aparecen', () => {
    const md = renderClaudeMd('vetcare', { business: 'Solo prosa.' }, [])

    expect(md).toContain('Solo prosa.')
    expect(md).not.toContain('## Reglas')
    expect(md).not.toContain('## Glosario')
    expect(md).not.toContain('## Entidades')
  })
})

describe('app generator — CLAUDE.md en la raíz (spec 22)', () => {
  it('sin brief no se emite: las fixtures actuales no cambian', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true })

    expect(tree.exists('apps/demo/CLAUDE.md')).toBe(false)
  })

  it('un appFile con brief lo aterriza en la raíz de la app', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-brief-'))
    const appFile = path.join(dir, 'vetcare.app.json')
    const garment = MODELS['garment']
    fs.writeFileSync(
      appFile,
      JSON.stringify({
        schemaVersion: 1,
        name: 'vetcare',
        brief: { business: 'Clínica veterinaria de barrio.', rules: ['Las citas duran 30 minutos'] },
        pages: [{ kind: 'resource', resource: 'garment-brief' }],
        resources: [{ ...garment, name: 'garment-brief', plural: 'garment-briefs', brief: 'Una prenda en stock.' }]
      })
    )

    try {
      const tree: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, { name: 'demo', appFile, skipInstall: true })
      const md = tree.read('apps/demo/CLAUDE.md', 'utf-8') ?? ''

      expect(md).toContain('Clínica veterinaria de barrio.')
      expect(md).toContain('- Las citas duran 30 minutos')
      expect(md).toContain('Una prenda en stock.')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
