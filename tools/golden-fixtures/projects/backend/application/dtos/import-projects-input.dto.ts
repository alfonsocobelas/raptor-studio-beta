import { RegisterProjectInput } from './register-project-input.dto'

export interface ImportFailure {
  /** Fila del fichero (1 = primera fila de datos) */
  row: number
  message: string
}

export interface ImportProjectsInput {
  rows: RegisterProjectInput[]
}

export interface ImportProjectsOutput {
  imported: number
  failures: ImportFailure[]
}
