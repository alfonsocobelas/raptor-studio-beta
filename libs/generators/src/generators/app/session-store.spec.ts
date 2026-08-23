import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * TASK-04 (spec 55): con `sessionStore=redis` las sesiones dejan la tabla iam.session
 * y viven en Redis tras el MISMO puerto SessionRepository. El dominio no se toca:
 * solo cambia la carpeta de persistencia y el binding del módulo.
 */
describe('app generator — ranura sessionStore', () => {
  const generate = async (options: Parameters<typeof appGenerator>[1]): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    return tree
  }

  const base = { name: 'demo', models: 'contract', skipInstall: true, auth: 'single-tenant' } as const
  const AUTH = 'apps/demo/libs/backend/src/contexts/iam/modules/auth'
  const SHARED = 'apps/demo/libs/backend/src/contexts/shared'
  const MIGRATION = `${SHARED}/infrastructure/persistence/typeorm/migrations/1790000001000-CreateIamAuth.ts`

  describe('sessionStore=redis', () => {
    let tree: Tree

    beforeAll(async () => {
      tree = await generate({ ...base, sessionStore: 'redis' })
    })

    it('emite el repositorio redis y sus errores 503 en lugar del adapter typeorm', () => {
      expect(tree.exists(`${AUTH}/infrastructure/persistence/redis/redis-session.repository.ts`)).toBe(true)
      expect(tree.exists(`${AUTH}/infrastructure/persistence/redis/session-store-errors.ts`)).toBe(true)
      expect(tree.exists(`${AUTH}/infrastructure/persistence/typeorm/typeorm-session.entity.ts`)).toBe(false)
      expect(tree.exists(`${AUTH}/infrastructure/persistence/typeorm/typeorm-session.repository.ts`)).toBe(false)
      expect(tree.exists(`${AUTH}/infrastructure/persistence/typeorm/session.mapper.ts`)).toBe(false)
    })

    it('el store caído es 503, ni 401 (evictaría al usuario) ni 500 (mentiría sobre la causa)', () => {
      const errors = tree.read(`${AUTH}/infrastructure/persistence/redis/session-store-errors.ts`, 'utf-8') ?? ''

      expect(errors).toContain('SERVICE_UNAVAILABLE')
    })

    it('auth.module ata el puerto al repositorio redis', () => {
      const module = tree.read(`${AUTH}/auth.module.ts`, 'utf-8') ?? ''

      expect(module).toContain('{ provide: SessionRepository, useClass: RedisSessionRepository }')
      expect(module).not.toContain('TypeOrmSessionRepository')
    })

    it('la migración CreateIamAuth no crea la tabla session (user y auth_token siguen en postgres)', () => {
      const migration = tree.read(MIGRATION, 'utf-8') ?? ''

      expect(migration).not.toContain('.session')
      expect(migration).toContain('."user"')
      expect(migration).toContain('.auth_token')
    })

    it('la entidad de sesión no se registra en la persistencia compartida', () => {
      const persistence =
        tree.read(`${SHARED}/infrastructure/persistence/typeorm/shared-persistence.module.ts`, 'utf-8') ?? ''

      expect(persistence).not.toContain('TypeOrmSessionEntity')
      expect(persistence).toContain('TypeOrmUserEntity')
      expect(persistence).toContain('TypeOrmAuthTokenEntity')
    })

    it('el rate limiting sigue emitiéndose (la variante de storage la decide TASK-07)', () => {
      expect(tree.exists(`${SHARED}/infrastructure/rate-limit/rate-limit.module.ts`)).toBe(true)
    })

    it('el dominio de sesión es el mismo en ambos stores (agregado, puerto y VO comunes)', () => {
      expect(tree.exists(`${AUTH}/domain/session.ts`)).toBe(true)
      expect(tree.exists(`${AUTH}/domain/session-repository.ts`)).toBe(true)
      expect(tree.exists(`${AUTH}/domain/value-objects/session-token-hash.vo.ts`)).toBe(true)
    })

    it('emite el test de integración del repositorio redis con la suite del emitido', () => {
      expect(
        tree.exists('apps/demo/libs/backend/tests/infrastructure/persistence/redis/redis-session.repository.test.ts')
      ).toBe(true)
    })
  })

  describe('sessionStore=postgres (default)', () => {
    it('no emite rastro de redis: el default es exactamente la app de siempre', async () => {
      const tree = await generate(base)

      expect(tree.exists(`${AUTH}/infrastructure/persistence/redis/redis-session.repository.ts`)).toBe(false)
      expect(tree.exists(`${AUTH}/infrastructure/persistence/typeorm/typeorm-session.repository.ts`)).toBe(true)
      const module = tree.read(`${AUTH}/auth.module.ts`, 'utf-8') ?? ''
      expect(module).toContain('TypeOrmSessionRepository')
      const migration = tree.read(MIGRATION, 'utf-8') ?? ''
      expect(migration).toContain('CREATE TABLE iam.session')
    })
  })
})
