import { Schema } from 'mongoose'
import { Nullable } from '../../../../../../shared/domain/types'

// El _id del documento lo genera Mongo (ObjectId) y NO se declara aquí a propósito: así
// el mapper no puede filtrarlo a la API. La identidad de negocio es el campo `id`.
export interface ProjectDoc {
  id: string
  customerId: string
  customerName: string
  name: string
  description: string
  startDate: Nullable<string>
  endDate: Nullable<string>
  status: string
  implementer: string
  origin: string
  lifecycleStatus: string
  archivedAt: Nullable<Date>
  lastSeenInSyncAt: Nullable<Date>
  sapProjectId: Nullable<string>
  atRisk: Nullable<string>
  inEscalation: Nullable<string>
  nbrOfWaves: Nullable<number>
  waveStage: Nullable<string>
  waveStatus: Nullable<string>
  planToGoLive: Nullable<string>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Nullable<Date>
}

export const ProjectSchema = new Schema<ProjectDoc>(
  {
    id: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    status: { type: String, default: 'planning' },
    implementer: { type: String, default: 'AVVALE' },
    origin: { type: String, default: 'MANUAL' },
    lifecycleStatus: { type: String, default: 'active' },
    archivedAt: { type: Date, default: null },
    lastSeenInSyncAt: { type: Date, default: null },
    sapProjectId: { type: String, default: null },
    atRisk: { type: String, default: null },
    inEscalation: { type: String, default: null },
    nbrOfWaves: { type: Number, default: null },
    waveStage: { type: String, default: null },
    waveStatus: { type: String, default: null },
    planToGoLive: { type: String, default: null },
    deletedAt: { type: Date, default: null }
  },
  {
    collection: 'projects',
    // equivalente a las columnas de auditoría de TypeORM
    timestamps: true,
    versionKey: false
  }
)

// Unicidad: el índice parcial es el equivalente al partial unique index de Postgres
// (los documentos que traen el campo vacío no chocan entre sí)
ProjectSchema.index({ id: 1 }, { unique: true })
ProjectSchema.index({ name: 1 }, { unique: true })
