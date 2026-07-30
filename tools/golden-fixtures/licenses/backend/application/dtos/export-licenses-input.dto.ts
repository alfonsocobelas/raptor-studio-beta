import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'

export interface ExportLicensesInput extends UnpaginatedInput {
  health?: string[]
}
