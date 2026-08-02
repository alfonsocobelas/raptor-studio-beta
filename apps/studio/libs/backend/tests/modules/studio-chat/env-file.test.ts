import { loadStudioEnv } from '@app/backend/contexts/studio/shared/load-studio-env'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'

/**
 * La clave del chat no se exporta a mano en cada arranque: vive en un .env del
 * estudio (git-ignorado). Sin fichero, el arranque no falla — se cae al chat
 * falso, que es el comportamiento actual.
 */
describe('loadStudioEnv', () => {
  const withEnvFile = (content: string): string => {
    const dir = mkdtempSync(path.join(tmpdir(), 'studio-env-'))
    writeFileSync(path.join(dir, '.env'), content)
    return dir
  }

  beforeEach(() => {
    delete process.env['ANTHROPIC_API_KEY']
  })

  it('carga las claves declaradas en el .env del estudio', () => {
    loadStudioEnv(withEnvFile('ANTHROPIC_API_KEY=sk-ant-de-prueba\n'))

    expect(process.env['ANTHROPIC_API_KEY']).toBe('sk-ant-de-prueba')
  })

  it('no pisa lo que ya venga del entorno: la exportación manda', () => {
    process.env['ANTHROPIC_API_KEY'] = 'del-entorno'

    loadStudioEnv(withEnvFile('ANTHROPIC_API_KEY=del-fichero\n'))

    expect(process.env['ANTHROPIC_API_KEY']).toBe('del-entorno')
  })

  it('sin fichero no rompe el arranque', () => {
    expect(() => loadStudioEnv(mkdtempSync(path.join(tmpdir(), 'vacio-')))).not.toThrow()
  })

  it('informa de qué modo de chat quedará activo', () => {
    expect(loadStudioEnv(withEnvFile('ANTHROPIC_API_KEY=k\n')).mode).toBe('anthropic')
    delete process.env['ANTHROPIC_API_KEY']
    expect(loadStudioEnv(mkdtempSync(path.join(tmpdir(), 'vacio2-'))).mode).toBe('fake')
  })
})
