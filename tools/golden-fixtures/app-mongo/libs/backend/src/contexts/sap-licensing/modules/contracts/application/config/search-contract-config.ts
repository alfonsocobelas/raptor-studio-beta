import { ContractPrimitiveProps } from '../../domain/contract-types'

type ContractAllowedField = keyof ContractPrimitiveProps

const CONTRACT_ALLOWED_FILTERS: Array<ContractAllowedField> = [
  'id',
  'contractType',
  'status',
  'source',
  'customerId',
  'customerName',
  'contractNumber'
] as const

const CONTRACT_ALLOWED_ORDERS: Array<ContractAllowedField> = [
  'contractNumber',
  'customerName',
  'startDate',
  'endDate',
  'totalValue',
  'status'
] as const

// Free-text columns only: badge/enum columns (status, source…) store values that differ from their
// rendered labels, and numeric/date columns match inconsistently against what the user sees.
const CONTRACT_SEARCHABLE_FIELDS: Array<ContractAllowedField> = ['contractNumber', 'customerName', 'cmsCaseId'] as const

const searchContractConfig = {
  allowedFilters: CONTRACT_ALLOWED_FILTERS,
  allowedOrders: CONTRACT_ALLOWED_ORDERS,
  searchableFields: CONTRACT_SEARCHABLE_FIELDS
} as const

export default searchContractConfig
