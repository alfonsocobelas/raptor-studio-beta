import { PLUGINS, selectPlugins } from './registry'

describe('selectPlugins', () => {
  it('returns no plugins for empty, undefined or "none"', () => {
    expect(selectPlugins(undefined)).toEqual([])
    expect(selectPlugins('')).toEqual([])
    expect(selectPlugins('  ')).toEqual([])
    expect(selectPlugins('none')).toEqual([])
  })

  it('resolves registered plugins by name, trimming whitespace', () => {
    const plugins = selectPlugins(' auth , email ')

    expect(plugins.map(p => p.name)).toEqual(['auth', 'email'])
  })

  it('throws for an unknown plugin listing the available ones', () => {
    expect(() => selectPlugins('auth,nope')).toThrow(/Unknown plugin 'nope'.*auth/)
  })

  it('tolerates the legacy "migrations" name with a notice instead of failing', () => {
    // migraciones de fábrica (2026-07-31): el nombre antiguo no rompe comandos guardados
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const plugins = selectPlugins('migrations,auth')

    expect(plugins.map(p => p.name)).toEqual(['auth'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('de fábrica'))
    warn.mockRestore()
  })

  it('does not offer migrations in the registry (built-in, not optional)', () => {
    expect(Object.keys(PLUGINS)).toEqual(['auth', 'email', 'observability'])
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
