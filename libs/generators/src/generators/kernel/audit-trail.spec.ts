import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { kernelGenerator } from './kernel'

/**
 * Spec 31 (fase 5 · A3): el historial es transversal — un puerto y una tabla GLOBAL
 * en el kernel, emitidos solo si algún modelo del corte declara `history`.
 */
describe('kernel generator — puerto de auditoría (spec 31)', () => {
  const emit = async (models: string, database?: 'postgres' | 'mongo'): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await kernelGenerator(tree, { models, database, directory: 'out' })
    return tree
  }

  it('con un modelo history (project) emite el dominio del evento y el puerto', async () => {
    const tree = await emit('project')

    const event = tree.read('out/contexts/shared/domain/audit/audit-event.ts', 'utf-8') ?? ''
    expect(event).toContain("export type AuditAction = 'created' | 'updated' | 'deleted' | 'restored'")
    expect(event).toContain('export interface AuditEvent')

    const port = tree.read('out/contexts/shared/domain/audit/audit-trail.port.ts', 'utf-8') ?? ''
    expect(port).toContain('export abstract class AuditTrailPort')
    expect(port).toContain('abstract record(')
    expect(port).toContain('abstract of(')
  })

  it('postgres emite entidad + adapter mejor-esfuerzo + módulo global, y el DataSource conoce la entidad', async () => {
    const tree = await emit('project')

    const entity = tree.read('out/contexts/shared/infrastructure/audit/typeorm-audit-event.entity.ts', 'utf-8') ?? ''
    expect(entity).toContain("@Entity({ name: 'audit_events', schema: 'shared' })")

    const adapter = tree.read('out/contexts/shared/infrastructure/audit/typeorm-audit-trail.ts', 'utf-8') ?? ''
    expect(adapter).toContain('export class TypeOrmAuditTrail extends AuditTrailPort')
    // mejor esfuerzo: perder un evento no tumba la operación de negocio
    expect(adapter).toContain('catch')

    const module = tree.read('out/contexts/shared/infrastructure/audit/audit.module.ts', 'utf-8') ?? ''
    expect(module).toContain('@Global()')
    expect(module).toContain('provide: AuditTrailPort, useClass: TypeOrmAuditTrail')

    const persistence =
      tree.read('out/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module.ts', 'utf-8') ?? ''
    expect(persistence).toContain('TypeOrmAuditEventEntity')
  })

  it('mongo emite schema + adapter + módulo global sin rastro de TypeORM', async () => {
    const tree = await emit('customer,project', 'mongo')

    const schema = tree.read('out/contexts/shared/infrastructure/audit/audit-event.schema.ts', 'utf-8') ?? ''
    expect(schema).toContain("collection: 'audit_events'")

    const adapter = tree.read('out/contexts/shared/infrastructure/audit/mongoose-audit-trail.ts', 'utf-8') ?? ''
    expect(adapter).toContain('export class MongooseAuditTrail extends AuditTrailPort')

    const module = tree.read('out/contexts/shared/infrastructure/audit/audit.module.ts', 'utf-8') ?? ''
    expect(module).toContain('provide: AuditTrailPort, useClass: MongooseAuditTrail')
    expect(tree.exists('out/contexts/shared/infrastructure/audit/typeorm-audit-event.entity.ts')).toBe(false)
  })

  it('sin modelos history no se emite ni un byte de auditoría', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/contexts/shared/domain/audit/audit-trail.port.ts')).toBe(false)
    expect(tree.exists('out/contexts/shared/infrastructure/audit/audit.module.ts')).toBe(false)
    expect(
      tree.read('out/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module.ts', 'utf-8')
    ).not.toContain('AuditEvent')
  })
})
