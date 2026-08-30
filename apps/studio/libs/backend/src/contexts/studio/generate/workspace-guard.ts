import { existsSync } from 'fs'
import * as path from 'path'
import { BadRequestException } from '@nestjs/common'

/**
 * El cinturón común de los endpoints que operan sobre una app emitida (relleno,
 * validación, reparación): solo directorios DENTRO del workspace y existentes.
 * Mismo criterio que el borrado de generate.
 */
export function insideWorkspace(acceleratorRoot: string, directory: string): string {
  const root = path.resolve(acceleratorRoot, directory)
  if (!root.startsWith(acceleratorRoot + path.sep) || directory.includes('..')) {
    throw new BadRequestException(`Directorio fuera del workspace: ${directory}`)
  }
  if (!existsSync(root)) {
    throw new BadRequestException(`El directorio '${directory}' no existe`)
  }
  return root
}
