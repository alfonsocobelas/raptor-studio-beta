import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * Spec 37: la ranura `design`. Medido en la sesión del 2026-08-09, cambiar de librería de
 * componentes (spartan↔material) dejaba las apps casi indistinguibles: 12 ficheros de ~750, y
 * listado y diálogo IDÉNTICOS byte a byte. La variedad visual no vive en la librería sino en el
 * SHELL y en la densidad, así que se parametrizan esos.
 *
 * Tres presets: `actual` (el de siempre, por defecto), `cabina` (centro de operaciones denso,
 * con tema claro y oscuro) y `suite` (ERP con banda de marca y pestañas de módulo).
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
  const SHELL = 'apps/demo/apps/frontend-app/src/app.component.ts'
  const STYLES = 'apps/demo/apps/frontend-app/src/styles.css'

  it('sin pedir diseño se emite exactamente lo mismo que antes de existir la ranura', async () => {
    const implicit = await emit(base)
    const explicit = await emit({ ...base, design: 'actual' })

    expect([...implicit.keys()].sort()).toEqual([...explicit.keys()].sort())
    for (const [file, content] of explicit) {
      expect(implicit.get(file)).toBe(content)
    }
  })

  it('cabina emite su propio shell, denso y con la barra lateral por tokens del preset', async () => {
    const shell = (await emit({ ...base, design: 'cabina' })).get(SHELL) ?? ''

    expect(shell).toContain('app-shell-side')
    // el contador por recurso es lo que distingue a un centro de operaciones de un menú
    expect(shell).toContain('navItems')
    expect(shell).not.toContain('Panel de gestión')
  })

  it('cabina trae los dos temas: la piel no impone modo oscuro fijo', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''

    // el bloque del preset define su cromo en AMBOS temas, no solo en oscuro
    expect(styles).toContain('--shell-bg')
    expect(styles).toMatch(/\.dark[\s\S]*--shell-bg/)
  })

  it('suite emite banda de marca y pestañas de módulo en vez de barra lateral', async () => {
    const shell = (await emit({ ...base, design: 'suite' })).get(SHELL) ?? ''

    expect(shell).toContain('app-shell-banner')
    expect(shell).toContain('app-shell-modules')
    expect(shell).not.toContain('app-shell-side')
  })

  // Profundización (2026-08-10, decisión de Alfonso): medido en el estudio que shell+densidad
  // seguían dejando los presets «iguales, cambiando el color como quien dice». Un preset viste
  // también componentes y tipografía — vía tokens y selectores de directiva, nunca componentes.
  it('cabina viste componentes y tipografía: esquinas vivas, condensada y cifras tabulares', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''

    // esquinas vivas en TODA la app: el token pisa al del tema (y sus derivados calc)
    expect(styles).toMatch(/--radius:\s*0(px|rem)?\s*;[\s\S]*--radius-md:\s*0/)
    // tipografía propia de instrumentación: stack y tracking, no solo color
    expect(styles).toMatch(/\.app-shell-main\s*\{[^}]*letter-spacing/)
    expect(styles).toMatch(/\.app-shell-main\s*\{[^}]*font-variant-numeric:\s*tabular-nums/)
    // el badge deja de ser píldora: rectángulo plano de panel de control
    expect(styles).toMatch(/\[hlmbadge\][^}]*border-radius/i)
    // la cifra del KPI pasa a contador grande, no tarjeta blanda
    expect(styles).toMatch(/\[hlmcard\]/i)
  })

  it('suite viste componentes y tipografía: rectangular, corporativa y sin sombras', async () => {
    const styles = (await emit({ ...base, design: 'suite' })).get(STYLES) ?? ''

    // casi recto, no redondeado: token propio distinto del tema y del de cabina
    expect(styles).toMatch(/--radius:\s*2px/)
    // stack corporativo explícito
    expect(styles).toMatch(/--font-sans:[^;]*Segoe UI/)
    // botones y badges rectangulares y planos
    expect(styles).toMatch(/\[hlmbtn\][^}]*box-shadow:\s*none/i)
    expect(styles).toMatch(/\[hlmbadge\][^}]*border-radius/i)
    // los títulos de pantalla se contienen: un ERP no grita
    expect(styles).toMatch(/\.app-shell-main\s+h1\b/)
  })

  // Fidelidad a la maqueta skindemo (2026-08-10): la ronda de maquetas que parió la spec 37
  // enseñaba badges outline con color semántico, datos en monospace, KPIs de instrumentación
  // y una barra de estado. El recorte a shell+densidad dejó al emitido sin nada de eso.
  it('cabina emite la barra de estado con la sección activa, como la maqueta', async () => {
    const shell = (await emit({ ...base, design: 'cabina' })).get(SHELL) ?? ''

    expect(shell).toContain('app-shell-topbar')
    expect(shell).toContain('currentSection')
  })

  it('cabina viste los badges como etiquetas outline con color semántico por variante', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''

    // outline: fondo fuera, borde al color del texto
    expect(styles).toMatch(/\[hlmbadge\][^}]*background:\s*transparent/i)
    expect(styles).toMatch(/\[hlmbadge\][^}]*border[^}]*currentcolor/i)
    // color semántico por variante, en los dos temas
    expect(styles).toMatch(/hlmbadge[^}]*bg-primary/i)
    expect(styles).toMatch(/\.dark\s+[^{]*hlmbadge/i)
  })

  it('cabina pone los datos en monospace: cifras de tabla, buscador y paginación', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''

    expect(styles).toMatch(/--font-mono-cabina/)
    expect(styles).toMatch(/td\.text-right[^}]*font-family/i)
    expect(styles).toMatch(/\[hlminput\][^}]*font-family/i)
  })

  it('cabina funde los KPIs en una tira de instrumentación: panel plano y etiqueta uppercase', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''

    expect(styles).toMatch(/\[hlmcard\][^}]*background:\s*transparent/i)
    expect(styles).toMatch(/\[hlmcard\][^}]*text-transform:\s*uppercase/i)
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
})
