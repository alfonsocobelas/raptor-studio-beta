/** Lo que devuelve execFile cuando el generador no termina bien. */
export interface GenerationError {
  killed?: boolean
  signal?: string | null
  message?: string
}

/**
 * Un timeout deja una carpeta a medias que PARECE una app generada (defecto 16):
 * medio node_modules, sin componentes de UI, sin arrancar. Decirlo explícitamente
 * evita que alguien la dé por buena y se ponga a parchearla a mano.
 */
export function describeGenerationFailure(error: GenerationError): string {
  if (error.killed) {
    return (
      'La generación superó el tiempo máximo y se detuvo: el directorio ha quedado INCOMPLETO ' +
      '(a medias, no es una app generada). Bórralo y vuelve a generar.'
    )
  }
  return error.message ?? 'La generación falló sin mensaje del proceso.'
}
