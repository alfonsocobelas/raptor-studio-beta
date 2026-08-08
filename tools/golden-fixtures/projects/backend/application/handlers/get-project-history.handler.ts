import { Injectable } from '@nestjs/common'
import { AuditEvent } from '../../../../../shared/domain/audit/audit-event'
import { GetProjectHistoryInput } from '../dtos/get-project-history-input.dto'
import { GetProjectHistoryUseCase } from '../use-cases/get-project-history-usecase.service'

@Injectable()
export class GetProjectHistoryHandler {
  constructor(private readonly useCase: GetProjectHistoryUseCase) {}

  handle(input: GetProjectHistoryInput): Promise<AuditEvent[]> {
    return this.useCase.invoke(input)
  }
}
