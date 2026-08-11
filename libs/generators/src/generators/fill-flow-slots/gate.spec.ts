import { emittedAppGate, type CommandRun } from './gate'

/**
 * Spec 39, TASK-12: el gate por hueco. La app emitida tiene sus propios scripts
 * (`typecheck` y `test`): el gate los usa, no unos inventados. Falla al primero:
 * si no compila, correr la suite solo cuesta minutos para decir lo mismo.
 */
describe('emittedAppGate', () => {
  const runner = (results: Record<string, CommandRun>) => {
    const seen: string[] = []
    const run = (command: string): CommandRun => {
      seen.push(command)
      return results[command] ?? { ok: true, output: '' }
    }
    return { run, seen }
  }

  it('pasa cuando typecheck y test van en verde', async () => {
    const { run, seen } = runner({})

    const gate = emittedAppGate('/tmp/app', run)

    await expect(gate.run({ file: 'f.ts', id: 'flow-uno' })).resolves.toBeUndefined()
    expect(seen).toEqual(['npm run typecheck', 'npm test'])
  })

  it('si no compila, reporta el motivo con la salida y NO corre la suite', async () => {
    const { run, seen } = runner({
      'npm run typecheck': { ok: false, output: "process.ts(12,5): error TS2304: Cannot find name 'foo'" }
    })

    const gate = emittedAppGate('/tmp/app', run)
    const reason = await gate.run({ file: 'f.ts', id: 'flow-uno' })

    expect(reason).toContain('typecheck')
    expect(reason).toContain("error TS2304: Cannot find name 'foo'")
    expect(seen).toEqual(['npm run typecheck'])
  })

  it('si la suite se pone roja, reporta el motivo con su salida', async () => {
    const { run } = runner({ 'npm test': { ok: false, output: 'Tests: 1 failed, 331 passed' } })

    const reason = await emittedAppGate('/tmp/app', run).run({ file: 'f.ts', id: 'flow-uno' })

    expect(reason).toContain('test')
    expect(reason).toContain('1 failed')
  })
})
