import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator'
import { execFile } from 'child_process'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { buildAppFile } from './build-app-file'
import { validateDesign } from '../chat/validate-proposal'
import type { DesignPayload } from '../chat/chat.types'
import {
  DATABASE_VALUES,
  PLUGIN_VALUES,
  UI_VALUES,
  buildGeneratorArgs
} from './generator-args'

class GenerateRequestDto {
  @IsString()
  name!: string

  @IsIn(UI_VALUES as readonly string[])
  ui!: string

  @IsIn(DATABASE_VALUES as readonly string[])
  database!: string

  @IsArray()
  @IsIn(PLUGIN_VALUES as readonly string[], { each: true })
  plugins!: string[]

  @IsObject()
  design!: DesignPayload

  @IsOptional()
  @IsBoolean()
  skipInstall?: boolean

  @IsOptional()
  @IsString()
  directory?: string
}

export interface GenerateResult {
  ok: boolean
  output: string
  root: string
  /** Milisegundos de reloj que tardó el generador (alimenta la vista de progreso) */
  elapsedMs: number
}

/**
 * Generación in situ (fase F, opción 1): el backend LOCAL ejecuta el generador
 * sobre el workspace del acelerador — el navegador no toca disco ni procesos.
 * El schema pasa el mismo gate que el chat antes de escribirse a fichero.
 */
@Controller('studio/generate')
export class StudioGenerateController {
  private readonly acceleratorRoot = process.env['ACELERADOR_ROOT'] ?? path.resolve(__dirname, '../../../../../../../..')

  @Post()
  async generate(@Body() body: GenerateRequestDto): Promise<GenerateResult> {
    const design = (() => {
      try {
        return validateDesign({ ...body.design, appName: body.name })
      } catch (e) {
        throw new BadRequestException(`El diseño no pasa el gate: ${e instanceof Error ? e.message : String(e)}`)
      }
    })()
    const appFileContent = buildAppFile(design, body.name)

    const appFile = path.join(mkdtempSync(path.join(tmpdir(), 'studio-gen-')), `${body.name}.app.json`)
    let args: string[]
    try {
      args = buildGeneratorArgs({ ...body, appFile })
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e))
    }
    writeFileSync(appFile, JSON.stringify(appFileContent, null, 2))

    const startedAt = process.hrtime.bigint()
    return new Promise<GenerateResult>(resolve => {
      execFile(
        'npx',
        args,
        { cwd: this.acceleratorRoot, timeout: 15 * 60 * 1000, maxBuffer: 32 * 1024 * 1024 },
        (error, stdout, stderr) => {
          const elapsedMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n)
          const output = `$ npx ${args.join(' ')}\n\n${stdout}${stderr}`
          console.log(`[generate] ${body.name}: ${error ? 'FALLÓ' : 'OK'} en ${(elapsedMs / 1000).toFixed(1)} s`)
          resolve({
            ok: !error,
            output: error ? `${output}\n${error.message}` : output,
            root: path.join(this.acceleratorRoot, body.directory ?? path.join('apps', body.name)),
            elapsedMs
          })
        }
      )
    })
  }
}
