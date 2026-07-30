import { Injectable } from '@nestjs/common'
import { CustomerSummaryDto } from '@sap-licenses/shared/domain'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractRepository } from '../../../contracts/domain/contract-repository'
import { activeContractsOfCustomer } from '../../../contracts/domain/specifications/active-contracts-of-customer.specification'
import { LicenseRepository } from '../../../licenses/domain/license-repository'
import { licensesOfCustomer } from '../../../licenses/domain/specifications/licenses-of-customer.specification'
import { ProjectRepository } from '../../../projects/domain/project-repository'
import { activeProjectsOfCustomer } from '../../../projects/domain/specifications/active-projects-of-customer.specification'
import { CustomerRepository } from '../../domain/customer-repository'
import { GetCustomerSummaryInput } from '../dtos/get-customer-summary-input.dto'

// KPIs de la ficha 360. Acoplamiento intra-contexto deliberado: inyecta los repos de los módulos
// hermanos (contracts/licenses/projects) para contar en SQL; la frontera dura son los contextos.
@Injectable()
export class GetCustomerSummaryUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly contractRepository: ContractRepository,
    private readonly licenseRepository: LicenseRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async invoke(input: GetCustomerSummaryInput): Promise<CustomerSummaryDto> {
    const customerId = CustomerId.create(input.id)
    const customer = await this.customerRepository.get(customerId)

    if (!customer) {
      throw new EntityNotFoundError('Customer', input.id)
    }

    const [activeContracts, licenses, activeProjects] = await Promise.all([
      this.contractRepository.count(activeContractsOfCustomer(customerId)),
      this.licenseRepository.count(licensesOfCustomer(customerId)),
      this.projectRepository.count(activeProjectsOfCustomer(customerId))
    ])

    return { activeContracts, licenses, activeProjects }
  }
}
