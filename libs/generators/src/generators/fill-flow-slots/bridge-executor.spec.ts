import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { bridgeSlotExecutor } from './bridge-executor'

/**
 * Spec 39, TASK-13: el ejecutor real es una sesión de Claude Code al otro lado de un
 * puente de ficheros (mismo protocolo que el chat del estudio), nunca un SDK embebido:
 * el generador sigue sin IA dentro. Escribe la petición y espera la respuesta.
 */
describe('bridgeSlotExecutor', () => {
  const bridge = () => fs.mkdtempSync(path.join(os.tmpdir(), 'acc-bridge-'))
  const SLOT = { file: 'apps/demo/ciclo.process.ts', id: 'flow-revisar' }
  const CURRENT = 'class C {\n  // @ai:begin flow-revisar\n  // @ai:end\n}\n'

  it('escribe la petición con el prompt, el hueco y el fichero actual', async () => {
    const dir = bridge()
    try {
      const executor = bridgeSlotExecutor(dir, { timeoutMs: 50, pollMs: 10 })
      await executor.propose('EL PROMPT', SLOT, CURRENT)

      const request = fs.readdirSync(dir).find(name => name.startsWith('request-'))
      if (!request) throw new Error('no se escribió la petición')
      const payload = JSON.parse(fs.readFileSync(path.join(dir, request), 'utf-8'))

      expect(payload.prompt).toBe('EL PROMPT')
      expect(payload.slot).toEqual(SLOT)
      expect(payload.current).toBe(CURRENT)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('devuelve el fichero candidato que deja la respuesta', async () => {
    const dir = bridge()
    try {
      const executor = bridgeSlotExecutor(dir, { timeoutMs: 2000, pollMs: 10 })
      const candidate = CURRENT.replace('  // @ai:end', '  const x = 1\n  // @ai:end')

      // el que responde llega después de ver la petición: se simula en paralelo
      const answering = (async () => {
        for (let i = 0; i < 100; i++) {
          const request = fs.readdirSync(dir).find(name => name.startsWith('request-'))
          if (request) {
            const id = request.replace('request-', '').replace('.json', '')
            fs.writeFileSync(path.join(dir, `response-${id}.json`), JSON.stringify({ file: candidate }))
            return
          }
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      })()

      const [proposed] = await Promise.all([executor.propose('p', SLOT, CURRENT), answering])

      expect(proposed).toBe(candidate)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('acepta también una respuesta que solo trae el cuerpo del hueco', async () => {
    const dir = bridge()
    try {
      const executor = bridgeSlotExecutor(dir, { timeoutMs: 2000, pollMs: 10 })

      const answering = (async () => {
        for (let i = 0; i < 100; i++) {
          const request = fs.readdirSync(dir).find(name => name.startsWith('request-'))
          if (request) {
            const id = request.replace('request-', '').replace('.json', '')
            fs.writeFileSync(path.join(dir, `response-${id}.json`), JSON.stringify({ body: '  const x = 1\n' }))
            return
          }
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      })()

      const [proposed] = await Promise.all([executor.propose('p', SLOT, CURRENT), answering])

      expect(proposed).toContain('  const x = 1\n  // @ai:end')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('sin respuesta a tiempo no propone nada (y el hueco se queda como está)', async () => {
    const dir = bridge()
    try {
      const executor = bridgeSlotExecutor(dir, { timeoutMs: 60, pollMs: 10 })

      await expect(executor.propose('p', SLOT, CURRENT)).resolves.toBeUndefined()
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('ignora una respuesta preescrita: solo vale la posterior a la petición', async () => {
    const dir = bridge()
    try {
      // sobrante de otra sesión, con el id que tocaría: no debe colarse
      fs.writeFileSync(path.join(dir, `response-${process.pid}-1.json`), JSON.stringify({ body: '  robado()\n' }))
      const executor = bridgeSlotExecutor(dir, { timeoutMs: 60, pollMs: 10 })

      await expect(executor.propose('p', SLOT, CURRENT)).resolves.toBeUndefined()
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
