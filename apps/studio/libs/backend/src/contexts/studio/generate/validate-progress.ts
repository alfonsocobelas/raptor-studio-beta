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

export interface CheckRun {
  ok: boolean
  output: string
}

export type CheckRunner = (check: ValidationCheck, root: string) => Promise<CheckRun>

export interface ValidationResult {
  ok: boolean
  failedCheck?: CheckName
  output: string
}

/**
 * La orquestación de la fase: secuencial y al primer rojo se para — correr los tests
 * sobre una app que no compila solo añade ruido al informe. Pura a propósito: quién
 * corre cada comando (spawn real) y quién recibe los eventos (NDJSON) entran por
 * parámetro, igual que el executor/gate del relleno.
 */
export async function runValidation(
  root: string,
  emit: (event: ValidateEvent) => void,
  run: CheckRunner
): Promise<ValidationResult> {
  let output = ''

  for (const check of VALIDATION_CHECKS) {
    emit({ type: 'check', name: check.name, status: 'running' })
    const result = await run(check, root)
    output += result.output
    if (!result.ok) {
      emit({ type: 'check', name: check.name, status: 'failed' })
      return { ok: false, failedCheck: check.name, output }
    }
    emit({ type: 'check', name: check.name, status: 'ok' })
  }

  return { ok: true, output }
}
