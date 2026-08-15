/**
 * Las fases que el generador recorre SIEMPRE, en el orden en que ocurren: prepara, escribe el
 * código, ajusta la configuración y, si toca, instala dependencias. La pantalla de generación
 * (spec 42) las pinta todas desde el principio y casa cada evento con su fila por esta clave y
 * no por la etiqueta en español, que es texto y se puede reescribir.
 */
export type PhaseKey = 'prepare' | 'write' | 'configure' | 'install' | 'error'

/** Una etapa reconocida en la salida del generador. */
export interface Progress {
  phase: PhaseKey
  /** La etiqueta legible, que ya viajaba antes de que existieran las claves */
  step: string
  /** Fichero escrito, cuando la línea lo declara */
  file?: string
  /** Paquetes instalados, cuando npm los declara al terminar */
  packages?: number
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

  if (/^(ERROR|error|npm ERR!)/.test(text)) return { phase: 'error', step: 'Error' }
  if (text.startsWith('CREATE ')) {
    return { phase: 'write', step: 'Escribiendo el código', file: text.slice('CREATE '.length) }
  }
  if (text.startsWith('UPDATE ') || text.startsWith('DELETE ')) {
    return { phase: 'configure', step: 'Ajustando la configuración' }
  }
  if (/^added \d+ packages|^npm (warn|notice)|packages are looking for funding/.test(text)) {
    const added = /^added (\d+) packages/.exec(text)
    return {
      phase: 'install',
      step: 'Instalando dependencias',
      ...(added ? { packages: Number(added[1]) } : {})
    }
  }
  if (/Generating @raptor\/generators/.test(text)) return { phase: 'prepare', step: 'Preparando el generador' }

  return null
}
