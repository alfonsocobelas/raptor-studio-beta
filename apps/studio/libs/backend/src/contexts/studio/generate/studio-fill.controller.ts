import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { IsString } from 'class-validator'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import * as path from 'path'
import { killGroup } from './cancel-cleanup'
import { describeFillLine } from './fill-progress'
import { pendingFlowSlotIds } from './pending-slots'

class FillSlotsRequestDto {
  /** Directorio de la app emitida, relativo al workspace ('apps/mi-app') */
  @IsString()
  directory!: string
}

/**
 * El relleno de los pasos de negocio como fase de la obra (spec 45): lanza el generador
 * fill-flow-slots con el PUENTE (tmp/studio-bridge) y traduce su consola a NDJSON. La IA
 * es una sesión de Claude Code respondiendo el puente — aquí no hay SDK ni clave (ADR) —
 * y cada hueco pasa su gate: si nadie responde o el gate se pone rojo, el hueco queda
 * vacío con su motivo y la app exactamente como estaba.
 */
@Controller('studio/fill-slots')
export class StudioFillController {
  private readonly acceleratorRoot =
    process.env['ACELERADOR_ROOT'] ?? path.resolve(__dirname, '../../../../../../../..')

  @Post('stream')
  async stream(@Body() body: FillSlotsRequestDto, @Res() res: Response): Promise<void> {
    const root = this.insideWorkspace(body.directory)

    res.setHeader('Content-Type', 'application/x-ndjson')
    res.setHeader('Cache-Control', 'no-cache')
    res.flushHeaders()
    const emit = (event: Record<string, unknown>): void => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    const pendingBefore = pendingFlowSlotIds(root)
    emit({ type: 'pending', slots: pendingBefore })
    if (!pendingBefore.length) {
      emit({ type: 'done', filled: [], rejected: [], pending: [] })
      res.end()
      return
    }

    const args = [
      'nx',
      'generate',
      '@acc/generators:fill-flow-slots',
      `--directory=${body.directory}`,
      '--bridge=tmp/studio-bridge',
      '--no-interactive'
    ]
    // grupo propio, como generate: el gate de cada hueco lanza build+test como nietos
    const child = spawn('npx', args, { cwd: this.acceleratorRoot, detached: true })

    const rejected: { id: string; reason: string }[] = []
    const filled: string[] = []
    let baseline = false
    let output = ''
    const consume = (chunk: Buffer): void => {
      const text = chunk.toString()
      output += text
      for (const line of text.split('\n')) {
        const event = describeFillLine(line)
        if (!event) continue
        if (event.type === 'baseline') {
          baseline = true
          continue
        }
        if (event.status === 'filled') filled.push(event.id)
        if (event.status === 'rejected') rejected.push({ id: event.id, reason: event.reason })
        emit(event)
      }
    }
    child.stdout.on('data', consume)
    child.stderr.on('data', consume)

    res.on('close', () => {
      if (child.exitCode === null && child.signalCode === null) {
        killGroup(child.pid)
        console.log(`[fill-slots] ${body.directory}: CANCELADO`)
      }
    })

    await new Promise<void>(resolve => {
      child.on('close', code => {
        emit({
          type: 'done',
          ok: code === 0 && !baseline,
          filled,
          rejected,
          pending: pendingFlowSlotIds(root),
          ...(baseline ? { baseline: true } : {}),
          output
        })
        res.end()
        resolve()
      })
    })
  }

  /** Solo se rellena DENTRO del workspace: mismo cinturón que el borrado de generate. */
  private insideWorkspace(directory: string): string {
    const root = path.resolve(this.acceleratorRoot, directory)
    if (!root.startsWith(this.acceleratorRoot + path.sep) || directory.includes('..')) {
      throw new BadRequestException(`Directorio fuera del workspace: ${directory}`)
    }
    if (!existsSync(root)) {
      throw new BadRequestException(`El directorio '${directory}' no existe`)
    }
    return root
  }
}
