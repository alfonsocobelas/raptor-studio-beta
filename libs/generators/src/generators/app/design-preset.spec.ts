import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * Spec 37: la ranura `design`. Medido en la sesión del 2026-08-09, cambiar de librería de
 * componentes (spartan↔material) dejaba las apps casi indistinguibles: 12 ficheros de ~750, y
 * listado y diálogo IDÉNTICOS byte a byte. La variedad visual no vive en la librería sino en el
 * SHELL y en la densidad, así que se parametrizan esos.
 *
 * Hoy la ranura tiene UN preset: `actual`, el neutro. Las cinco pieles que existieron (cabina,
 * suite y la familia raptor: taller, banco, rótulo) se retiraron el 2026-08-27. Lo que queda
 * vigilado aquí es la maquinaria: el neutro no viste NADA, y un id desconocido rompe antes de
 * emitir un solo fichero.
 */
describe('app generator — ranura design (spec 37)', () => {
  const emit = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  const base = { name: 'demo', models: 'customer', skipInstall: true } as const
  const STYLES = 'apps/demo/apps/frontend-app/src/styles.css'

  it('sin pedir diseño se emite exactamente lo mismo que antes de existir la ranura', async () => {
    const implicit = await emit(base)
    const explicit = await emit({ ...base, design: 'actual' })

    expect([...implicit.keys()].sort()).toEqual([...explicit.keys()].sort())
    for (const [file, content] of explicit) {
      expect(implicit.get(file)).toBe(content)
    }
  })

  // Decisión de Alfonso (2026-08-25): la app escribe con la tipografía del TEMA, sin fuente
  // propia — una fuente por piel obligaba a arrastrar su paquete a cada app generada.
  it('escribe con la letra del tema, sin fuente propia', async () => {
    const files = await emit({ ...base, design: 'actual' })
    const styles = files.get(STYLES) ?? ''
    const pkg = JSON.parse(files.get('apps/demo/package.json') ?? '{}')

    // la ÚNICA declaración de familia es la del body, que lee el token del tema
    expect(styles.match(/font-family:/g) ?? []).toHaveLength(1)
    expect(styles).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/)
    expect(styles).not.toContain('@fontsource')
    expect(Object.keys(pkg.dependencies ?? {}).some(name => name.includes('fontsource'))).toBe(false)
  })

  it('el body toma la letra del tema: si no, el token no lo lee nadie', async () => {
    const styles = (await emit(base)).get(STYLES) ?? ''

    // la preflight de Tailwind resuelve la letra en <html>, fuera del bloque :root .theme-x
    expect(styles).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/)
  })

  it('actual no viste nada: sigue emitiendo byte a byte lo de siempre (gate de oro)', async () => {
    const styles = (await emit({ ...base, design: 'actual' })).get(STYLES) ?? ''

    expect(styles).not.toContain('hlmbadge')
    expect(styles).not.toMatch(/--radius:\s*0(px)?\s*;/)
    expect(styles).not.toContain('preset «')
  })

  it('un diseño desconocido falla antes de emitir nada', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const preexisting = tree.listChanges().length

    await expect(appGenerator(tree, { ...base, design: 'brutalista' })).rejects.toThrow(/design/i)
    expect(tree.listChanges()).toHaveLength(preexisting)
  })

  // Y la piel retirada tampoco vuelve por la puerta de atrás: pedirla es un id desconocido.
  it.each(['cabina', 'suite', 'taller', 'banco', 'rotulo'])('la piel retirada «%s» ya no existe', async design => {
    await expect(appGenerator(createTreeWithEmptyWorkspace(), { ...base, design })).rejects.toThrow(/design/i)
  })
})
