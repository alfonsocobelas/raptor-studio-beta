import { v7 as uuidv7 } from 'uuid'
import { License } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/license'
import { LicensePrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/license-types'
import { AnnualValue } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/annual-value.vo'
import { LicenseMetric } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/license-metric.vo'
import { LicenseStatus } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/license-status.vo'
import { LicensedUnits } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/licensed-units.vo'
import { MetricId } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/metric-id.vo'
import { MetricName } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/metric-name.vo'
import { PricePerUnit } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/price-per-unit.vo'
import { SubSolutionAreaName } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/sub-solution-area-name.vo'
import { ContractDate } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/customer-name.vo'
import { LicenseId } from '../../../../../src/contexts/shared/domain/value-objects/licenses/license-id.vo'
import { ContractId } from '../../../../../src/contexts/shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../../src/contexts/shared/domain/value-objects/customers/customer-id.vo'

export class LicenseBuilder {
  private props: LicensePrimitiveProps = {
    id: uuidv7(),
    contractId: uuidv7(),
    customerId: uuidv7(),
    customerName: 'CustomerName 1',
    contractNumber: 'ContractNumber 1',
    contractEndDate: '2027-01-14',
    metricId: '',
    metricName: 'MetricName 1',
    subSolutionAreaName: '',
    metric: 'FUE',
    licensedUnits: 1,
    pricePerUnit: 0,
    status: 'active',
    source: 'MANUAL',
    materialId: '',
    lifecycleStatus: 'active',
    archivedAt: null,
    lastSeenInSyncAt: null,
    currentUnits: 0,
    consumptionPct: 0,
    excessUnits: 0,
    annualValue: 0
  }

  static aLicense(): LicenseBuilder {
    return new LicenseBuilder()
  }

  withId(id: string): LicenseBuilder {
    this.props.id = id
    return this
  }

  withContractId(contractId: string): LicenseBuilder {
    this.props.contractId = contractId
    return this
  }

  withCustomerId(customerId: string): LicenseBuilder {
    this.props.customerId = customerId
    return this
  }

  withMetric(metric: string): LicenseBuilder {
    this.props.metric = metric
    return this
  }

  withStatus(status: string): LicenseBuilder {
    this.props.status = status
    return this
  }

  withSource(source: string): LicenseBuilder {
    this.props.source = source
    return this
  }

  withLifecycleStatus(lifecycleStatus: string): LicenseBuilder {
    this.props.lifecycleStatus = lifecycleStatus
    return this
  }

  withProps(overrides?: Partial<LicensePrimitiveProps>): LicenseBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): License {
    return License.create({
      id: LicenseId.create(this.props.id),
      contractId: ContractId.create(this.props.contractId),
      customerId: CustomerId.create(this.props.customerId),
      customerName: CustomerName.create(this.props.customerName),
      contractNumber: ContractNumber.create(this.props.contractNumber),
      contractEndDate: ContractDate.create(this.props.contractEndDate),
      metricId: MetricId.create(this.props.metricId),
      metricName: MetricName.create(this.props.metricName),
      subSolutionAreaName: SubSolutionAreaName.create(this.props.subSolutionAreaName),
      metric: LicenseMetric.create(this.props.metric),
      licensedUnits: LicensedUnits.create(this.props.licensedUnits),
      pricePerUnit: PricePerUnit.create(this.props.pricePerUnit),
      status: LicenseStatus.create(this.props.status),
      materialId: this.props.materialId ?? '',
      currentUnits: this.props.currentUnits,
      consumptionPct: this.props.consumptionPct,
      excessUnits: this.props.excessUnits,
      annualValue: AnnualValue.create(this.props.annualValue)
    })
  }

  build(): License {
    return License.fromPrimitives(this.props)
  }
}
