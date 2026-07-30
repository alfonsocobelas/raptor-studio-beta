import { OffsetInput } from '../../../../../shared/domain/query/criteria'

export interface SearchLicensesInput extends OffsetInput {
  health?: string[]
}
