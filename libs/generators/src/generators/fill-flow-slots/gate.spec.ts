import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { emittedAppGate, type CommandRun } from './gate'

/**
 * Spec 39, TASK-12/13: el gate por hueco. La app emitida tiene sus propios scripts
 * (`typecheck` y `test`): el gate los usa, no unos inventados. Falla al primero: si no
 * compila, correr la suite solo cuesta minutos para decir lo mismo.
 *
 * Y compila DE VERDAD: Nx vuelca el árbol cuando el generador termina, así que el gate
 * tiene que poner el fichero en disco antes de invocar nada, y dejarlo como estaba
 * después — de la escritura definitiva se encarga Nx si el hueco se acepta.
 */
describe('emittedAppGate', () => {
  const runner = (results: Record<string, CommandRun> = {}) => {
    const seen: string[] = []
    const observed: string[] = []
    let onRun: (() => void) | undefined
    const run = (command: string): CommandRun => {
      seen.push(command)
      onRun?.()
      return results[command] ?? { ok: true, output: '' }
    }
    return { run, seen, observed, watch: (fn: () => void) => (onRun = fn) }
  }

  const withFile = (content: string) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-gate-'))
    const file = path.join(dir, 'ciclo.process.ts')
    fs.writeFileSync(file, content)
    return { dir, file }
  }

  it('pasa cuando typecheck y test van en verde', async () => {
    const { dir, file } = withFile('viejo\n')
    try {
      const { run, seen } = runner()

      const reason = await emittedAppGate(dir, run).run({ file, id: 'flow-uno' }, 'nuevo\n')

      expect(reason).toBeUndefined()
      expect(seen).toEqual(['npm run typecheck', 'npm test'])
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('materializa el contenido en disco mientras corren los comandos', async () => {
    const { dir, file } = withFile('viejo\n')
    try {
      const { run, observed, watch } = runner()
      watch(() => observed.push(fs.readFileSync(file, 'utf-8')))

      await emittedAppGate(dir, run).run({ file, id: 'flow-uno' }, 'nuevo\n')

      // los comandos vieron el relleno, no los bytes viejos
      expect(observed).toEqual(['nuevo\n', 'nuevo\n'])
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('deja el fichero en disco como estaba, pase o no pase el gate', async () => {
    const cases: Record<string, CommandRun>[] = [{}, { 'npm test': { ok: false, output: 'rojo' } }]
    for (const results of cases) {
      const { dir, file } = withFile('viejo\n')
      try {
        await emittedAppGate(dir, runner(results).run).run({ file, id: 'flow-uno' }, 'nuevo\n')

        expect(fs.readFileSync(file, 'utf-8')).toBe('viejo\n')
      } finally {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    }
  })

  it('si no compila, reporta el motivo con la salida y NO corre la suite', async () => {
    const { dir, file } = withFile('viejo\n')
    try {
      const { run, seen } = runner({
        'npm run typecheck': { ok: false, output: "process.ts(12,5): error TS2304: Cannot find name 'foo'" }
      })

      const reason = await emittedAppGate(dir, run).run({ file, id: 'flow-uno' }, 'nuevo\n')

      expect(reason).toContain('typecheck')
      expect(reason).toContain("error TS2304: Cannot find name 'foo'")
      expect(seen).toEqual(['npm run typecheck'])
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('si la suite se pone roja, reporta el motivo con su salida', async () => {
    const { dir, file } = withFile('viejo\n')
    try {
      const { run } = runner({ 'npm test': { ok: false, output: 'Tests: 1 failed, 331 passed' } })

      const reason = await emittedAppGate(dir, run).run({ file, id: 'flow-uno' }, 'nuevo\n')

      expect(reason).toContain('test')
      expect(reason).toContain('1 failed')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
