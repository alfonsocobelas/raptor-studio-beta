import { SyncCustomerFailure, SyncCustomerIdentity } from '../dtos/sync-customers-input.dto'

export interface CustomersPayloadOutput {
  customers: SyncCustomerIdentity[]
  failures: SyncCustomerFailure[]
}

// Tipo de cliente en el feed SAP → valor de nuestro dominio. Un valor no contemplado NO se
// inventa: la fila se reporta como failure y el cliente conserva su valor previo.
const CUSTOMER_TYPE_BY_SAP_LABEL: Record<string, string> = {
  Cloud: 'cloud',
  'On-Premise': 'onprem',
  'Cloud / On-Premise': 'hybrid'
}

/**
 * Maps the raw OData payload of CustomerDetailsHeaderNavigationGev (one row per customer:
 * customerId, name, city, country, customerType) into canonical sync customer identities.
 * The name travels raw — CustomerName.create normalizes it when the aggregate is built.
 * Rows without a customerId are skipped; rows whose customerType is not a known SAP label
 * are excluded and reported as failures (we never invent a type).
 */
export class CustomersPayloadMapper {
  static toSyncRecords(rows: Record<string, unknown>[]): CustomersPayloadOutput {
    const customers = new Map<string, SyncCustomerIdentity>()
    const failures: SyncCustomerFailure[] = []

    for (const row of rows) {
      const sapId = String(row.customerId ?? '')
      if (!sapId || customers.has(sapId)) {
        continue
      }

      const rawType = String(row.customerType ?? '')
      const customerType = CUSTOMER_TYPE_BY_SAP_LABEL[rawType]
      if (!customerType) {
        failures.push({ sapId, reason: `Unknown SAP customerType "${rawType}"` })
        continue
      }

      customers.set(sapId, {
        sapId,
        name: String(row.name ?? ''),
        city: String(row.city ?? ''),
        country: String(row.country ?? ''),
        customerType
      })
    }

    return { customers: [...customers.values()], failures }
  }
}
