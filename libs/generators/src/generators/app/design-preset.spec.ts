import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'
import { DESIGN_HOOKS } from './design/hooks'

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

  /**
   * El bloque `:root .theme-x { … }` del styles.css emitido. Los tokens del preset sólo
   * cuentan si están AQUÍ: declarados en `:root` a secas los gana el tema, que es más
   * específico (0,2,0 contra 0,1,0) y vive sobre el <body> (spec 67).
   */
  const themeBlock = (styles: string): string => styles.match(/:root \.theme-[\w-]+ \{([^}]*)\}/)?.[1] ?? ''

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

    // esquinas vivas en TODA la app: el token pisa al del tema (y sus derivados calc).
    // Tiene que caer DENTRO del bloque del tema: en :root suelto el token existe pero no
    // se aplica — :root .theme-x es (0,2,0) y está sobre el <body> (spec 67).
    expect(themeBlock(styles)).toMatch(/--radius:\s*0(px|rem)?\s*;[\s\S]*--radius-md:\s*0/)
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
    expect(themeBlock(styles)).toMatch(/--radius:\s*2px/)
    // stack corporativo explícito, y el ÚLTIMO --font-sans del bloque: el del tema va antes
    expect(themeBlock(styles)).toMatch(/--font-sans:[^;]*Segoe UI/)
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

  // Spec 67: el defecto que dejó a los presets sin tokens durante dos semanas. El bloque del
  // preset se añade al final del fichero, y ahí `:root { --radius: 0 }` es CSS muerto. Los
  // tokens del preset entran dentro del bloque del tema, detrás de los suyos: misma
  // especificidad, decide el orden de declaración.
  it('los tokens del preset van dentro del bloque del tema, detrás de los suyos', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''
    const block = themeBlock(styles)

    // el tema declara su radio primero; el del preset lo pisa después, en el mismo bloque
    expect(block.indexOf('--radius:')).toBeGreaterThanOrEqual(0)
    expect(block.lastIndexOf('--radius:')).toBeGreaterThan(block.indexOf('--radius:'))
    expect(block.slice(block.lastIndexOf('--radius:'))).toMatch(/--radius:\s*0/)
    // y ya no queda ningún override de radio fuera del bloque, donde no se aplicaría
    expect(styles.slice(styles.indexOf('}', styles.indexOf(':root .theme-')))).not.toMatch(/:root \{[^}]*--radius:/)
  })

  // Spec 67: los selectores de directiva del preset sólo hablaban `hlm*`, y esos atributos
  // existen en DOS plantillas de todo el emitido (data-table y kpi-card). El resto de las
  // pantallas usa los contratos neutros del ADR-003 — [appbtn], [appinput], [appbadge] — así
  // que la piel no las alcanzaba: salvo las tablas, la app era idéntica en las tres pieles.
  it.each(['cabina', 'suite'])('%s viste también los contratos neutros, no sólo los hlm', async design => {
    const styles = (await emit({ ...base, design })).get(STYLES) ?? ''

    for (const contract of ['appbtn', 'appinput', 'appbadge']) {
      expect(styles).toContain(`[${contract}]`)
    }
    // y sigue vistiendo los hlm: data-table y kpi-card son los que los llevan
    expect(styles).toContain('[hlmbtn]')
  })

  // Spec 67: el cromo que las plantillas escriben a mano (panel del calendario, columna del
  // kanban, ficha de detalle…) sólo lo alcanza la piel a través del vocabulario de hooks.
  it.each(['cabina', 'suite'])('%s viste los cinco hooks del vocabulario', async design => {
    const styles = (await emit({ ...base, design })).get(STYLES) ?? ''

    for (const hook of DESIGN_HOOKS) {
      expect(styles).toMatch(new RegExp(`\\.${hook}[^{]*\\{`))
    }
  })

  it.each(['cabina', 'suite'])('%s alcanza los controles crudos de un toolbar', async design => {
    const styles = (await emit({ ...base, design })).get(STYLES) ?? ''

    // gantt, galería, importación y detalle escriben <button>/<input> sin contrato neutro
    expect(styles).toContain('.app-toolbar button')
    expect(styles).toContain('.app-toolbar input')
    // y el control suelto que lleva el hook en sí mismo (el buscador del cronograma)
    expect(styles).toContain('input.app-toolbar')
  })

  it('el cromo de los hooks de cabina sale de los tokens del shell: sirve en claro y en oscuro', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''
    const panel = styles.match(/\.app-panel \{([^}]*)\}/)?.[1] ?? ''

    expect(panel).toContain('var(--shell-border)')
  })

  // Petición de Alfonso (2026-08-25): la piel también cambia de LETRA. Nada de stacks del
  // sistema, que en cada máquina caen en otra cosa: la fuente viaja como dependencia
  // self-hosted, igual que la del tema (fase 3 de la spec 20).
  it('cabina escribe en condensada y pone los datos en JetBrains Mono', async () => {
    const files = await emit({ ...base, design: 'cabina' })
    const styles = files.get(STYLES) ?? ''
    const pkg = JSON.parse(files.get('apps/demo/package.json') ?? '{}')

    expect(themeBlock(styles)).toMatch(/--font-sans:\s*'Roboto Condensed Variable'/)
    expect(styles).toMatch(/--font-mono-cabina:\s*'JetBrains Mono Variable'/)
    // self-hosted: los ficheros los trae el npm install de la app, sin CDNs
    expect(styles).toContain("@import '@fontsource-variable/roboto-condensed'")
    expect(styles).toContain("@import '@fontsource-variable/jetbrains-mono'")
    expect(pkg.dependencies['@fontsource-variable/roboto-condensed']).toBeDefined()
    expect(pkg.dependencies['@fontsource-variable/jetbrains-mono']).toBeDefined()
  })

  it('suite escribe en IBM Plex Sans, la letra del software corporativo', async () => {
    const files = await emit({ ...base, design: 'suite' })
    const styles = files.get(STYLES) ?? ''
    const pkg = JSON.parse(files.get('apps/demo/package.json') ?? '{}')

    expect(themeBlock(styles)).toMatch(/--font-sans:\s*'IBM Plex Sans Variable'/)
    expect(styles).toContain("@import '@fontsource-variable/ibm-plex-sans'")
    expect(pkg.dependencies['@fontsource-variable/ibm-plex-sans']).toBeDefined()
  })

  it('la piel neutra no arrastra ninguna fuente: sigue con la pila del sistema', async () => {
    const files = await emit({ ...base, design: 'actual' })
    const pkg = JSON.parse(files.get('apps/demo/package.json') ?? '{}')

    expect(Object.keys(pkg.dependencies ?? {}).some(name => name.includes('fontsource'))).toBe(false)
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
