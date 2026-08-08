import { Injectable } from '@nestjs/common'
import { AuditEvent } from '../../../../../shared/domain/audit/audit-event'
import { AuditTrailPort } from '../../../../../shared/domain/audit/audit-trail.port'
import { GetProjectHistoryInput } from '../dtos/get-project-history-input.dto'

/** La timeline de la ficha: los últimos eventos del registro, del más reciente al más antiguo. */
@Injectable()
export class GetProjectHistoryUseCase {
  constructor(private readonly auditTrail: AuditTrailPort) {}

  invoke(input: GetProjectHistoryInput): Promise<AuditEvent[]> {
    return this.auditTrail.of('project', input.id, 50)
  }
}
