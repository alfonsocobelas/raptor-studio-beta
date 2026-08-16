import { v7 as uuidv7 } from 'uuid'
import { Contract } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/contract'
import { ContractPrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/contract-types'
import { BillingFrequency } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/billing-frequency.vo'
import { BusinessModel } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/business-model.vo'
import { CmsCaseId } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/cms-case-id.vo'
import { ContractCurrency } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-currency.vo'
import { ContractNotes } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-notes.vo'
import { ContractSource } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-source.vo'
import { ContractStatus } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-status.vo'
import { ContractType } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-type.vo'
import { ContractValue } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-value.vo'
import { IsFavorite } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/is-favorite.vo'
import { NumberOfContracts } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/number-of-contracts.vo'
import { RenewalType } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/renewal-type.vo'
import { SubSolutionAreas } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/sub-solution-areas.vo'
import { SupportModel } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/support-model.vo'
import { ContractDate } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/period.vo'
import { ContractId } from '../../../../../src/contexts/shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../../src/contexts/shared/domain/value-objects/customers/customer-id.vo'

const randomContractNumber = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class ContractBuilder {
  private props: ContractPrimitiveProps = {
    id: uuidv7(),
    contractType: 'cloud',
    contractNumber: randomContractNumber(),
    customerId: uuidv7(),
    customerName: 'CustomerName 1',
    cmsCaseId: '',
    businessModel: '',
    subSolutionAreas: ['Sample Area'],
    nbrOfContracts: 1,
    isFavorite: false,
    status: 'active',
    source: 'AVVALE_SOLD',
    startDate: '2026-01-15',
    endDate: '2027-01-14',
    totalValue: 0,
    currency: 'EUR',
    billingFrequency: 'yearly',
    renewalType: 'manual',
    notes: '',
    origin: 'MANUAL',
    lifecycleStatus: 'active',
    archivedAt: null,
    lastSeenInSyncAt: null,
    supportModel: '',
    upcomingMaintenanceEnd: null,
    upcomingMaintenanceFee: null
  }

  static aContract(): ContractBuilder {
    return new ContractBuilder()
  }

  withId(id: string): ContractBuilder {
    this.props.id = id
    return this
  }

  withContractType(contractType: string): ContractBuilder {
    this.props.contractType = contractType
    return this
  }

  withContractNumber(contractNumber: string): ContractBuilder {
    this.props.contractNumber = contractNumber
    return this
  }

  withCustomerId(customerId: string): ContractBuilder {
    this.props.customerId = customerId
    return this
  }

  withStatus(status: string): ContractBuilder {
    this.props.status = status
    return this
  }

  withSource(source: string): ContractBuilder {
    this.props.source = source
    return this
  }

  withBillingFrequency(billingFrequency: string): ContractBuilder {
    this.props.billingFrequency = billingFrequency
    return this
  }

  withRenewalType(renewalType: string): ContractBuilder {
    this.props.renewalType = renewalType
    return this
  }

  withOrigin(origin: string): ContractBuilder {
    this.props.origin = origin
    return this
  }

  withLifecycleStatus(lifecycleStatus: string): ContractBuilder {
    this.props.lifecycleStatus = lifecycleStatus
    return this
  }

  withProps(overrides?: Partial<ContractPrimitiveProps>): ContractBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Contract {
    return Contract.create({
      id: ContractId.create(this.props.id),
      contractType: ContractType.create(this.props.contractType),
      contractNumber: this.props.contractNumber === null ? null : ContractNumber.create(this.props.contractNumber),
      customerId: CustomerId.create(this.props.customerId),
      customerName: CustomerName.create(this.props.customerName),
      cmsCaseId: CmsCaseId.create(this.props.cmsCaseId),
      businessModel: BusinessModel.create(this.props.businessModel),
      subSolutionAreas: SubSolutionAreas.create(this.props.subSolutionAreas),
      nbrOfContracts: NumberOfContracts.create(this.props.nbrOfContracts),
      isFavorite: IsFavorite.create(this.props.isFavorite),
      source: ContractSource.create(this.props.source),
      totalValue: ContractValue.create(this.props.totalValue),
      currency: ContractCurrency.create(this.props.currency),
      billingFrequency: BillingFrequency.create(this.props.billingFrequency),
      renewalType: RenewalType.create(this.props.renewalType),
      notes: ContractNotes.create(this.props.notes),
      supportModel: SupportModel.create(this.props.supportModel ?? ''),
      upcomingMaintenanceEnd: this.props.upcomingMaintenanceEnd
        ? ContractDate.create(new Date(this.props.upcomingMaintenanceEnd))
        : ContractDate.unset(),
      upcomingMaintenanceFee:
        this.props.upcomingMaintenanceFee != null
          ? ContractValue.create(this.props.upcomingMaintenanceFee)
          : ContractValue.unset(),
      period: Period.create(
        this.props.startDate ? ContractDate.create(new Date(this.props.startDate)) : null,
        this.props.endDate ? ContractDate.create(new Date(this.props.endDate)) : null
      )
    })
  }

  build(): Contract {
    return Contract.fromPrimitives(this.props)
  }
}
