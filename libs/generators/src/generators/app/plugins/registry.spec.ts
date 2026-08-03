import { PLUGINS, selectPlugins } from './registry'

describe('selectPlugins', () => {
  it('returns no plugins for empty, undefined or "none"', () => {
    expect(selectPlugins(undefined)).toEqual([])
    expect(selectPlugins('')).toEqual([])
    expect(selectPlugins('  ')).toEqual([])
    expect(selectPlugins('none')).toEqual([])
  })

  it('resolves registered plugins by name, trimming whitespace', () => {
    const plugins = selectPlugins(' email , observability ')

    expect(plugins.map(p => p.name)).toEqual(['email', 'observability'])
  })

  it('throws for an unknown plugin listing the available ones', () => {
    expect(() => selectPlugins('email,nope')).toThrow(/Unknown plugin 'nope'.*email/)
  })

  it('tolerates the legacy "migrations" name with a notice instead of failing', () => {
    // migraciones de fábrica (2026-07-31): el nombre antiguo no rompe comandos guardados
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const plugins = selectPlugins('migrations,email')

    expect(plugins.map(p => p.name)).toEqual(['email'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('de fábrica'))
    warn.mockRestore()
  })

  it('offers only the additive capabilities: migrations is built in and auth is a slot now', () => {
    // TASK-03 (spec 23): auth es decisión excluyente ⇒ vive en SLOTS, no en la bolsa aditiva
    expect(Object.keys(PLUGINS)).toEqual(['email', 'observability'])
  })

  it('resolves plugins without judging the engine (combination rules live in validateCombination)', () => {
    // TASK-02 (spec 23): el guard requiresDatabase migró a requires + validateCombination
    expect(selectPlugins('email,observability').map(p => p.name)).toEqual(['email', 'observability'])
  })
})

describe('plugin manifests', () => {
  it('every plugin declares name and description (what the CLI shows)', () => {
    for (const plugin of Object.values(PLUGINS)) {
      expect(plugin.name.length).toBeGreaterThan(0)
      expect(plugin.description.length).toBeGreaterThan(0)
    }
  })
})
