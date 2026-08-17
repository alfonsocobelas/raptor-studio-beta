import type { BusinessFlow, FlowNode } from '@raptor/schema'

/**
 * Aperturas corrientes del español: cuando el texto de un PASO empieza por una de
 * ellas y cae en medio de la frase, se le baja la inicial. Es una lista cerrada a
 * propósito — ante la duda se respeta la mayúscula, porque puede ser un nombre
 * propio («Tramitaciones prepara…», «Administración factura…») o un acrónimo.
 *
 * Los finales no pasan por aquí: nombran un estado («Muestra cerrada», «Sin
 * respuesta de Operaciones»), no una acción, y en minúscula se leen peor.
 */
const APERTURAS_CORRIENTES = new Set(
  (
    'a al cada como con cuando de desde el en entre es esta estas este estos está están hasta hay la las los ' +
    'no o para por queda quedan se si sigue siguen sin son sí toda todas todo todos tras un una unas unos ' +
    'vuelve vuelven y ya'
  ).split(' ')
)

/** El texto de un paso tal como se lee en medio de una frase. */
function enMinuscula(texto: string): string {
  const primera = texto.split(' ')[0] ?? ''
  const esAcronimo = primera.length > 1 && primera === primera.toUpperCase()
  if (esAcronimo || !APERTURAS_CORRIENTES.has(primera.toLowerCase())) return texto
  return texto[0].toLowerCase() + texto.slice(1)
}

/**
 * El flujo contado camino a camino, para leerlo de un vistazo en el inspector.
 *
 * No es el markdown que aterriza en la app generada —eso lo escribe `renderFlows`
 * en el generador, y es un documento con secciones—; esto es la lectura rápida de
 * lo que hay dibujado, para comprobar que el diagrama dice lo que se quería decir.
 *
 * La gramática: una frase para el tronco y una frase por decisión, con sus salidas
 * numeradas. Cada nodo se cuenta una sola vez: si un camino desemboca en algo ya
 * contado, lo dice («se vuelve a…», «sigue en…») en vez de repetirlo — así los
 * bucles y las convergencias se leen, no se ocultan. Las comillas se reservan para
 * señalar un nodo que se cuenta en otro sitio; el que se narra ahí mismo va suelto.
 */
export function flowToProse(flow: BusinessFlow): string {
  const start = flow.nodes.find(node => node.kind === 'start')
  if (!start) return 'Este flujo está sin inicio: añade por dónde empieza.'

  const byId = new Map(flow.nodes.map(node => [node.id, node]))
  const salidas = (id: string) => flow.edges.filter(edge => edge.from === id)

  const contado = new Set<string>([start.id])
  const decisiones: FlowNode[] = []

  /** Un camino que desemboca en un nodo ya contado: bucle o convergencia. */
  const vuelta = (nodo: FlowNode): string =>
    nodo.kind === 'decision' ? `se vuelve a «${nodo.text}»` : `sigue en «${nodo.text}»`

  /** Finales y decisiones cierran el tramo lineal: no se sigue narrando a través de ellos. */
  const cierraTramo = (nodo: FlowNode): boolean => nodo.kind === 'end' || nodo.kind === 'decision'

  /**
   * Cómo remata el camino al entrar en `nodo`. Una decisión alcanzada desde el
   * tronco no necesita anuncio —su frase viene justo detrás—, pero desde una rama sí:
   * entre medias pueden contarse otras decisiones encoladas antes.
   */
  const remateDe = (nodo: FlowNode, enRama: boolean): string => {
    if (nodo.kind === 'end') return `termina con ${nodo.text}`
    decisiones.push(nodo)
    return enRama ? `se llega a «${nodo.text}»` : ''
  }

  /** Recorre el tramo lineal que sale de `desde`: los pasos por los que pasa y cómo acaba. */
  const camino = (desde: string, enRama: boolean): { pasos: string[]; remate: string } => {
    const pasos: string[] = []
    let siguiente = salidas(desde)[0]
    while (siguiente) {
      const nodo = byId.get(siguiente.to)
      if (!nodo) break
      if (contado.has(nodo.id)) return { pasos, remate: vuelta(nodo) }
      contado.add(nodo.id)
      if (cierraTramo(nodo)) return { pasos, remate: remateDe(nodo, enRama) }
      pasos.push(enMinuscula(nodo.text))
      siguiente = salidas(nodo.id)[0]
    }
    return { pasos, remate: '' }
  }

  /**
   * Los pasos y su remate como una sola cláusula. Si el último paso ya lleva su propia
   * «y» («se marca la desviación y se repite el análisis»), el remate entra con coma:
   * dos «y» seguidas hacen tropezar la lectura.
   */
  const rematar = (pasos: string[], remate: string): string => {
    const cadena = pasos.join(', ')
    if (!remate || !cadena) return remate || cadena
    return `${cadena}${pasos[pasos.length - 1].includes(' y ') ? ',' : ''} y ${remate}`
  }

  const frases: string[] = []

  const tronco = camino(start.id, false)
  const cuerpo = rematar(tronco.pasos, tronco.remate)
  let apertura = start.text
  if (tronco.pasos.length) apertura += `, entonces ${cuerpo}`
  else if (cuerpo) apertura += ` y ${cuerpo}`
  else if (!salidas(start.id).length) apertura += ' y no lleva a ningún sitio'
  frases.push(`${apertura}.`)

  // las decisiones se cuentan aparte, en el orden en que el recorrido las encuentra
  // (el for..of ve las que remateDe encola mientras se narra: las anidadas también salen)
  for (const decision of decisiones) {
    const ramas: string[] = []
    for (const edge of salidas(decision.id)) {
      const destino = byId.get(edge.to)
      if (!destino) continue
      const etiqueta = edge.label ?? 'sin etiqueta'
      if (contado.has(destino.id)) {
        ramas.push(`${etiqueta}, ${vuelta(destino)}`)
        continue
      }
      contado.add(destino.id)
      if (cierraTramo(destino)) {
        ramas.push(`${etiqueta}, ${remateDe(destino, true)}`)
        continue
      }
      const resto = camino(destino.id, true)
      ramas.push(`${etiqueta}, entonces ${rematar([enMinuscula(destino.text), ...resto.pasos], resto.remate)}`)
    }
    if (ramas.length) frases.push(`${decision.text}: ${ramas.map((rama, i) => `${i + 1}. ${rama}`).join('; ')}.`)
  }

  const lectura = frases.join(' ')

  // los huérfanos se nombran: una lectura que los omite hace creer que el flujo está completo
  const sueltos = flow.nodes.filter(node => !contado.has(node.id))
  if (!sueltos.length) return lectura
  return `${lectura} Hay ${sueltos.length === 1 ? 'un nodo' : `${sueltos.length} nodos`} sin conectar: ${sueltos
    .map(node => `«${node.text}»`)
    .join(', ')}.`
}
