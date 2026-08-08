import { v7 as uuidv7 } from 'uuid'
import { AuditEvent } from '../../../../../src/contexts/shared/domain/audit/audit-event'
import { AuditTrailPort } from '../../../../../src/contexts/shared/domain/audit/audit-trail.port'
import { GetProjectHistoryUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/get-project-history-usecase.service'

describe('GetProjectHistoryUseCase', () => {
  it('devuelve los eventos del registro tal y como los da el puerto', async () => {
    const id = uuidv7()
    const events: AuditEvent[] = [
      {
        id: uuidv7(),
        entity: 'project',
        entityId: id,
        action: 'created',
        changes: {},
        occurredAt: '2026-01-01T10:00:00.000Z',
        actor: null
      }
    ]
    const auditTrail = { record: jest.fn(), of: jest.fn().mockResolvedValue(events) } as unknown as AuditTrailPort
    const useCase = new GetProjectHistoryUseCase(auditTrail)

    await expect(useCase.invoke({ id })).resolves.toEqual(events)
    expect(auditTrail.of).toHaveBeenCalledWith('project', id, 50)
  })
})
