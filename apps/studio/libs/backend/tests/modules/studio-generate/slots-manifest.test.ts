import { mkdtempSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { loadSlotsManifest, validateSelection } from '@app/backend/contexts/studio/generate/slots-manifest'

/**
 * TASK-11 (spec 23): las opciones dejan de estar copiadas a mano en el estudio. La verdad
 * es `tools/slots.json` del acelerador, generado desde el registro de ranuras; el estudio
 * lo lee, lo sirve al wizard y valida el POST contra él.
 */
const manifest = {
  slots: [
    {
      name: 'database',
      label: 'Base de datos',
      default: 'postgres',
      providers: [
        { value: 'postgres', label: 'PostgreSQL' },
        { value: 'mongo', label: 'MongoDB' }
      ]
    },
    {
      name: 'infra',
      label: 'Infraestructura',
      default: 'none',
      providers: [{ value: 'none', label: 'Ninguna' }]
    },
    {
      name: 'auth',
      label: 'Autenticación',
      default: 'none',
      providers: [
        { value: 'none', label: 'Ninguna' },
        {
          value: 'single-tenant',
          label: 'Single-tenant',
          requires: { database: 'postgres' }
        }
      ]
    }
  ],
  plugins: [{ name: 'email', description: 'Emails' }]
}

const rootWith = (content: unknown): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'slots-'))
  mkdirSync(path.join(root, 'tools'))
  writeFileSync(path.join(root, 'tools/slots.json'), JSON.stringify(content, null, 2))
  return root
}

describe('loadSlotsManifest', () => {
  it('lee el manifiesto del acelerador', () => {
    const loaded = loadSlotsManifest(rootWith(manifest))

    expect(loaded.slots.map(slot => slot.name)).toEqual(['database', 'infra', 'auth'])
    expect(loaded.plugins).toEqual([{ name: 'email', description: 'Emails' }])
  })

  it('falla con un mensaje claro si el manifiesto no está donde debe', () => {
    expect(() => loadSlotsManifest(mkdtempSync(path.join(tmpdir(), 'empty-')))).toThrow(/slots\.json/)
  })

  it('rechaza un manifiesto con forma inesperada en vez de propagar basura al wizard', () => {
    expect(() => loadSlotsManifest(rootWith({ slots: 'nope' }))).toThrow(/manifiesto/i)
  })
})

describe('validateSelection', () => {
  it('acepta una selección válida', () => {
    expect(() => validateSelection(manifest, { database: 'postgres', auth: 'single-tenant' }, ['email'])).not.toThrow()
  })

  it('rechaza una ranura desconocida', () => {
    expect(() => validateSelection(manifest, { flavour: 'vanilla' }, [])).toThrow(/flavour/)
  })

  it('rechaza un proveedor que no está en el manifiesto', () => {
    expect(() => validateSelection(manifest, { database: 'oracle' }, [])).toThrow(/database.*oracle/)
  })

  it('rechaza un plugin que no está en el manifiesto', () => {
    expect(() => validateSelection(manifest, {}, ['minado-bitcoin'])).toThrow(/minado-bitcoin/)
  })

  it('rechaza una combinación que viola el requires de un proveedor', () => {
    expect(() => validateSelection(manifest, { database: 'mongo', auth: 'single-tenant' }, [])).toThrow(
      /single-tenant.*postgres/
    )
  })

  it('aplica los defaults del manifiesto a las ranuras no indicadas antes de comprobar requires', () => {
    // auth=single-tenant sin database explícita: el default es postgres, así que vale
    expect(() => validateSelection(manifest, { auth: 'single-tenant' }, [])).not.toThrow()
  })
})
