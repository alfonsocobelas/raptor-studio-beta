import { Body, Controller, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { IsString } from 'class-validator'
import { type ChildProcess, spawn } from 'child_process'
import * as path from 'path'
import { killGroup } from './cancel-cleanup'
import { generatorEnv } from './generator-args'
import { implicatedSlotIds } from './implicated-slots'
import { runValidation, type CheckRun, type ValidationCheck } from './validate-progress'
import { insideWorkspace } from './workspace-guard'

class ValidateRequestDto {
  /** Directorio de la app emitida, relativo al workspace ('apps/mi-app') */
  @IsString()
  directory!: string
}

/**
 * La fase «Validando la app» de la obra (spec 75): corre las comprobaciones que la
 * propia app declara (typecheck, jest unit, vitest), secuenciales y al primer rojo se
 * para. El `done` lleva los sospechosos: los huecos IA rellenos citados en el fallo.
 * Sin sospechosos, el rojo es del código canónico y NO se repara — se arregla en el
 * generador. Nunca borra nada: al llegar aquí la app ya existe y ya tiene código bueno.
 */
@Controller('studio/validate')
export class StudioValidateController {
  private readonly acceleratorRoot =
    process.env['ACELERADOR_ROOT'] ?? path.resolve(__dirname, '../../../../../../../..')

  @Post('stream')
  async stream(@Body() body: ValidateRequestDto, @Res() res: Response): Promise<void> {
    const root = insideWorkspace(this.acceleratorRoot, body.directory)

    res.setHeader('Content-Type', 'application/x-ndjson')
    res.setHeader('Cache-Control', 'no-cache')
    res.flushHeaders()
    const emit = (event: Record<string, unknown>): void => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    let current: ChildProcess | undefined
    let cancelled = false
    res.on('close', () => {
      if (current && current.exitCode === null && current.signalCode === null) {
        cancelled = true
        killGroup(current.pid)
        console.log(`[validate] ${body.directory}: CANCELADO`)
      }
    })

    const runCheck = (check: ValidationCheck, cwd: string): Promise<CheckRun> =>
      new Promise(resolve => {
        let output = ''
        // grupo propio, como el relleno: npm lanza a jest/vitest como nietos
        const child = spawn(check.command, check.args, { cwd, detached: true, env: generatorEnv(process.env) })
        current = child
        const consume = (chunk: Buffer): void => {
          output += chunk.toString()
        }
        child.stdout?.on('data', consume)
        child.stderr?.on('data', consume)
        child.on('close', code => resolve({ ok: code === 0, output }))
      })

    const result = await runValidation(root, event => emit(event), runCheck)

    if (cancelled) {
      res.end()
      return
    }

    emit({
      type: 'done',
      ok: result.ok,
      ...(result.failedCheck ? { failedCheck: result.failedCheck } : {}),
      ...(result.ok ? {} : { suspects: implicatedSlotIds(root, result.output) }),
      output: result.output
    })
    res.end()
  }
}
