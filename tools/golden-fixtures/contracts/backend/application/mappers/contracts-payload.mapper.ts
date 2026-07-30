import { Nullable } from '../../../../../shared/domain/types'
import { SyncContractRecord } from '../dtos/sync-contracts-input.dto'
import type { ContractTypeValue } from '../../domain/value-objects/contract-type.vo'

// SAP marca los contratos sin fecha de fin (abiertos, típico en on-prem) con este centinela.
const OPEN_ENDED_SENTINEL = '1900-01-01'

// Etiqueta de renovación de los feeds SAP (UpcomingCloudRenewals, ISMaintenances) → nuestro enum.
// Un valor no contemplado NO se inventa: la fila se ignora y el contrato conserva su valor actual.
export const RENEWAL_TYPE_BY_SAP_LABEL: Record<string, string> = {
  'Auto Renewal': 'auto',
  'Active Renewal': 'manual'
}

// Intervalo de facturación de ContractsRedesign → nuestro enum. Literales verificados EN VIVO
// contra el partner completo (probe 2026-07-21): Quarterly 44, Yearly 20, Semi-Annual 3,
// 'Not Assigned' 1; sin variante Monthly observada. Un valor no contemplado ('Not Assigned',
// futuros desconocidos) NO se inventa: el campo no se setea y el contrato conserva su valor.
export const BILLING_FREQUENCY_BY_SAP_LABEL: Record<string, string> = {
  'Quarterly (According to Contract Start Date)': 'quarterly',
  'Semi-Annual (According to Contract Start Date)': 'semiannual',
  'Yearly (According to Contract Start Date)': 'yearly'
}

const ISO_CURRENCY_LENGTH = 3

export interface ContractsPayloadOutput {
  contracts: SyncContractRecord[]
  skippedWithoutPeriod: number
}

interface CustomerSummary {
  isFavorite: boolean
  nbrOfContracts: number
}

interface ContractAccumulator {
  customerSapId: string
  customerName: string
  cmsCaseId: string
  businessModel: string
  startDate: Nullable<string>
  endDate: Nullable<string>
  subSolutionAreas: string[]
}

/**
 * Maps the raw OData payloads of CloudActiveSalesContracts (summary) and
 * CloudActiveSalesContractsDetails (per-contract line items) into sync records.
 *
 * The `active` endpoint is aggregated ONE ROW PER CUSTOMER (nbrOfContracts +
 * a single contractId), so it cannot drive contract creation: a customer with
 * several contracts would collapse to one. Contracts are therefore driven by the
 * `details` rows (one contract per distinct contractId with datePeriod CURRENT,
 * merging its line items), and `active` only contributes the customer-level
 * fields (isFavorite, nbrOfContracts) joined by customerId. Contracts whose CURRENT
 * rows carry no start date are dropped (Contract.period requires one) and reported
 * via skippedWithoutPeriod. Customer identity is NOT extracted here (spec 43): it comes
 * from the canonical customers endpoint.
 *
 * The on-prem pair (OnPremiseActiveSalesContracts + Details) shares this exact
 * shape (verified live 2026-07-16), so the same mapper serves both: contractType
 * stamps the origin and the 1900-01-01 sentinel maps to an open-ended contract.
 */
export class ContractsPayloadMapper {
  static toSyncRecords(
    active: Record<string, unknown>[],
    details: Record<string, unknown>[],
    contractType: ContractTypeValue = 'cloud'
  ): ContractsPayloadOutput {
    const summaries = this.customerSummariesById(active)
    const accumulators = this.currentContractsById(details)

    const contracts: SyncContractRecord[] = []
    let skippedWithoutPeriod = 0

    for (const [contractNumber, contract] of accumulators) {
      if (!contract.startDate) {
        skippedWithoutPeriod += 1
        continue
      }

      const summary = summaries.get(contract.customerSapId)
      contracts.push({
        contractType,
        contractNumber,
        customerSapId: contract.customerSapId,
        customerName: contract.customerName,
        cmsCaseId: contract.cmsCaseId,
        businessModel: contract.businessModel,
        subSolutionAreas: contract.subSolutionAreas,
        nbrOfContracts: summary?.nbrOfContracts ?? 1,
        isFavorite: summary?.isFavorite ?? false,
        startDate: contract.startDate,
        endDate: contract.endDate
      })
    }

    return { contracts, skippedWithoutPeriod }
  }

  /**
   * Merges the cloud and on-prem batches into a single sync input. A contract present in
   * BOTH feeds is a real mixed deal (cloud + on-prem components, same contractId in SAP):
   * it becomes ONE record with contractType 'mixed', the per-contract fields from the cloud
   * side (the rich one: full areas, real dates) and the union of subSolutionAreas. The type
   * is recomputed on every run, so cloud↔mixed transitions resolve themselves. Skipped
   * counters add up.
   */
  static merge(cloud: ContractsPayloadOutput, onprem: ContractsPayloadOutput): ContractsPayloadOutput {
    const onpremByNumber = new Map(onprem.contracts.map(contract => [contract.contractNumber, contract]))
    const cloudNumbers = new Set(cloud.contracts.map(contract => contract.contractNumber))

    const contracts: SyncContractRecord[] = cloud.contracts.map(contract => {
      const onpremTwin = onpremByNumber.get(contract.contractNumber)
      if (!onpremTwin) {
        return contract
      }
      return {
        ...contract,
        contractType: 'mixed',
        subSolutionAreas: this.union(contract.subSolutionAreas, onpremTwin.subSolutionAreas)
      }
    })

    for (const contract of onprem.contracts) {
      if (!cloudNumbers.has(contract.contractNumber)) {
        contracts.push(contract)
      }
    }

    return {
      contracts,
      skippedWithoutPeriod: cloud.skippedWithoutPeriod + onprem.skippedWithoutPeriod
    }
  }

  /**
   * Joins UpcomingCloudRenewals rows onto the sync records by SapID (= contractNumber).
   * The feed repeats a contract once per CMSCaseID, so rows are deduped by SapID (first wins).
   * A contract without a renewals row (or with an unknown label — we never invent a value)
   * keeps its current renewalType: the field is simply not set.
   */
  static withRenewals(contracts: SyncContractRecord[], renewalRows: Record<string, unknown>[]): SyncContractRecord[] {
    const renewalBySapId = new Map<string, string>()
    for (const row of renewalRows) {
      const sapId = String(row.SapID ?? '')
      const renewalType = RENEWAL_TYPE_BY_SAP_LABEL[String(row.RenewalType ?? '')]
      if (sapId && renewalType && !renewalBySapId.has(sapId)) {
        renewalBySapId.set(sapId, renewalType)
      }
    }

    return contracts.map(contract => {
      const renewalType = renewalBySapId.get(contract.contractNumber)
      return renewalType ? { ...contract, renewalType } : contract
    })
  }

  /**
   * Joins ContractsRedesign rows onto the sync records by SapID (= contractNumber), taking
   * billingFrequency (label → enum) and currency (DocumentCurrency, passed through when it is
   * a 3-letter code; the ContractCurrency VO does the strong validation). Rows outside the
   * CURRENT period are ignored and repeated SapIDs dedupe first-wins, like withRenewals.
   * A field without a usable value is simply not set: the contract keeps its current one.
   */
  static withBillingAndCurrency(
    contracts: SyncContractRecord[],
    redesignRows: Record<string, unknown>[]
  ): SyncContractRecord[] {
    const billingBySapId = new Map<string, string>()
    const currencyBySapId = new Map<string, string>()
    for (const row of redesignRows) {
      const sapId = String(row.SapID ?? '')
      if (!sapId || String(row.DatePeriod ?? '') !== 'CURRENT') {
        continue
      }
      const billingFrequency = BILLING_FREQUENCY_BY_SAP_LABEL[String(row.BillingIntervalText ?? '')]
      if (billingFrequency && !billingBySapId.has(sapId)) {
        billingBySapId.set(sapId, billingFrequency)
      }
      const currency = String(row.DocumentCurrency ?? '')
      if (currency.length === ISO_CURRENCY_LENGTH && !currencyBySapId.has(sapId)) {
        currencyBySapId.set(sapId, currency)
      }
    }

    return contracts.map(contract => {
      const billingFrequency = billingBySapId.get(contract.contractNumber)
      const currency = currencyBySapId.get(contract.contractNumber)
      if (!billingFrequency && !currency) {
        return contract
      }
      return {
        ...contract,
        ...(billingFrequency ? { billingFrequency } : {}),
        ...(currency ? { currency } : {})
      }
    })
  }

  private static currentContractsById(details: Record<string, unknown>[]): Map<string, ContractAccumulator> {
    const byContract = new Map<string, ContractAccumulator>()

    for (const row of details) {
      if (String(row.datePeriod ?? '') !== 'CURRENT') {
        continue
      }
      const contractNumber = String(row.contractId ?? '')
      if (!contractNumber) {
        continue
      }

      const startDate = String(row.contractStartDate ?? '') || null
      const endDate = this.normalizeEndDate(row.contractEndDate)
      const areas = this.splitAreas(row.subSolutionAreas)

      const existing = byContract.get(contractNumber)
      if (!existing) {
        byContract.set(contractNumber, {
          customerSapId: String(row.customerId ?? ''),
          customerName: String(row.customerName ?? ''),
          cmsCaseId: String(row.cmsCaseId ?? ''),
          businessModel: String(row.businessModel ?? ''),
          startDate,
          endDate,
          subSolutionAreas: areas
        })
        continue
      }

      // Same contract, another line item: take min start, max end, union of areas.
      if (startDate && (existing.startDate === null || startDate < existing.startDate)) {
        existing.startDate = startDate
      }
      if (existing.endDate !== null && (endDate === null || endDate > existing.endDate)) {
        existing.endDate = endDate
      }
      existing.subSolutionAreas = this.union(existing.subSolutionAreas, areas)
    }

    return byContract
  }

  private static customerSummariesById(active: Record<string, unknown>[]): Map<string, CustomerSummary> {
    const summaries = new Map<string, CustomerSummary>()

    for (const row of active) {
      const sapId = String(row.ID ?? '')
      if (!sapId || summaries.has(sapId)) {
        continue
      }
      summaries.set(sapId, {
        isFavorite: Boolean(row.isFavorite ?? false),
        nbrOfContracts: Number(row.nbrOfContracts ?? 1)
      })
    }

    return summaries
  }

  private static normalizeEndDate(value: unknown): Nullable<string> {
    const endDate = String(value ?? '')
    if (!endDate || endDate === OPEN_ENDED_SENTINEL) {
      return null
    }
    return endDate
  }

  private static splitAreas(value: unknown): string[] {
    return String(value ?? '')
      .split(',')
      .map(area => area.trim())
      .filter(area => area.length > 0)
  }

  private static union(first: string[], second: string[]): string[] {
    return [...new Set([...first, ...second])]
  }
}
