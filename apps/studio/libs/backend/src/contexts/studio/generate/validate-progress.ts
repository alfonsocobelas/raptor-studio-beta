/**
 * La fase «Validando la app» de la obra (spec 75): las comprobaciones que se corren
 * sobre la app emitida, en orden y secuenciales. Son los scripts que la propia app
 * declara en su package.json (skeleton del generador) — la obra no inventa comandos.
 * La integración queda fuera a propósito: exige base de datos y aquí no hay Docker.
 */
export type CheckName = 'typecheck' | 'unit' | 'front'
export type CheckStatus = 'running' | 'ok' | 'failed'

export interface ValidationCheck {
  name: CheckName
  command: string
  args: string[]
  /** Etiqueta legible para la fila de la fase en la pantalla de obra */
  label: string
}

export const VALIDATION_CHECKS: ValidationCheck[] = [
  { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'], label: 'Typecheck' },
  { name: 'unit', command: 'npm', args: ['test'], label: 'Tests de backend' },
  { name: 'front', command: 'npm', args: ['run', 'test:front'], label: 'Tests de frontend' }
]

export type ValidateEvent =
  | { type: 'check'; name: CheckName; status: CheckStatus }
  | { type: 'done'; ok: boolean; failedCheck?: CheckName; suspects?: string[]; output: string }
