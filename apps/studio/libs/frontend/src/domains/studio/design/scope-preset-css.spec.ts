import { DESIGN_PRESETS } from '@raptor/schema'
import { scopePresetCss } from './scope-preset-css'

/**
 * Spec 68: el CSS de un preset está escrito para la app EMITIDA — `:root` para sus tokens,
 * `.dark` para el modo y `.app-shell-main` para el contenedor. En el estudio la app es el
 * lienzo y todo lo demás es chrome del estudio, que no debe teñirse. Esta función es la
 * traducción, y es la única pieza de la spec que puede romper el estudio entero: de ahí un
 * caso por forma de selector y un guardián que exige que NADA salga sin acotar.
 */
describe('scopePresetCss', () => {
  const S = '.app-piel'

  it('los tokens de :root pasan al ámbito del lienzo', () => {
    expect(scopePresetCss(':root {\n  --radius: 0px;\n}', S)).toBe('.app-piel {\n  --radius: 0px;\n}')
  })

  it('.dark se pega al ámbito, no lo precede: el modo de la app vive en el lienzo', () => {
    expect(scopePresetCss('.dark {\n  --shell-bg: red;\n}', S)).toBe('.app-piel.dark {\n  --shell-bg: red;\n}')
    expect(scopePresetCss('.dark [appbadge] {\n  color: red;\n}', S)).toBe(
      '.app-piel.dark [appbadge] {\n  color: red;\n}'
    )
  })

  it('.app-shell-main ES el lienzo: se sustituye, no se anida', () => {
    expect(scopePresetCss('.app-shell-main table td {\n  padding: 0;\n}', S)).toBe(
      '.app-piel table td {\n  padding: 0;\n}'
    )
  })

  it('cualquier otro selector se anida bajo el ámbito', () => {
    expect(scopePresetCss('.app-panel {\n  border-radius: 0;\n}', S)).toBe(
      '.app-piel .app-panel {\n  border-radius: 0;\n}'
    )
    expect(scopePresetCss('[hlmbtn] {\n  border-radius: 0;\n}', S)).toBe('.app-piel [hlmbtn] {\n  border-radius: 0;\n}')
  })

  it('acota TODOS los selectores de una lista, no sólo el primero', () => {
    const out = scopePresetCss('.app-toolbar,\n.app-toolbar button,\ninput.app-toolbar {\n  border-radius: 0;\n}', S)

    expect(out).toBe(
      '.app-piel .app-toolbar,\n.app-piel .app-toolbar button,\n.app-piel input.app-toolbar {\n  border-radius: 0;\n}'
    )
  })

  it('los comentarios viajan intactos, incluso si contienen algo que parece un selector', () => {
    const css = '/* pisa .app-panel y :root, ojo */\n.app-chip {\n  border-radius: 0;\n}'

    expect(scopePresetCss(css, S)).toBe(
      '/* pisa .app-panel y :root, ojo */\n.app-piel .app-chip {\n  border-radius: 0;\n}'
    )
  })

  it('una at-rule conserva su envoltura y acota lo de dentro', () => {
    const css = '@media (min-width: 40rem) {\n  .app-panel {\n    border-radius: 0;\n  }\n}'

    expect(scopePresetCss(css, S)).toContain('@media (min-width: 40rem) {')
    expect(scopePresetCss(css, S)).toContain('.app-piel .app-panel {')
  })

  // El guardián: si un selector se escapara sin acotar, teñiría el estudio entero.
  it.each(DESIGN_PRESETS.filter(preset => preset.css).map(preset => preset.id))(
    'ningún selector del preset «%s» queda sin acotar',
    id => {
      const preset = DESIGN_PRESETS.find(candidate => candidate.id === id)
      const scoped = scopePresetCss(preset?.css ?? '', S)
      const withoutComments = scoped.replace(/\/\*[\s\S]*?\*\//g, '')

      for (const line of withoutComments.split('\n')) {
        const selector = line.trim()
        if (!selector.endsWith('{') || selector.endsWith(',') || selector.startsWith('@')) continue
        expect(selector.startsWith(S)).toBe(true)
      }
      // y las listas: toda línea que acaba en coma es también un selector
      for (const line of withoutComments.split('\n')) {
        const selector = line.trim()
        if (!selector.endsWith(',')) continue
        expect(selector.startsWith(S)).toBe(true)
      }
      // Sobre el CSS sin comentarios, no sobre el bruto: un comentario del preset puede NOMBRAR
      // un selector para explicar por qué está ahí (el de taller explica por qué necesita el
      // prefijo de ámbito) y eso no tiñe nada. Antes esta comprobación lo leía como una fuga.
      expect(withoutComments).not.toContain(':root')
      expect(withoutComments).not.toContain('.app-shell-main')
    }
  )
})
