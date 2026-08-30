import { Schema } from 'mongoose'
import { Nullable } from '../../../../../../shared/domain/types'

// El _id del documento lo genera Mongo (ObjectId) y NO se declara aquí a propósito: así
// el mapper no puede filtrarlo a la API. La identidad de negocio es el campo `id`.
export interface LicenseDoc {
  id: string
  contractId: string
  customerId: string
  customerName: string
  contractNumber: string
  contractEndDate: Nullable<string>
  metricId: string
  metricName: string
  subSolutionAreaName: string
  metric: string
  licensedUnits: number
  pricePerUnit: number
  status: string
  source: string
  materialId: string
  lifecycleStatus: string
  archivedAt: Nullable<Date>
  lastSeenInSyncAt: Nullable<Date>
  currentUnits: number
  consumptionPct: number
  excessUnits: number
  annualValue: number
  version: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Nullable<Date>
  deletedOp?: Nullable<string>
}

export const LicenseSchema = new Schema<LicenseDoc>(
  {
    id: { type: String, required: true },
    contractId: { type: String },
    customerId: { type: String },
    customerName: { type: String, required: true },
    contractNumber: { type: String },
    contractEndDate: { type: String, default: null },
    metricId: { type: String, default: '' },
    metricName: { type: String },
    subSolutionAreaName: { type: String, default: '' },
    metric: { type: String },
    licensedUnits: { type: Number },
    pricePerUnit: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    source: { type: String, default: 'MANUAL' },
    materialId: { type: String, default: '' },
    lifecycleStatus: { type: String, default: 'active' },
    archivedAt: { type: Date, default: null },
    lastSeenInSyncAt: { type: Date, default: null },
    currentUnits: { type: Number, default: 0 },
    consumptionPct: { type: Number, default: 0 },
    excessUnits: { type: Number, default: 0 },
    annualValue: { type: Number, default: 0 },
    version: { type: Number, required: true, default: 1 },
    deletedAt: { type: Date, default: null },
    deletedOp: { type: String, default: null }
  },
  {
    collection: 'licenses',
    // equivalente a las columnas de auditoría de TypeORM
    timestamps: true,
    versionKey: false
  }
)

// Unicidad: el índice parcial es el equivalente al partial unique index de Postgres
// (los documentos que traen el campo vacío no chocan entre sí)
LicenseSchema.index({ id: 1 }, { unique: true })
