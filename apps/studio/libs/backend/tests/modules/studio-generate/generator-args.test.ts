import { buildGeneratorArgs } from '@app/backend/contexts/studio/generate/generator-args'
import type { SlotsManifest } from '@app/backend/contexts/studio/generate/slots-manifest'

/**
 * TASK-11/12 (spec 23): el argv se monta a partir del MANIFIESTO — un flag por ranura
 * elegible — en vez de con listas de opciones copiadas a mano en el estudio.
 */
const manifest: SlotsManifest = {
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
      name: 'ui',
      label: 'Componentes',
      default: 'spartan',
      providers: [
        { value: 'spartan', label: 'Spartan' },
        { value: 'alt', label: 'Alternativa' }
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
  plugins: [
    { name: 'email', description: 'Emails' },
    { name: 'observability', description: 'Telemetría' }
  ]
}

const base = {
  manifest,
  name: 'tienda-sur',
  slots: { ui: 'alt', database: 'mongo' },
  plugins: ['email'],
  appFile: '/tmp/tienda-sur.app.json'
}

describe('buildGeneratorArgs — argv del generador, validado en el borde', () => {
  it('monta un flag por ranura elegible, en el orden del manifiesto (sin shell, argv separados)', () => {
    expect(buildGeneratorArgs(base)).toEqual([
      'nx',
      'g',
      '@raptor/generators:app',
      'tienda-sur',
      '--appFile=/tmp/tienda-sur.app.json',
      '--database=mongo',
      '--ui=alt',
      '--auth=none',
      '--plugins=email',
      '--no-interactive'
    ])
  })

  it('no emite flag para una ranura con un solo proveedor (no hay nada que elegir)', () => {
    expect(buildGeneratorArgs(base).some(arg => arg.startsWith('--infra='))).toBe(false)
  })

  it('rellena con el default del manifiesto las ranuras que el wizard no manda', () => {
    const args = buildGeneratorArgs({ ...base, slots: {} })

    expect(args).toContain('--database=postgres')
    expect(args).toContain('--ui=spartan')
    expect(args).toContain('--auth=none')
  })

  it('sin plugins emite plugins=none y admite skipInstall/directory', () => {
    const args = buildGeneratorArgs({
      ...base,
      plugins: [],
      skipInstall: true,
      directory: 'tmp/x'
    })

    expect(args).toContain('--plugins=none')
    expect(args).toContain('--skipInstall')
    expect(args).toContain('--directory=tmp/x')
  })

  // spec 62: la infra aprovisionada por el cliente viaja como boolean, no como ranura
  it('emite --provisionedInfra solo cuando es true', () => {
    expect(buildGeneratorArgs({ ...base, provisionedInfra: true })).toContain('--provisionedInfra')
    expect(buildGeneratorArgs({ ...base, provisionedInfra: false })).not.toContain('--provisionedInfra')
    expect(buildGeneratorArgs(base)).not.toContain('--provisionedInfra')
  })

  it('rechaza nombres que no sean kebab-case', () => {
    expect(() => buildGeneratorArgs({ ...base, name: 'Tienda Sur' })).toThrow(/kebab-case/)
    expect(() => buildGeneratorArgs({ ...base, name: 'x; rm -rf /' })).toThrow(/kebab-case/)
  })

  it('rechaza valores y plugins fuera del manifiesto', () => {
    expect(() => buildGeneratorArgs({ ...base, slots: { ui: 'bootstrap' } })).toThrow(/ui/)
    expect(() => buildGeneratorArgs({ ...base, slots: { database: 'oracle' } })).toThrow(/database/)
    expect(() => buildGeneratorArgs({ ...base, plugins: ['minado-bitcoin'] })).toThrow(/minado-bitcoin/)
  })

  it('rechaza combinaciones que violan el requires del manifiesto', () => {
    expect(() =>
      buildGeneratorArgs({
        ...base,
        slots: { database: 'mongo', auth: 'single-tenant' }
      })
    ).toThrow(/single-tenant/)
  })

  it('rechaza un directory que escape del workspace', () => {
    expect(() => buildGeneratorArgs({ ...base, directory: '../fuera' })).toThrow(/directory/)
    expect(() => buildGeneratorArgs({ ...base, directory: '/absoluto' })).toThrow(/directory/)
  })
})
