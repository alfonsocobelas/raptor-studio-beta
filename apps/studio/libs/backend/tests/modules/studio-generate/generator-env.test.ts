import { generatorEnv } from '@app/backend/contexts/studio/generate/generator-args'

/**
 * El generador murió en la máquina de Alfonso (2026-08-20) sin llegar a entrar en el
 * generador: Nx aísla sus plugins en workers hijo y aborta si uno no responde en 10 s, y con
 * la máquina cargada no responden. El error no dice nada del acelerador —habla de plugins de
 * Nx— así que parece un fallo del proveedor de infraestructura y no lo es.
 *
 * El propio Nx desactiva el aislamiento cuando detecta que corre dentro de un agente; el
 * estudio, que lanza generaciones largas desde un servidor, tiene el mismo motivo.
 */
describe('entorno con el que el estudio lanza el generador', () => {
  it('desactiva el aislamiento de plugins de Nx, que muere por timeout en máquinas cargadas', () => {
    expect(generatorEnv({ PATH: '/usr/bin' })['NX_ISOLATE_PLUGINS']).toBe('false')
  })

  it('conserva el resto del entorno: el generador necesita PATH, HOME y lo que traiga el host', () => {
    const env = generatorEnv({ PATH: '/usr/bin', HOME: '/Users/x', ACELERADOR_ROOT: '/repo' })

    expect(env['PATH']).toBe('/usr/bin')
    expect(env['HOME']).toBe('/Users/x')
    expect(env['ACELERADOR_ROOT']).toBe('/repo')
  })

  it('respeta una decisión explícita de quien arrancó el estudio', () => {
    expect(generatorEnv({ NX_ISOLATE_PLUGINS: 'true' })['NX_ISOLATE_PLUGINS']).toBe('true')
  })
})
