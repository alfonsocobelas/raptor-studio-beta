/** Una etapa reconocida en la salida del generador. */
export interface Progress {
  step: string
  /** Fichero escrito, cuando la línea lo declara */
  file?: string
}

/**
 * Traduce una línea de la salida del generador a la etapa que está ocurriendo.
 * Se lee de la salida REAL en vez de simular una barra que avanza sola: durante
 * los dos minutos que tarda, lo único honesto que se puede mostrar es lo que
 * está pasando de verdad.
 */
export function describeProgress(line: string): Progress | null {
  const text = line.trim()
  if (!text) return null

  if (/^(ERROR|error|npm ERR!)/.test(text)) return { step: 'Error' }
  if (text.startsWith('CREATE ')) return { step: 'Escribiendo el código', file: text.slice('CREATE '.length) }
  if (text.startsWith('UPDATE ') || text.startsWith('DELETE ')) return { step: 'Ajustando la configuración' }
  if (/^added \d+ packages|^npm (warn|notice)|packages are looking for funding/.test(text)) {
    return { step: 'Instalando dependencias' }
  }
  if (/Generating @acc\/generators/.test(text)) return { step: 'Preparando el generador' }

  return null
}
