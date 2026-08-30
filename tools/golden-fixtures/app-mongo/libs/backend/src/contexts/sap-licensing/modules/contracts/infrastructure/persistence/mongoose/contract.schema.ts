import { Schema } from 'mongoose'
import { Nullable } from '../../../../../../shared/domain/types'

// El _id del documento lo genera Mongo (ObjectId) y NO se declara aquí a propósito: así
// el mapper no puede filtrarlo a la API. La identidad de negocio es el campo `id`.
export interface ContractDoc {
  id: string
  contractType: string
  contractNumber: Nullable<string>
  customerId: string
  customerName: string
  cmsCaseId: string
  businessModel: string
  subSolutionAreas: string[]
  nbrOfContracts: number
  isFavorite: boolean
  status: string
  source: string
  startDate: Nullable<string>
  endDate: Nullable<string>
  totalValue: number
  currency: string
  billingFrequency: string
  renewalType: string
  notes: string
  origin: string
  lifecycleStatus: string
  archivedAt: Nullable<Date>
  lastSeenInSyncAt: Nullable<Date>
  supportModel: string
  upcomingMaintenanceEnd: Nullable<string>
  upcomingMaintenanceFee: Nullable<number>
  version: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Nullable<Date>
  deletedOp?: Nullable<string>
}

export const ContractSchema = new Schema<ContractDoc>(
  {
    id: { type: String, required: true },
    contractType: { type: String, required: true },
    contractNumber: { type: String, default: null },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    cmsCaseId: { type: String, default: '' },
    businessModel: { type: String, default: '' },
    subSolutionAreas: { type: [String], default: [] },
    nbrOfContracts: { type: Number, default: 1 },
    isFavorite: { type: Boolean, default: false },
    status: { type: String, default: 'active' },
    source: { type: String, default: 'AVVALE_SOLD' },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    totalValue: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    billingFrequency: { type: String, default: 'yearly' },
    renewalType: { type: String, default: 'manual' },
    notes: { type: String, default: '' },
    origin: { type: String, default: 'MANUAL' },
    lifecycleStatus: { type: String, default: 'active' },
    archivedAt: { type: Date, default: null },
    lastSeenInSyncAt: { type: Date, default: null },
    supportModel: { type: String, default: '' },
    upcomingMaintenanceEnd: { type: String, default: null },
    upcomingMaintenanceFee: { type: Number, default: null },
    version: { type: Number, required: true, default: 1 },
    deletedAt: { type: Date, default: null },
    deletedOp: { type: String, default: null }
  },
  {
    collection: 'contracts',
    // equivalente a las columnas de auditoría de TypeORM
    timestamps: true,
    versionKey: false
  }
)

// Unicidad: el índice parcial es el equivalente al partial unique index de Postgres
// (los documentos que traen el campo vacío no chocan entre sí)
ContractSchema.index({ id: 1 }, { unique: true })
ContractSchema.index({ contractNumber: 1 }, { unique: true })
