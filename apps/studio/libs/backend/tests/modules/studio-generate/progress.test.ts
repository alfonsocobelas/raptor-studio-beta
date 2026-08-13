import { describeProgress } from '@app/backend/contexts/studio/generate/progress'

/**
 * La generación tarda uno o dos minutos y el wizard solo decía «Generando…».
 * Estas son las etapas REALES, leídas de la salida del generador: nada de una
 * barra que avanza sola, que sería mentir sobre el progreso.
 */
describe('describeProgress', () => {
  it('reconoce la escritura de ficheros y los cuenta', () => {
    expect(describeProgress('CREATE apps/backend-api/src/main.ts')).toEqual({
      phase: 'write',
      step: 'Escribiendo el código',
      file: 'apps/backend-api/src/main.ts'
    })
  })

  it('reconoce la instalación de dependencias', () => {
    expect(describeProgress('added 1247 packages in 48s')?.step).toBe('Instalando dependencias')
    expect(describeProgress('npm warn deprecated foo@1.0.0')?.step).toBe('Instalando dependencias')
  })

  it('reconoce el formateo final', () => {
    expect(describeProgress('UPDATE package.json')?.step).toBe('Ajustando la configuración')
  })

  it('reconoce el arranque del generador', () => {
    expect(describeProgress('NX  Generating @acc/generators:app')?.step).toBe('Preparando el generador')
  })

  it('las líneas sin significado no producen etapa: no se inventa progreso', () => {
    expect(describeProgress('')).toBeNull()
    expect(describeProgress('   ')).toBeNull()
  })

  it('un error se reconoce como tal', () => {
    expect(describeProgress('ERROR: something broke')?.step).toBe('Error')
  })

  /**
   * Spec 42: la pantalla pinta una FILA por fase y necesita casar el evento con su fila. La
   * etiqueta en español no sirve de identidad —se puede reescribir sin querer decir otra
   * cosa—, así que cada etapa viaja además con una clave estable.
   */
  describe('la clave de fase', () => {
    it('acompaña a cada etapa reconocida', () => {
      expect(describeProgress('NX  Generating @acc/generators:app')?.phase).toBe('prepare')
      expect(describeProgress('CREATE apps/x/main.ts')?.phase).toBe('write')
      expect(describeProgress('UPDATE package.json')?.phase).toBe('configure')
      expect(describeProgress('DELETE viejo.ts')?.phase).toBe('configure')
      expect(describeProgress('added 1247 packages in 48s')?.phase).toBe('install')
      expect(describeProgress('npm ERR! code E404')?.phase).toBe('error')
    })

    it('la etiqueta en español sigue viajando: nadie se queda sin lo que ya leía', () => {
      expect(describeProgress('CREATE apps/x/main.ts')).toEqual({
        phase: 'write',
        step: 'Escribiendo el código',
        file: 'apps/x/main.ts'
      })
    })
  })

  /** El único número que npm regala: cuántos paquetes acabó instalando. */
  describe('los paquetes instalados', () => {
    it('se leen de la línea que los declara', () => {
      expect(describeProgress('added 1247 packages in 48s')?.packages).toBe(1247)
    })

    it('las demás líneas de instalación no declaran número', () => {
      expect(describeProgress('npm warn deprecated foo@1.0.0')?.packages).toBeUndefined()
      expect(describeProgress('packages are looking for funding')?.packages).toBeUndefined()
    })
  })
})
