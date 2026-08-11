import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import type { AiSlotRef } from '../resource/ai-slots'
import type { SlotGate } from './fill-flow-slots'

export interface CommandRun {
  ok: boolean
  output: string
}

/** Ejecutar un comando en la app emitida. Se inyecta para poder probar el gate sin npm. */
export type CommandRunner = (command: string, cwd: string) => CommandRun

/** Los scripts que la propia app emitida declara: compilar y su suite unitaria. */
const GATE_COMMANDS = ['npm run typecheck', 'npm test']

/** Cuántas líneas de la salida se reportan: lo justo para ver el error, no un log entero. */
const OUTPUT_LINES = 15

/**
 * El gate determinista de un hueco (spec 39, TASK-12): la app emitida tiene que quedar
 * en verde con SUS propios scripts. Falla al primero — si no compila, correr la suite
 * cuesta minutos para decir lo mismo. Devuelve el motivo, o `undefined` si pasa.
 *
 * Materializa el relleno en disco antes de invocar nada: Nx vuelca el árbol cuando el
 * generador TERMINA, así que un gate que se fiara del árbol compilaría los bytes viejos
 * y daría verde a cualquier cosa. Al acabar deja el fichero como estaba: la escritura
 * definitiva la hace Nx si el hueco se acepta.
 */
export function emittedAppGate(appPath: string, run: CommandRunner = runWithNpm): SlotGate {
  return {
    async run(slot: AiSlotRef, content: string): Promise<string | undefined> {
      const onDisk = readFileSync(slot.file, 'utf-8')
      writeFileSync(slot.file, content)

      try {
        for (const command of GATE_COMMANDS) {
          const result = run(command, appPath)
          if (!result.ok) {
            return `\`${command}\` en rojo:\n${tail(result.output)}`
          }
        }
        return undefined
      } finally {
        writeFileSync(slot.file, onDisk)
      }
    }
  }
}

function tail(output: string): string {
  return output.trimEnd().split('\n').slice(-OUTPUT_LINES).join('\n')
}

/** Adapter fino sobre npm: la salida importa tanto como el código de salida. */
function runWithNpm(command: string, cwd: string): CommandRun {
  try {
    return { ok: true, output: execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }) }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; message?: string }
    return { ok: false, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` || (failure.message ?? 'sin salida') }
  }
}
