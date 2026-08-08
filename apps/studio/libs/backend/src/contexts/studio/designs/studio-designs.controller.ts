import * as path from 'path'
import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Put } from '@nestjs/common'
import { validateDesign } from '../chat/validate-proposal'
import type { DesignPayload } from '../chat/chat.types'
import { assertSlug, deleteDesign, listDesigns, readDesign, writeDesign, type DesignSummary } from './design-files'

/**
 * Historial de diseños (spec 21): REST local sobre `.studio/designs/` del
 * workspace, hermano del contexto generate. Un diseño solo se ESCRIBE si pasa
 * el mismo gate que el chat (validateDesign) — cargar de disco no abre una
 * puerta trasera al lienzo, y guardar tampoco la abre al disco.
 */
@Controller('studio/designs')
export class StudioDesignsController {
  private readonly acceleratorRoot =
    process.env['ACELERADOR_ROOT'] ?? path.resolve(__dirname, '../../../../../../../..')

  @Get()
  list(): DesignSummary[] {
    return listDesigns(this.acceleratorRoot)
  }

  @Get(':slug')
  get(@Param('slug') slug: string): unknown {
    this.guardSlug(slug)
    try {
      return readDesign(this.acceleratorRoot, slug)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      if (message.includes('No existe')) throw new NotFoundException(message)
      throw new BadRequestException(message)
    }
  }

  @Put(':slug')
  save(@Param('slug') slug: string, @Body() design: DesignPayload): { slug: string } {
    this.guardSlug(slug)
    try {
      // el gate ANTES de tocar disco: un diseño inválido deja el fichero previo intacto
      writeDesign(this.acceleratorRoot, slug, validateDesign(design))
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e))
    }
    return { slug }
  }

  @Delete(':slug')
  remove(@Param('slug') slug: string): { slug: string } {
    this.guardSlug(slug)
    deleteDesign(this.acceleratorRoot, slug)
    return { slug }
  }

  private guardSlug(slug: string): void {
    try {
      assertSlug(slug)
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e))
    }
  }
}
