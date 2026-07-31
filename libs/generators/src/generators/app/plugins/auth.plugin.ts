import { names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { definePlugin, type PluginContext } from './plugin'

const IAM_ENTITIES = [
  { className: 'TypeOrmUserEntity', file: 'typeorm-user.entity' },
  { className: 'TypeOrmSessionEntity', file: 'typeorm-session.entity' },
  { className: 'TypeOrmAuthTokenEntity', file: 'typeorm-auth-token.entity' }
]
const ENTITY_DIR = '../../../../iam/modules/auth/infrastructure/persistence/typeorm'
const AUTH_SCHEMA = 'iam'

/**
 * Autenticación: sesiones opacas en base de datos con cookie httpOnly, invitaciones y
 * reset de contraseña. Trasplantado del proyecto de referencia y despegado de él —
 * fuera el SDK de Azure (el envío queda en SMTP o log tras el puerto `EmailSender`),
 * fuera el logo y el nombre de producto.
 *
 * No hay JWT a propósito: la sesión se revoca borrando su fila.
 */
export const authPlugin = definePlugin({
  name: 'auth',
  description: 'Login por sesión con cookie, invitaciones, reset de contraseña y roles',
  requiresDatabase: 'postgres',
  assets: 'assets-auth',
  dependencies: {
    argon2: '^0.41.1',
    nodemailer: '^6.9.16'
  },
  devDependencies: {
    '@types/nodemailer': '^6.4.17'
  },
  scripts: {
    'seed:auth':
      'ts-node -T -r tsconfig-paths/register libs/backend/src/contexts/iam/modules/auth/infrastructure/seed/local-seed.ts'
  },
  makeTargets: {
    'seed-auth': '\tNODE_ENV=local npm run seed:auth'
  },
  // Sin los usuarios sembrados el primer login es imposible: local-setup lo encadena.
  localSetupSteps: ['seed-auth'],

  apply(tree: Tree, context: PluginContext): void {
    registerModule(tree, context)
    registerEntities(tree, context)
    addSchemaMigration(tree, context)
    registerTestRepositories(tree, context)
    brandEmailTemplates(tree, context)
    wireFrontend(tree, context)
  },

  /** Los schemas que el plugin añade, para que el docker/local los cree. */
  schemas: [AUTH_SCHEMA]
})

/**
 * Con auth real, el shell queda tras authGuard, /login existe, el interceptor
 * redirige al 401 y el AuthService de desarrollo (admin fijo) sale del arranque.
 */
function wireFrontend(tree: Tree, context: PluginContext): void {
  const app = path.join(context.root, 'apps/frontend-app/src')

  const routesPath = path.join(app, 'app.routes.ts')
  const routes = tree.read(routesPath, 'utf-8')
  if (routes && !routes.includes('/login')) {
    const guarded = routes
      .replace(
        "import { Routes } from '@angular/router'",
        `import { Routes } from '@angular/router'
import { authGuard, loginGuard } from '${context.scope}/frontend/core/guards/auth.guard'`
      )
      .replace(
        'export const routes: Routes = [',
        `export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('${context.scope}/frontend/domains/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('${context.scope}/frontend/domains/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('${context.scope}/frontend/domains/auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'accept-invitation',
    loadComponent: () =>
      import('${context.scope}/frontend/domains/auth/set-password.component').then(m => m.SetPasswordComponent)
  },`
      )
    tree.write(routesPath, guarded)
  }

  const configPath = path.join(app, 'app.config.ts')
  const config = tree.read(configPath, 'utf-8')
  if (config) {
    tree.write(
      configPath,
      config
        .replace(/import \{ devAuthProvider \} from '\.\/dev-auth'\n/, '')
        .replace(/\s*devAuthProvider,/, '')
        // el esqueleto justifica la ausencia de auth; con el plugin activo mentiría
        .replace(/\s*\/\/ Sin authInterceptor:[^\n]*/, '')
        .replace(
          "import { apiBaseUrlInterceptor } from '@app/frontend/core/http/api-base-url.interceptor'",
          "import { apiBaseUrlInterceptor } from '@app/frontend/core/http/api-base-url.interceptor'\nimport { authInterceptor } from '@app/frontend/core/http/auth.interceptor'"
        )
        .replace('withInterceptors([apiBaseUrlInterceptor])', 'withInterceptors([apiBaseUrlInterceptor, authInterceptor])')
    )
    tree.delete(path.join(app, 'dev-auth.ts'))
  }
}

/**
 * Los emails transaccionales llevan el nombre visible del producto en asuntos,
 * títulos y pie. Los assets se copian literales con un neutro ('la aplicación');
 * aquí se marca con el nombre de la app para que ningún correo salga sin marca.
 */
function brandEmailTemplates(tree: Tree, context: PluginContext): void {
  const templatesPath = path.join(
    context.root,
    'libs/backend/src/contexts/iam/modules/auth/infrastructure/adapters/email-templates.ts'
  )
  const source = tree.read(templatesPath, 'utf-8')
  if (!source) {
    return
  }
  tree.write(templatesPath, source.replace("PRODUCT_NAME = 'la aplicación'", `PRODUCT_NAME = '${names(context.appName).className}'`))
}

/**
 * Registra el repositorio de usuarios en TestRepositoriesModule: los tests de
 * integración de IAM resuelven sus providers por ahí, igual que los de negocio.
 */
function registerTestRepositories(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.root, 'libs/backend/tests/infrastructure/test-repositories.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('TypeOrmUserRepository')) {
    return
  }
  const userRepoImport =
    "import { TypeOrmUserRepository } from '../../src/contexts/iam/modules/auth/infrastructure/persistence/typeorm/typeorm-user.repository'"
  const wired = source
    .replace(/\n\nconst repositories = \[/, `\n${userRepoImport}\n\nconst repositories = [`)
    .replace(/(const repositories = \[[\s\S]*?)\n\]/, '$1,\n  TypeOrmUserRepository\n]')
  tree.write(modulePath, wired)
}

/** Cablea AuthModule en el composition root que emitió el generador de root. */
function registerModule(tree: Tree, context: PluginContext): void {
  const rootPath = path.join(context.backendSrc, 'root.module.ts')
  const source = tree.read(rootPath, 'utf-8')
  if (!source || source.includes('AuthModule')) {
    return
  }
  // El módulo registra sus guards como APP_GUARD: va justo tras el core para que la
  // sesión esté resuelta cuando se evalúan los roles de los módulos de negocio.
  const wired = source
    .replace(
      /(import \{ HealthModule \}[^\n]*\n)/,
      "$1import { AuthModule } from './contexts/iam/modules/auth/auth.module'\n"
    )
    .replace(/(\n\s*HealthModule,)/, '$1\n    AuthModule,')
  tree.write(rootPath, wired)
}

/** Añade las tres entidades de IAM a la lista del módulo de persistencia. */
function registerEntities(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(
    context.backendSrc,
    'contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module.ts'
  )
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('TypeOrmUserEntity')) {
    return
  }

  const imports = IAM_ENTITIES.map(e => `import { ${e.className} } from '${ENTITY_DIR}/${e.file}'`).join('\n')
  const withImports = source.replace(/(\nimport [^\n]*\n)(?![\s\S]*\nimport )/, `$1${imports}\n`)
  tree.write(
    modulePath,
    withImports.replace(/(entities: \[)/, `$1\n          ${IAM_ENTITIES.map(e => e.className).join(',\n          ')},`)
  )
}

/** Migración del schema iam, solo cuando el plugin de migraciones está activo. */
function addSchemaMigration(tree: Tree, context: PluginContext): void {
  const migrationsDir = path.join(
    context.backendSrc,
    'contexts/shared/infrastructure/persistence/typeorm/migrations'
  )
  if (!tree.children(migrationsDir).length) {
    return
  }

  const stamp = 1790000001000
  tree.write(
    path.join(migrationsDir, `${stamp}-CreateIamAuth.ts`),
    `import { MigrationInterface, QueryRunner } from 'typeorm'

/** Usuarios, sesiones y tokens de un solo uso (invitación y reset). */
export class CreateIamAuth${stamp} implements MigrationInterface {
  name = 'CreateIamAuth${stamp}'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`CREATE SCHEMA IF NOT EXISTS ${AUTH_SCHEMA}\`)

    await queryRunner.query(\`
      CREATE TABLE ${AUTH_SCHEMA}."user" (
        id                    UUID          NOT NULL,
        email                 VARCHAR(254)  NOT NULL,
        name                  VARCHAR(120)  NOT NULL,
        password_hash         VARCHAR(255)  NULL,
        role                  VARCHAR(20)   NOT NULL,
        status                VARCHAR(20)   NOT NULL,
        failed_login_attempts INTEGER       NOT NULL DEFAULT 0,
        locked_until          TIMESTAMPTZ   NULL,
        created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT pk_user PRIMARY KEY (id),
        CONSTRAINT uq_user_email UNIQUE (email),
        CONSTRAINT ck_user_role CHECK (role IN ('admin', 'user', 'viewer')),
        CONSTRAINT ck_user_status CHECK (status IN ('pending', 'active', 'disabled'))
      )
    \`)

    await queryRunner.query(\`
      CREATE TABLE ${AUTH_SCHEMA}.session (
        id           UUID         NOT NULL,
        user_id      UUID         NOT NULL,
        token_hash   VARCHAR(64)  NOT NULL,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        expires_at   TIMESTAMPTZ  NOT NULL,
        last_seen_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT pk_session PRIMARY KEY (id),
        CONSTRAINT uq_session_token_hash UNIQUE (token_hash)
      )
    \`)
    await queryRunner.query(\`CREATE INDEX idx_session_user_id ON ${AUTH_SCHEMA}.session (user_id)\`)

    await queryRunner.query(\`
      CREATE TABLE ${AUTH_SCHEMA}.auth_token (
        id         UUID         NOT NULL,
        user_id    UUID         NOT NULL,
        token_hash VARCHAR(64)  NOT NULL,
        type       VARCHAR(30)  NOT NULL,
        expires_at TIMESTAMPTZ  NOT NULL,
        used_at    TIMESTAMPTZ  NULL,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT pk_auth_token PRIMARY KEY (id),
        CONSTRAINT uq_auth_token_token_hash UNIQUE (token_hash)
      )
    \`)
    await queryRunner.query(\`CREATE INDEX idx_auth_token_user_id ON ${AUTH_SCHEMA}.auth_token (user_id)\`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`DROP TABLE IF EXISTS ${AUTH_SCHEMA}.auth_token\`)
    await queryRunner.query(\`DROP TABLE IF EXISTS ${AUTH_SCHEMA}.session\`)
    await queryRunner.query(\`DROP TABLE IF EXISTS ${AUTH_SCHEMA}."user"\`)
  }
}
`
  )
}
