import { Injectable } from '@nestjs/common'
import { BaseCustomError } from '../../../../../shared/domain/errors'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { Project } from '../../domain/project'
import { ImportProjectsInput, ImportProjectsOutput, ImportFailure } from '../dtos/import-projects-input.dto'
import { RegisterProjectUseCase } from './register-project-usecase.service'

/** Tope por petición: un fichero mayor se trocea en el cliente, no aquí. */
const MAX_IMPORT_ROWS = 500

/**
 * Import validado por el DOMINIO (spec 33), en dos fases:
 *  1. Cada fila construye su agregado — los value objects del alta revisan todo y
 *     los errores se acumulan POR FILA. Con uno solo, no se importa nada (422).
 *  2. Con todas limpias, se registra en UNA transacción delegando en el register
 *     de siempre: unicidad, auditoría y persistencia son las mismas del alta manual.
 */
@Injectable()
export class ImportProjectsUseCase {
  constructor(
    private readonly registerProject: RegisterProjectUseCase,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: ImportProjectsInput): Promise<ImportProjectsOutput> {
    if (input.rows.length > MAX_IMPORT_ROWS) {
      return {
        imported: 0,
        failures: [{ row: MAX_IMPORT_ROWS + 1, message: `Import limited to ${MAX_IMPORT_ROWS} rows per request` }]
      }
    }

    const failures: ImportFailure[] = []
    input.rows.forEach((row, index) => {
      try {
        Project.register(row)
      } catch (error) {
        if (!(error instanceof BaseCustomError)) throw error
        failures.push({ row: index + 1, message: error.message })
      }
    })
    if (failures.length) {
      return { imported: 0, failures }
    }

    await this.txManager.runInTransaction(async () => {
      for (const row of input.rows) {
        await this.registerProject.invoke(row)
      }
    })

    return { imported: input.rows.length, failures: [] }
  }
}
