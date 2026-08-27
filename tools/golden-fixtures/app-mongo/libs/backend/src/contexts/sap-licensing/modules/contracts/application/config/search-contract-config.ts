import { ContractPrimitiveProps } from '../../domain/contract-types'

type ContractAllowedField = keyof ContractPrimitiveProps

const CONTRACT_ALLOWED_FILTERS: Array<ContractAllowedField> = [
  'id',
  'contractType',
  'status',
  'source',
  'customerId',
  'customerName',
  'contractNumber',
  'startDate'
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

// Lo que el endpoint `aggregate` puede tocar (spec 71). El nombre del campo llega por HTTP y
// termina dentro de la consulta: solo se agrega lo que esta lista declara, y su tipo decide qué
// operaciones son legales (sumar fechas no es una pregunta con respuesta).
const CONTRACT_AGGREGATABLE_FIELDS = {
  nbrOfContracts: 'numeric',
  startDate: 'date',
  endDate: 'date',
  totalValue: 'numeric',
  archivedAt: 'date',
  lastSeenInSyncAt: 'date',
  upcomingMaintenanceEnd: 'date',
  upcomingMaintenanceFee: 'numeric'
} as const satisfies Partial<Record<ContractAllowedField, 'numeric' | 'date'>>

const searchContractConfig = {
  allowedFilters: CONTRACT_ALLOWED_FILTERS,
  allowedOrders: CONTRACT_ALLOWED_ORDERS,
  searchableFields: CONTRACT_SEARCHABLE_FIELDS,
  aggregatableFields: CONTRACT_AGGREGATABLE_FIELDS
} as const

export default searchContractConfig
