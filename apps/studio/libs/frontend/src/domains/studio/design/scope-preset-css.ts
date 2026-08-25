/**
 * Acota el CSS de un preset de diseño al lienzo del estudio (spec 68).
 *
 * El CSS de un preset está escrito para la app EMITIDA: `:root` lleva sus tokens, `.dark` el
 * modo y `.app-shell-main` el contenedor de las pantallas. En el estudio la app es el LIENZO y
 * todo lo demás es chrome del estudio, que no debe teñirse — de ahí la traducción:
 *
 *   :root                  → <ámbito>          (los tokens cuelgan del lienzo)
 *   .dark …                → <ámbito>.dark …   (el modo de la app dibujada vive en el lienzo)
 *   .app-shell-main …      → <ámbito> …        (el lienzo ES el contenedor de pantallas)
 *   cualquier otro         → <ámbito> …        (se anida)
 *
 * Es un recorrido de bloques, no un regex sobre el fichero: los comentarios se copian intactos
 * (pueden contener algo que parezca un selector) y una at-rule conserva su envoltura y acota lo
 * de dentro. Sigue siendo un lector de CSS pequeño y hecho a mano; el día que un preset escriba
 * anidamiento de verdad, esto es lo primero que hay que revisar (ROADMAP idea 32).
 */
export function scopePresetCss(css: string, scope: string): string {
  return scopeBlock(css, scope)
}

/** Reescribe un selector suelto para que viva bajo el ámbito. */
function scopeSelector(selector: string, scope: string): string {
  const trimmed = selector.trim()
  if (trimmed === ':root' || trimmed === 'html' || trimmed === 'body') return scope
  if (trimmed.startsWith(':root ')) return `${scope} ${trimmed.slice(':root '.length)}`
  if (trimmed === '.dark') return `${scope}.dark`
  if (trimmed.startsWith('.dark ')) return `${scope}.dark ${trimmed.slice('.dark '.length)}`
  if (trimmed === '.app-shell-main') return scope
  if (trimmed.startsWith('.app-shell-main ')) return `${scope} ${trimmed.slice('.app-shell-main '.length)}`
  return `${scope} ${trimmed}`
}

/**
 * Cada línea del prólogo de una regla es un selector de la lista (así los escribe prettier),
 * así que se acota línea a línea y se conserva el sangrado y las comas.
 */
function scopePrelude(prelude: string, scope: string): string {
  return prelude
    .split(',')
    .map(part => {
      const leading = part.match(/^\s*/)?.[0] ?? ''
      return `${leading}${scopeSelector(part, scope)}`
    })
    .join(',')
}

function scopeBlock(css: string, scope: string): string {
  let out = ''
  let index = 0
  let prelude = ''

  while (index < css.length) {
    // los comentarios se copian tal cual: dentro puede haber texto que parezca un selector.
    // Si lo pendiente es sólo espacio, el comentario NO forma parte del selector que viene
    // (era el caso normal, y meterlo en el prólogo dejaba «.app-piel /*…*/ :root {»).
    if (css.startsWith('/*', index)) {
      const close = css.indexOf('*/', index + 2)
      const end = close === -1 ? css.length : close + 2
      const comment = css.slice(index, end)
      if (prelude.trim() === '') {
        out += prelude + comment
        prelude = ''
      } else {
        prelude += comment
      }
      index = end
      continue
    }

    const char = css[index]

    if (char === '{') {
      const close = matchingBrace(css, index)
      const body = css.slice(index + 1, close)
      const head = prelude.trim()
      if (head.startsWith('@')) {
        // una at-rule envuelve reglas: se conserva y se acota su interior
        out += `${prelude}{${scopeBlock(body, scope)}}`
      } else {
        // el espacio antes de la llave se conserva: el CSS emitido lo tiene y así el diff de
        // esta función contra el original es sólo el prefijo
        const trailing = prelude.match(/\s*$/)?.[0] ?? ''
        out += `${scopePrelude(prelude.trimEnd(), scope)}${trailing}{${body}}`
      }
      prelude = ''
      index = close + 1
      continue
    }

    prelude += char
    index += 1
  }

  return out + prelude
}

/** El índice de la llave que cierra la abierta en `open`, contando anidamiento. */
function matchingBrace(css: string, open: number): number {
  let depth = 0
  for (let index = open; index < css.length; index += 1) {
    if (css.startsWith('/*', index)) {
      const close = css.indexOf('*/', index + 2)
      index = close === -1 ? css.length : close + 1
      continue
    }
    if (css[index] === '{') depth += 1
    if (css[index] === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return css.length
}
