import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditTrailPort } from '../../domain/audit/audit-trail.port'
import { TypeOrmAuditEventEntity } from './typeorm-audit-event.entity'
import { TypeOrmAuditTrail } from './typeorm-audit-trail'

/** Global: cualquier módulo con historial inyecta AuditTrailPort sin re-declararlo (spec 31). */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TypeOrmAuditEventEntity])],
  providers: [{ provide: AuditTrailPort, useClass: TypeOrmAuditTrail }],
  exports: [AuditTrailPort]
})
export class AuditModule {}
