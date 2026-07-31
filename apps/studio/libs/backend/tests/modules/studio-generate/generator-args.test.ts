import { buildGeneratorArgs } from '@app/backend/contexts/studio/generate/generator-args'

const base = {
  name: 'tienda-sur',
  ui: 'material',
  database: 'mongo',
  plugins: ['auth', 'email'],
  appFile: '/tmp/tienda-sur.app.json'
}

describe('buildGeneratorArgs — argv del generador, validado en el borde', () => {
  it('monta los argumentos completos (sin shell, argv separados)', () => {
    expect(buildGeneratorArgs(base)).toEqual([
      'nx',
      'g',
      '@acc/generators:app',
      'tienda-sur',
      '--appFile=/tmp/tienda-sur.app.json',
      '--ui=material',
      '--database=mongo',
      '--plugins=auth,email',
      '--no-interactive'
    ])
  })

  it('sin plugins emite plugins=none y admite skipInstall/directory', () => {
    const args = buildGeneratorArgs({ ...base, plugins: [], skipInstall: true, directory: 'tmp/x' })

    expect(args).toContain('--plugins=none')
    expect(args).toContain('--skipInstall')
    expect(args).toContain('--directory=tmp/x')
  })

  it('rechaza nombres que no sean kebab-case', () => {
    expect(() => buildGeneratorArgs({ ...base, name: 'Tienda Sur' })).toThrow(/kebab-case/)
    expect(() => buildGeneratorArgs({ ...base, name: 'x; rm -rf /' })).toThrow(/kebab-case/)
  })

  it('rechaza ui/database/plugins fuera del catálogo de opciones', () => {
    expect(() => buildGeneratorArgs({ ...base, ui: 'bootstrap' })).toThrow(/ui/)
    expect(() => buildGeneratorArgs({ ...base, database: 'oracle' })).toThrow(/database/)
    expect(() => buildGeneratorArgs({ ...base, plugins: ['auth', 'minado-bitcoin'] })).toThrow(/plugin/)
  })

  it('rechaza un directory que escape del workspace', () => {
    expect(() => buildGeneratorArgs({ ...base, directory: '../fuera' })).toThrow(/directory/)
    expect(() => buildGeneratorArgs({ ...base, directory: '/absoluto' })).toThrow(/directory/)
  })
})
