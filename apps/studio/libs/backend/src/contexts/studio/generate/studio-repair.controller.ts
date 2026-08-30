import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { IsString } from 'class-validator'
import { spawn } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import * as path from 'path'
import { killGroup } from './cancel-cleanup'
import { describeFillLine } from './fill-progress'
import { generatorEnv } from './generator-args'
import { insideWorkspace } from './workspace-guard'

class RepairRequestDto {
  /** Directorio de la app emitida, relativo al workspace ('apps/mi-app') */
  @IsString()
  directory!: string

  /** La salida del fallo de validación: decide qué huecos están implicados */
  @IsString()
  report!: string
}

/**
 * La fase «Reparando huecos» de la obra (spec 75): lanza fill-flow-slots en modo repair
 * con el informe del fallo — el generador re-propone SOLO los huecos IA rellenos citados
 * en él, cada uno bajo su gate, y jamás toca el código canónico. La consola es la misma
 * que la del relleno, así que se traduce con describeFillLine.
 */
@Controller('studio/repair')
export class StudioRepairController {
  private readonly acceleratorRoot =
    process.env['ACELERADOR_ROOT'] ?? path.resolve(__dirname, '../../../../../../../..')

  @Post('stream')
  async stream(@Body() body: RepairRequestDto, @Res() res: Response): Promise<void> {
    insideWorkspace(this.acceleratorRoot, body.directory)
    if (!body.report.trim()) {
      throw new BadRequestException('Sin informe del fallo no hay reparación que acotar')
    }

    // el informe viaja por fichero DENTRO del workspace: el árbol de Nx no ve un tmpdir
    // del sistema y el generador lo lee de ahí
    const reportDir = path.join(this.acceleratorRoot, 'tmp/studio-repair')
    mkdirSync(reportDir, { recursive: true })
    const reportFile = path.join(reportDir, `report-${process.pid}-${Date.now()}.txt`)
    writeFileSync(reportFile, body.report)

    res.setHeader('Content-Type', 'application/x-ndjson')
    res.setHeader('Cache-Control', 'no-cache')
    res.flushHeaders()
    const emit = (event: Record<string, unknown>): void => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    const args = [
      'nx',
      'generate',
      '@raptor/generators:fill-flow-slots',
      `--directory=${body.directory}`,
      '--bridge=tmp/studio-bridge',
      '--repair',
      `--report=${path.relative(this.acceleratorRoot, reportFile)}`,
      '--no-interactive'
    ]
    // grupo propio, como el relleno: el gate de cada hueco lanza build+test como nietos
    const child = spawn('npx', args, { cwd: this.acceleratorRoot, detached: true, env: generatorEnv(process.env) })

    const rejected: { id: string; reason: string }[] = []
    const repaired: string[] = []
    let canonical = false
    let output = ''
    const consume = (chunk: Buffer): void => {
      const text = chunk.toString()
      output += text
      for (const line of text.split('\n')) {
        if (line.startsWith('Sin huecos IA implicados')) {
          canonical = true
          continue
        }
        const event = describeFillLine(line)
        if (!event || event.type === 'baseline') continue
        if (event.status === 'filled') repaired.push(event.id)
        if (event.status === 'rejected') rejected.push({ id: event.id, reason: event.reason })
        emit(event)
      }
    }
    child.stdout.on('data', consume)
    child.stderr.on('data', consume)

    res.on('close', () => {
      if (child.exitCode === null && child.signalCode === null) {
        killGroup(child.pid)
        console.log(`[repair] ${body.directory}: CANCELADO`)
      }
    })

    await new Promise<void>(resolve => {
      child.on('close', code => {
        emit({
          type: 'done',
          ok: code === 0 && !canonical && !rejected.length,
          repaired,
          rejected,
          ...(canonical ? { canonical: true } : {}),
          output
        })
        res.end()
        resolve()
      })
    })
  }
}
