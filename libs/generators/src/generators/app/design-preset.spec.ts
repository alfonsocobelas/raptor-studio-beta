import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'
import { DESIGN_HOOKS } from '@raptor/schema'

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

  it('cabina funde los KPIs en una tira de instrumentación: panel plano y etiqueta uppercase', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''

    // por hooks, no por clases de Tailwind: el .text-sm del sufijo del valor también casaba
    expect(styles).toMatch(/\.app-panel \{[^}]*background:\s*transparent/i)
    expect(styles).toMatch(/\.app-panel-head[^{]*\{[^}]*text-transform:\s*uppercase/i)
    expect(styles).toMatch(/\.app-metric[^{]*\{[^}]*font-size/i)
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
  it.each(['cabina', 'suite', 'taller', 'banco', 'rotulo'])(
    '%s viste también los contratos neutros, no sólo los hlm',
    async design => {
      const styles = (await emit({ ...base, design })).get(STYLES) ?? ''

      for (const contract of ['appbtn', 'appinput', 'appbadge']) {
        expect(styles).toContain(`[${contract}]`)
      }
      // y sigue vistiendo los hlm: data-table y kpi-card son los que los llevan
      expect(styles).toContain('[hlmbtn]')
    }
  )

  // Spec 67: el cromo que las plantillas escriben a mano (panel del calendario, columna del
  // kanban, ficha de detalle…) sólo lo alcanza la piel a través del vocabulario de hooks.
  it.each(['cabina', 'suite', 'taller', 'banco', 'rotulo'])(
    '%s viste todos los hooks del vocabulario',
    async design => {
      const styles = (await emit({ ...base, design })).get(STYLES) ?? ''

      for (const hook of DESIGN_HOOKS) {
        expect(styles).toMatch(new RegExp(`\\.${hook}[^{]*\\{`))
      }
    }
  )

  it.each(['cabina', 'suite', 'taller', 'banco', 'rotulo'])(
    '%s alcanza los controles crudos de un toolbar',
    async design => {
      const styles = (await emit({ ...base, design })).get(STYLES) ?? ''

      // gantt, galería, importación y detalle escriben <button>/<input> sin contrato neutro
      expect(styles).toContain('.app-toolbar button')
      expect(styles).toContain('.app-toolbar input')
      // y el control suelto que lleva el hook en sí mismo (el buscador del cronograma)
      expect(styles).toContain('input.app-toolbar')
    }
  )

  it('el cromo de los hooks de cabina sale de los tokens del shell: sirve en claro y en oscuro', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''
    const panel = styles.match(/\.app-panel \{([^}]*)\}/)?.[1] ?? ''

    expect(panel).toContain('var(--shell-border)')
  })

  // Decisión de Alfonso (2026-08-25), después de verlo: las tres pieles escriben con la
  // tipografía del NEUTRO. Una fuente por piel obligaba a arrastrar su paquete a cada app y la
  // identidad no la da la letra, sino la forma, la densidad y el cromo.
  it.each(['actual', 'cabina', 'suite', 'taller', 'banco', 'rotulo'])(
    '%s escribe con la letra del tema, sin fuente propia',
    async design => {
      const files = await emit({ ...base, design })
      const styles = files.get(STYLES) ?? ''
      const pkg = JSON.parse(files.get('apps/demo/package.json') ?? '{}')

      // la ÚNICA declaración de familia es la del body, que lee el token del tema
      expect(styles.match(/font-family:/g) ?? []).toHaveLength(1)
      expect(styles).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/)
      expect(styles).not.toContain('@fontsource')
      expect(Object.keys(pkg.dependencies ?? {}).some(name => name.includes('fontsource'))).toBe(false)
    }
  )

  it.each(['cabina', 'suite', 'taller', 'banco', 'rotulo'])(
    '%s sí unifica las cifras: tabulares en todas las pantallas',
    async design => {
      const styles = (await emit({ ...base, design })).get(STYLES) ?? ''
      const rule = styles.match(/(\/\* los NÚMEROS[\s\S]*?)\}/)?.[1] ?? ''

      for (const place of ['.app-metric', '.app-cell', '.app-chip', '.app-toolbar', 'td.text-right']) {
        expect(rule).toContain(place)
      }
      expect(rule).toMatch(/font-variant-numeric:\s*tabular-nums/)
    }
  )

  it('el body toma la letra del tema: si no, el token no lo lee nadie', async () => {
    const styles = (await emit(base)).get(STYLES) ?? ''

    // la preflight de Tailwind resuelve la letra en <html>, fuera del bloque :root .theme-x
    expect(styles).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/)
  })

  it('ningún preset referencia un token que ya no declara', async () => {
    for (const design of ['cabina', 'suite']) {
      const styles = (await emit({ ...base, design })).get(STYLES) ?? ''
      const used = [...styles.matchAll(/var\((--[a-z0-9-]+)\)/g)].map(m => m[1])
      const declared = [...styles.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map(m => m[1])

      // tokens de Tailwind/spartan aparte: sólo se vigilan los que inventa el acelerador
      const ours = [...new Set(used)].filter(name => /shell|banner|grid|module|font-|row-height|table-font/.test(name))
      for (const token of ours) {
        expect(declared).toContain(token)
      }
    }
  })

  // Medido en navegador (2026-08-25): la tarjeta de spartan no tiene BORDE — su contorno es
  // ring-1 + shadow-xs, y en Tailwind el ring es un box-shadow. El box-shadow:none del preset se
  // llevaba el contorno entero y los KPIs salían flotando, sin tarjeta. Quien apaga la sombra
  // tiene que devolver el contorno como borde explícito.
  it.each(['cabina', 'suite', 'banco'])('%s devuelve como borde el contorno que apaga con la sombra', async design => {
    const styles = (await emit({ ...base, design })).get(STYLES) ?? ''
    const panel = styles.match(/\.app-panel \{([^}]*)\}/)?.[1] ?? ''

    expect(panel).toMatch(/box-shadow:\s*none/)
    expect(panel).toMatch(/border-width:\s*1px/)
    expect(panel).toMatch(/border-color:\s*var\(--(shell-border|grid-line)\)/)
  })

  it('actual no viste nada: sigue emitiendo byte a byte lo de siempre (gate de oro)', async () => {
    const styles = (await emit({ ...base, design: 'actual' })).get(STYLES) ?? ''

    expect(styles).not.toContain('hlmbadge')
    expect(styles).not.toMatch(/--radius:\s*0(px)?\s*;/)
    expect(styles).not.toContain('preset «')
  })

  // ── Spec 69: la familia «raptor». Tres pieles maquetadas y aprobadas el 2026-08-27 sobre el
  // listado real emitido. Lo que las distingue de cabina y suite: sus superficies se DERIVAN de
  // los tokens del tema en vez de fijar oklch a mano, así que la piel sirve con cualquier tema y
  // el acento es el del tema (`--ring`). Ninguna escribe un naranja literal.
  describe('taller — el marco del estudio', () => {
    it('emite su propio shell: raíl sobre lino, versalita y marcador de acento', async () => {
      const shell = (await emit({ ...base, design: 'taller' })).get(SHELL) ?? ''

      expect(shell).toContain('app-shell-side')
      expect(shell).toContain('app-shell-main')
      // la versalita del raíl, la seña de la casa
      expect(shell).toMatch(/tracking-\[0\.12em\]/)
      // el activo se marca con el acento del TEMA, no con un naranja escrito a mano
      expect(shell).toContain('var(--shell-accent)')
      expect(shell).not.toMatch(/#f15539|#d75f3d/)
    })

    it('deriva sus superficies del tema: la piel sirve con cualquiera de los siete', async () => {
      const styles = (await emit({ ...base, design: 'taller' })).get(STYLES) ?? ''
      const block = themeBlock(styles)

      // dentro del bloque del tema a propósito: en :root suelto var(--muted) no resuelve,
      // porque el tema se declara sobre el <body> (la trampa de la spec 67)
      expect(block).toMatch(/--shell-bg:\s*var\(--muted\)/)
      expect(block).toMatch(/--shell-accent:\s*var\(--ring\)/)
      // y NINGUNO de sus tokens de piel lleva un color literal: todos salen del tema
      const skinTokens = [...block.matchAll(/(--shell-[a-z-]+):\s*([^;]+);/g)].map(m => m[2])
      expect(skinTokens.length).toBeGreaterThan(0)
      for (const value of skinTokens) {
        expect(value).toMatch(/var\(--/)
        expect(value).not.toMatch(/#[0-9a-f]{3,8}|oklch\(/i)
      }
      // y por eso NO necesita gemelas bajo .dark: los tokens del tema ya tienen su valor de noche
      expect(styles).not.toMatch(/\.dark[\s\S]*--shell-bg/)
    })

    // La línea «papelería» (2026-08-27, tras la revisión de Alfonso: «los componentes siguen
    // siendo muy parecidos… si en uno tiene los bordes redondeados en otro son puntiagudos, pero
    // viene a ser lo mismo»). Lo que separa dos lenguajes de diseño es la ANATOMÍA, no el
    // acabado: dónde se sienta la etiqueta, si el campo es una caja o un subrayado, si la
    // sección es una tarjeta o un filete. Todo esto se alcanza con los selectores que ya hay.
    it('sienta la etiqueta EN LÍNEA con el control, no encima', async () => {
      const styles = (await emit({ ...base, design: 'taller' })).get(STYLES) ?? ''
      const field = styles.match(/app-form-field hlm-field \{([^}]*)\}/)?.[1] ?? ''

      expect(field).toMatch(/display:\s*grid/)
      expect(field).toMatch(/grid-template-columns:\s*\d+px 1fr/)
      // el selector tiene que llevar UNA CLASE por delante o pierde contra el `flex` que helm
      // pone en el host: en el emitido las utilidades de Tailwind van sin capa y decide la
      // especificidad (medido en la app construida, 2026-08-27)
      expect(styles).toMatch(/\.app-shell-main app-form-field hlm-field \{/)
      // el error tiene que caer en la columna del control, no bajo la etiqueta
      expect(styles).toMatch(/hlm-field-error[^{]*\{[^}]*grid-column:\s*2/)
    })

    it('el campo es un SUBRAYADO, no una caja', async () => {
      const styles = (await emit({ ...base, design: 'taller' })).get(STYLES) ?? ''
      const input = styles.match(/\[hlminput\],\n\[appinput\] \{([^}]*)\}/)?.[1] ?? ''

      expect(input).toMatch(/border-width:\s*0 0 1px/)
      expect(input).toMatch(/background:\s*transparent/)
    })

    it('la sección es un FILETE, no una tarjeta: el panel pierde la caja', async () => {
      const styles = (await emit({ ...base, design: 'taller' })).get(STYLES) ?? ''
      const panel = styles.match(/\.app-panel \{([^}]*)\}/)?.[1] ?? ''

      expect(panel).toMatch(/box-shadow:\s*none/)
      expect(panel).toMatch(/background:\s*transparent/)
      expect(panel).toMatch(/border-top/)
      // pero la superficie FLOTANTE recupera papel: un diálogo no puede fundirse con el velo
      expect(styles).toMatch(/\.app-float \{[^}]*background:\s*var\(--card\)/)
    })

    it('el botón secundario es TEXTO y el estado un punto, no una píldora', async () => {
      const styles = (await emit({ ...base, design: 'taller' })).get(STYLES) ?? ''

      // y excluye a los rellenos: la base de spartan pone una clase de borde en todos sus botones,
      // así que sin el :not() la regla se llevaba el relleno del CTA (visto en la app construida)
      expect(styles).toMatch(/\[appbtn\]\.border:not\(\.bg-primary\)[^{]*\{[^}]*border-width:\s*0/)
      expect(styles).toMatch(/\[appbadge\][^{]*\{[^}]*background:\s*transparent/)
      expect(styles).toMatch(/\[appbadge\]::before[^{]*\{[^}]*content/)
    })

    it('los ICONOS también son de la piel: trazo fino y remate a escuadra', async () => {
      const styles = (await emit({ ...base, design: 'taller' })).get(STYLES) ?? ''

      // ng-icons resuelve el grosor con var(--ng-icon__stroke-width, 2): es la palanca
      expect(styles).toMatch(/--ng-icon__stroke-width:\s*1\.\d+/)
      expect(styles).toMatch(/stroke-linecap:\s*butt/)
    })

    it('no aplana las esquinas por token: la identidad no está en la esquina', async () => {
      const styles = (await emit({ ...base, design: 'taller' })).get(STYLES) ?? ''

      expect(themeBlock(styles)).not.toMatch(/--radius:\s*0(px|rem)?\s*;/)
    })
  })

  describe('banco — banco de trabajo', () => {
    it('emite raíl estrecho y barra de ruta: la misma casa que taller, apretada', async () => {
      const shell = (await emit({ ...base, design: 'banco' })).get(SHELL) ?? ''

      expect(shell).toContain('app-shell-side')
      // la barra de ruta arriba, como cabina, pero sin invertir el raíl a contraste
      expect(shell).toContain('app-shell-topbar')
      expect(shell).toContain('currentSection')
      expect(shell).not.toMatch(/#f15539|#d75f3d/)
    })

    it('aplana las esquinas a 6px por token, no selector por selector', async () => {
      const styles = (await emit({ ...base, design: 'banco' })).get(STYLES) ?? ''
      const block = themeBlock(styles)

      // los cinco radios, uno a uno: los del tema son calc(var(--radius) - 4px) y pisar
      // sólo --radius los dejaría negativos (lección de cabina)
      for (const token of ['--radius', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl']) {
        expect(block).toMatch(new RegExp(`${token}:\\s*6px`))
      }
    })

    it('aprieta la tabla y le pone cabecera en banda, como la maqueta', async () => {
      const styles = (await emit({ ...base, design: 'banco' })).get(STYLES) ?? ''

      expect(styles).toMatch(/\.app-shell-main table th\s*\{[^}]*text-transform:\s*uppercase/)
      expect(styles).toMatch(/\.app-shell-main table th\s*\{[^}]*background:\s*var\(--shell-bg\)/)
      expect(styles).toMatch(/\.app-shell-main table td\s*\{[^}]*font-size/)
    })

    it('funde los KPIs y deja las etiquetas en contorno', async () => {
      const styles = (await emit({ ...base, design: 'banco' })).get(STYLES) ?? ''

      expect(styles).toMatch(/\.app-panel \{[^}]*box-shadow:\s*none/)
      expect(styles).toMatch(/\[hlmbadge\][^}]*background:\s*transparent/i)
    })
  })

  describe('rotulo — la marca al frente', () => {
    it('emite banda de tinta con la navegación dentro, no barra lateral', async () => {
      const shell = (await emit({ ...base, design: 'rotulo' })).get(SHELL) ?? ''

      expect(shell).toContain('app-shell-banner')
      expect(shell).not.toContain('app-shell-side')
      // la navegación vive EN la banda: ni pestañas de módulo aparte (eso es suite) ni raíl
      expect(shell).toContain('app-shell-nav')
      expect(shell).not.toContain('app-shell-modules')
    })

    it('pone el logotipo y el CTA en el acento del TEMA, no en un naranja escrito a mano', async () => {
      const files = await emit({ ...base, design: 'rotulo' })
      const shell = files.get(SHELL) ?? ''
      const styles = files.get(STYLES) ?? ''

      expect(shell).toContain('var(--shell-accent)')
      expect(shell).not.toMatch(/#f15539|#d75f3d/)
      // es la única piel de la familia con el CTA en el acento: el resto lo deja en tinta
      expect(styles).toMatch(/\[hlmbtn\][^}]*var\(--shell-accent\)/i)
      expect(styles).not.toMatch(/#f15539|#d75f3d/)
    })

    it('la banda sigue siendo tinta de noche: es la excepción declarada de la familia', async () => {
      const styles = (await emit({ ...base, design: 'rotulo' })).get(STYLES) ?? ''

      // ningún token del tema es oscuro en los dos modos, así que la banda va literal y con
      // su gemela bajo .dark — y queda escrito por qué
      expect(styles).toMatch(/--banner-bg:\s*oklch/)
      expect(styles).toMatch(/\.dark[\s\S]*--banner-bg/)
    })

    it('respira: KPIs y cifras más grandes que en el resto de la familia', async () => {
      const styles = (await emit({ ...base, design: 'rotulo' })).get(STYLES) ?? ''
      const metric = styles.match(/\.app-metric \{([^}]*)\}/)?.[1] ?? ''

      expect(metric).toMatch(/font-size:\s*2(\.\d+)?rem/)
    })
  })

  it('un diseño desconocido falla antes de emitir nada', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const preexisting = tree.listChanges().length

    await expect(appGenerator(tree, { ...base, design: 'brutalista' })).rejects.toThrow(/design/i)
    expect(tree.listChanges()).toHaveLength(preexisting)
  })
})
