import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { UserRoleEnum } from '@app/shared/domain'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { AddContactHandler } from '../../application/handlers/add-contact.handler'
import { UpdateContactHandler } from '../../application/handlers/update-contact.handler'
import { RemoveContactHandler } from '../../application/handlers/remove-contact.handler'
import { AddContactDto } from './dtos/add-contact.dto'
import { UpdateContactDto } from './dtos/update-contact.dto'

@Controller('customers')
export class CustomerContactsController {
  constructor(
    private readonly addContactHandler: AddContactHandler,
    private readonly updateContactHandler: UpdateContactHandler,
    private readonly removeContactHandler: RemoveContactHandler
  ) {}

  @Post(':id/contacts')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  add(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: AddContactDto): Promise<void> {
    return this.addContactHandler.handle({ customerId: id, contact: body })
  }

  @Put(':id/contacts/:contactId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Param('contactId', ParseUUIDv7Pipe) contactId: string,
    @Body() body: UpdateContactDto
  ): Promise<void> {
    return this.updateContactHandler.handle({ customerId: id, contactId, updates: body })
  }

  @Delete(':id/contacts/:contactId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Param('contactId', ParseUUIDv7Pipe) contactId: string
  ): Promise<void> {
    return this.removeContactHandler.handle({ customerId: id, contactId })
  }
}
