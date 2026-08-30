import {
  runValidation,
  VALIDATION_CHECKS,
  type ValidateEvent,
  type ValidationCheck
} from '@app/backend/contexts/studio/generate/validate-progress'

/**
 * Spec 75 TASK-03: el catálogo de comprobaciones de la fase «Validando la app». Son los
 * comandos que la propia app emitida declara en su package.json (skeleton del generador);
 * la integración queda fuera a propósito: exige base de datos y la obra no tiene Docker.
 */
describe('VALIDATION_CHECKS', () => {
  it('valida typecheck, suite unitaria backend y suite frontend, en ese orden', () => {
    expect(VALIDATION_CHECKS.map(check => check.name)).toEqual(['typecheck', 'unit', 'front'])
  })

  it('cada comprobación corre un script que la app emitida declara de sí misma', () => {
    expect(VALIDATION_CHECKS.map(check => [check.command, ...check.args].join(' '))).toEqual([
      'npm run typecheck',
      'npm test',
      'npm run test:front'
    ])
  })

  it('la integración NO está en el catálogo: sin Docker no hay base de datos que arrancar', () => {
    const commands = VALIDATION_CHECKS.map(check => check.args.join(' '))
    expect(commands.some(command => command.includes('integration'))).toBe(false)
  })

  it('cada comprobación lleva etiqueta legible para la fila de la obra', () => {
    for (const check of VALIDATION_CHECKS) {
      expect(check.label.length).toBeGreaterThan(3)
    }
  })
})

/**
 * Spec 75 TASK-04: la orquestación de la validación es pura — recibe quién corre cada
 * comando y quién recibe los eventos. Secuencial, y al primer rojo se para: correr los
 * tests sobre una app que no compila solo añade ruido al informe.
 */
describe('runValidation', () => {
  const runnerThat = (fails?: string) => {
    const ran: string[] = []
    const run = async (check: ValidationCheck): Promise<{ ok: boolean; output: string }> => {
      ran.push(check.name)
      return check.name === fails
        ? { ok: false, output: `FAIL x.process.ts en ${check.name}\n` }
        : { ok: true, output: `${check.name} ok\n` }
    }
    return { ran, run }
  }

  const collect = (): { events: ValidateEvent[]; emit: (event: ValidateEvent) => void } => {
    const events: ValidateEvent[] = []
    return { events, emit: event => events.push(event) }
  }

  it('en verde corre las tres comprobaciones en orden y emite running→ok de cada una', async () => {
    const { ran, run } = runnerThat()
    const { events, emit } = collect()

    const result = await runValidation('apps/demo', emit, run)

    expect(result.ok).toBe(true)
    expect(result.failedCheck).toBeUndefined()
    expect(ran).toEqual(['typecheck', 'unit', 'front'])
    expect(events).toEqual([
      { type: 'check', name: 'typecheck', status: 'running' },
      { type: 'check', name: 'typecheck', status: 'ok' },
      { type: 'check', name: 'unit', status: 'running' },
      { type: 'check', name: 'unit', status: 'ok' },
      { type: 'check', name: 'front', status: 'running' },
      { type: 'check', name: 'front', status: 'ok' }
    ])
  })

  it('al primer rojo se para: no se corren tests sobre lo que no compila', async () => {
    const { ran, run } = runnerThat('typecheck')
    const { events, emit } = collect()

    const result = await runValidation('apps/demo', emit, run)

    expect(result.ok).toBe(false)
    expect(result.failedCheck).toBe('typecheck')
    expect(ran).toEqual(['typecheck'])
    expect(events.at(-1)).toEqual({ type: 'check', name: 'typecheck', status: 'failed' })
  })

  it('la salida acumulada llega en el resultado: es la materia prima del informe y los sospechosos', async () => {
    const { run } = runnerThat('front')
    const { emit } = collect()

    const result = await runValidation('apps/demo', emit, run)

    expect(result.output).toContain('typecheck ok')
    expect(result.output).toContain('unit ok')
    expect(result.output).toContain('FAIL x.process.ts en front')
  })
})
