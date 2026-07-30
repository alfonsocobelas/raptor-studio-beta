import { Controller, Get, Param } from '@nestjs/common'
import { CustomerSummaryDto, UserRoleEnum } from '@sap-licenses/shared/domain'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { GetCustomerSummaryHandler } from '../../application/handlers/get-customer-summary.handler'

// Misma ruta base que CustomersController; vive en el read-side CustomerSummaryModule.
@Controller('customers')
export class CustomerSummaryController {
  constructor(private readonly handler: GetCustomerSummaryHandler) {}

  @Get(':id/summary')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  summary(@Param('id', ParseUUIDv7Pipe) id: string): Promise<CustomerSummaryDto> {
    return this.handler.handle({ id })
  }
}
