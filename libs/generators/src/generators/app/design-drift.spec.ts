import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { DESIGN_HOOKS, DESIGN_PRESETS } from '@raptor/schema'

/**
 * Guard de anti-desfase (spec 67). Los presets se congelaron el 2026-08-10 y después llegaron
 * formulario, transiciones, calendario y kanban: cada bloque nuevo nació neutro y nadie se
 * enteró hasta que la app entera resultó idéntica en las tres pieles. Este test es lo que
 * impide que vuelva a pasar, y por eso mira las DOS direcciones:
 *
 *   1. ninguna plantilla frontend con cromo se queda sin hook → un bloque nuevo no puede nacer
 *      neutro sin que la suite lo diga, con el nombre del fichero
 *   2. ningún hook del vocabulario es CSS muerto → si una plantilla deja de usarlo, el preset
 *      no puede seguir vistiéndolo a ciegas (el defecto original era exactamente eso)
 */
describe('hooks de piel — anti-desfase', () => {
  const GENERATORS = join(__dirname, '..')
  /** Cromo que hace visible una superficie: si una plantilla lo escribe, la piel debe alcanzarlo */
  const CHROME = /\brounded-|\bshadow-|\bbg-card\b|\bbg-muted\b|\bbg-popover\b/

  /**
   * Plantillas con cromo que NO necesitan hook, con su motivo. Toda excepción se escribe aquí
   * con su razón al lado; nunca se añade una en silencio. Todas éstas son alcanzables por
   * selector de directiva, que es el otro camino legítimo de la piel.
   */
  const EXEMPT: Record<string, string> = {
    'frontend-kernel/files-ui/spartan/shared/components/data-table.ts.template':
      'la viste .app-shell-main table y sus [hlm*]: es el único componente que ya llevaba directivas',
    'frontend-kernel/files-ui/spartan/shared/components/ui/button.directive.ts.template':
      'ES el contrato [appbtn]; su cromo lo pisa el preset por selector de directiva',
    'frontend-kernel/files-ui/spartan/shared/components/ui/input.directive.ts.template': 'ES el contrato [appinput]',
    'frontend-kernel/files-ui/spartan/shared/components/ui/badge.directive.ts.template': 'ES el contrato [appbadge]'
  }

  const templates = (dir: string): string[] => {
    const entries = readdirSync(dir, { withFileTypes: true })
    return entries.flatMap(entry => {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) return templates(full)
      return entry.name.endsWith('.component.ts.template') || full.includes(`${'shared'}/components/`) ? [full] : []
    })
  }

  /** Las plantillas de pantalla del emitido: bloques del recurso + superficies del kernel */
  const screens = (): { path: string; content: string }[] =>
    [...templates(join(GENERATORS, 'resource')), ...templates(join(GENERATORS, 'frontend-kernel'))]
      .map(path => ({ path: path.slice(GENERATORS.length + 1), content: readFileSync(path, 'utf-8') }))
      .filter(file => file.path.endsWith('.template') && !file.path.includes('.spec.ts'))

  it('ninguna plantilla de pantalla con cromo se queda sin hook de piel', () => {
    const naked = screens()
      .filter(file => CHROME.test(file.content))
      .filter(file => !DESIGN_HOOKS.some(hook => file.content.includes(hook)))
      .map(file => file.path)
      .filter(path => !(path in EXEMPT))

    // si esto falla: la plantilla pinta cromo que ninguna piel puede vestir. Mira la tabla de
    // colocación de .claude/specs/67-pieles-alcanzan-los-bloques/DESIGN.md y ponle sus hooks.
    expect(naked).toEqual([])
  })

  it('ningún hook del vocabulario es CSS muerto: todos se usan en alguna plantilla', () => {
    const all = screens()
      .map(file => file.content)
      .join('\n')

    for (const hook of DESIGN_HOOKS) {
      expect(all).toContain(hook)
    }
  })

  it('los presets sólo visten hooks del vocabulario', () => {
    const declared = DESIGN_PRESETS.flatMap(preset => [...preset.css.matchAll(/\.(app-[a-z-]+)/g)].map(m => m[1]))
      // el shell tiene sus propias clases (app-shell-*), que no son hooks de bloque
      .filter(name => !name.startsWith('app-shell'))

    for (const name of new Set(declared)) {
      expect(DESIGN_HOOKS).toContain(name)
    }
  })
})
