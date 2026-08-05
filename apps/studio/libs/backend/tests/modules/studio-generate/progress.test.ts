import { describeProgress } from '@app/backend/contexts/studio/generate/progress'

/**
 * La generación tarda uno o dos minutos y el wizard solo decía «Generando…».
 * Estas son las etapas REALES, leídas de la salida del generador: nada de una
 * barra que avanza sola, que sería mentir sobre el progreso.
 */
describe('describeProgress', () => {
  it('reconoce la escritura de ficheros y los cuenta', () => {
    expect(describeProgress('CREATE apps/backend-api/src/main.ts')).toEqual({
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
})
