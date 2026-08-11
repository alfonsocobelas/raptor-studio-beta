import type { BusinessFlow, FlowNode } from '@acc/schema'

/**
 * El flujo contado en una frase, para leerlo de un vistazo en el inspector.
 *
 * No es el markdown que aterriza en la app generada —eso lo escribe `renderFlows`
 * en el generador, y es un documento con secciones—; esto es la lectura rápida de
 * lo que hay dibujado, para comprobar que el diagrama dice lo que se quería decir.
 */
export function flowToProse(flow: BusinessFlow): string {
  const start = flow.nodes.find(node => node.kind === 'start')
  if (!start) return 'Este flujo está sin inicio: añade por dónde empieza.'

  const byId = new Map(flow.nodes.map(node => [node.id, node]))
  const nombre = (node: FlowNode): string => `«${node.text}»${node.entity ? ` (${node.entity})` : ''}`

  const frases: string[] = []
  const visto = new Set<string>([start.id])
  const cola = [start.id]
  let arranque = `Empieza en ${nombre(start)}`

  while (cola.length) {
    const actual = cola.shift() as string
    const nodo = byId.get(actual)
    if (!nodo) continue
    const salidas = flow.edges.filter(edge => edge.from === actual)

    if (nodo.kind === 'decision' && salidas.length) {
      const ramas = salidas
        .map(edge => {
          const destino = byId.get(edge.to)
          return destino ? `si «${edge.label ?? 'sin etiqueta'}», ${nombre(destino)}` : null
        })
        .filter((rama): rama is string => rama !== null)
      frases.push(`En ${nombre(nodo)}: ${ramas.join('; ')}`)
    } else if (nodo.kind === 'step') {
      frases.push(nombre(nodo))
    } else if (nodo.kind === 'end' && !frases.length && arranque) {
      // el flujo recién creado: inicio y fin, nada en medio
      arranque = `${arranque} y termina en ${nombre(nodo)}`
    }

    for (const edge of salidas) {
      if (visto.has(edge.to)) continue
      visto.add(edge.to)
      cola.push(edge.to)
    }
  }

  const finales = flow.nodes.filter(node => node.kind === 'end' && visto.has(node.id))
  const cierre = frases.length && finales.length ? ` y termina en ${nombre(finales[0])}` : ''
  const lectura = `${arranque}${frases.length ? `. Luego: ${frases.join('. ')}` : ''}${cierre}.`

  // los huérfanos se nombran: una lectura que los omite hace creer que el flujo está completo
  const sueltos = flow.nodes.filter(node => !visto.has(node.id))
  if (!sueltos.length) return lectura
  return `${lectura} Hay ${sueltos.length === 1 ? 'un nodo' : `${sueltos.length} nodos`} sin conectar: ${sueltos
    .map(nombre)
    .join(', ')}.`
}
