import { Schema } from 'mongoose'
import { Nullable } from '../../../../../../shared/domain/types'

export interface ContactDoc {
  id: string
  name: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}

// El _id del documento lo genera Mongo (ObjectId) y NO se declara aquí a propósito: así
// el mapper no puede filtrarlo a la API. La identidad de negocio es el campo `id`.
export interface CustomerDoc {
  id: string
  sapId: string
  name: string
  taxId: string
  industry: string
  address: string
  phone: string
  notes: string
  city: string
  country: string
  customerType: string
  status: string
  archivedAt: Nullable<Date>
  lastSeenInSyncAt: Nullable<Date>
  version: number
  contacts: ContactDoc[]
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Nullable<Date>
  deletedOp?: Nullable<string>
}

// Subdocumento embebido: sin _id propio — su identidad es el `id` del agregado hijo
const ContactSchema = new Schema<ContactDoc>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: false }
)

export const CustomerSchema = new Schema<CustomerDoc>(
  {
    id: { type: String, required: true },
    sapId: { type: String, required: true },
    name: { type: String, required: true },
    taxId: { type: String, default: '' },
    industry: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    notes: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    customerType: { type: String, required: true },
    status: { type: String, default: 'active' },
    archivedAt: { type: Date, default: null },
    lastSeenInSyncAt: { type: Date, default: null },
    version: { type: Number, required: true, default: 1 },
    contacts: { type: [ContactSchema], default: [] },
    deletedAt: { type: Date, default: null },
    deletedOp: { type: String, default: null }
  },
  {
    collection: 'customers',
    // equivalente a las columnas de auditoría de TypeORM
    timestamps: true,
    versionKey: false
  }
)

// Unicidad: el índice parcial es el equivalente al partial unique index de Postgres
// (los documentos que traen el campo vacío no chocan entre sí)
CustomerSchema.index({ id: 1 }, { unique: true })
CustomerSchema.index({ sapId: 1 }, { unique: true })
CustomerSchema.index({ taxId: 1 }, { unique: true, partialFilterExpression: { taxId: { $gt: '' } } })
