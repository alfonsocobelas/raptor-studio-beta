import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { v7 as uuidv7 } from 'uuid'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { UserId } from '../../../../../shared/domain/value-objects/iam/user-id.vo'
import { PasswordHasher } from '../../application/ports/password-hasher'
import { UserRepository } from '../../domain/user-repository'
import { User } from '../../domain/user'
import { Email } from '../../domain/value-objects/email.vo'
import { PasswordHash } from '../../domain/value-objects/password-hash.vo'
import { UserName } from '../../domain/value-objects/user-name.vo'
import { UserRole } from '../../domain/value-objects/user-role.vo'
import { AuthModule } from '../../auth.module'

// Usuarios de prueba para el entorno local. NUNCA usar estas credenciales fuera de local.
const DEV_PASSWORD = 'password123'
const SEED_USERS = [
  { email: 'admin@app.local', name: 'Admin Local', role: 'admin' },
  { email: 'user@app.local', name: 'Usuario Local', role: 'user' },
  { email: 'viewer@app.local', name: 'Auditor Local', role: 'viewer' }
]

// LoggerModule es @Global en el RootModule real, pero un contexto standalone no arrastra los @Global
// que nadie importa: hay que importarlo aquí para que AuthModule (EmailSender → AppLogger) resuelva.
@Module({ imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, AuthModule] })
class SeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(SeedModule, { logger: ['error', 'warn'] })
  try {
    const userRepository = context.get(UserRepository)
    const passwordHasher = context.get(PasswordHasher)

    let created = 0
    let skipped = 0
    for (const seed of SEED_USERS) {
      const email = Email.create(seed.email)
      if (await userRepository.findByEmail(email)) {
        skipped++
        continue
      }
      const user = User.invite({
        id: UserId.create(uuidv7()),
        email,
        name: UserName.create(seed.name),
        role: UserRole.create(seed.role)
      })
      user.activateWithPassword(PasswordHash.create(await passwordHasher.hash(DEV_PASSWORD)))
      await userRepository.register(user)
      created++
    }

    console.log(`[seed] users: +${created} created, ${skipped} skipped (password: "${DEV_PASSWORD}")`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
