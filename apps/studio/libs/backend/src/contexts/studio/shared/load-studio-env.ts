import * as dotenv from 'dotenv'
import { existsSync } from 'fs'
import * as path from 'path'

export type ChatMode = 'bridge' | 'anthropic' | 'fake'

export interface StudioEnv {
  /** Modo de chat que quedará activo con el entorno ya cargado */
  mode: ChatMode
  /** Ruta del .env leído, si existía */
  file: string | null
}

/**
 * Carga el `.env` del estudio (git-ignorado) antes de construir los módulos:
 * así la clave del chat no hay que exportarla en cada arranque. Lo que ya venga
 * del entorno MANDA — exportar una clave distinta debe seguir funcionando.
 */
export function loadStudioEnv(root: string): StudioEnv {
  const file = path.join(root, '.env')
  const found = existsSync(file)
  if (found) {
    dotenv.config({ path: file })
  }

  const mode: ChatMode = process.env['STUDIO_CHAT_BRIDGE']
    ? 'bridge'
    : process.env['ANTHROPIC_API_KEY']
      ? 'anthropic'
      : 'fake'

  return { mode, file: found ? file : null }
}
