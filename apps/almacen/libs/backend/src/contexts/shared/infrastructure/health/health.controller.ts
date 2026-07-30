import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Public } from '../auth/public.decorator'
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator
} from '@nestjs/terminus'

// El ping a SAP comprueba alcanzabilidad de red, NO validez de la sesión (el login
// real es Puppeteer con credenciales; inviable en un poll). GET anónimo → 200.
const SAP_PING_URL = 'https://me.sap.com'
// Un readiness que cuelga es peor que uno que falla.
const HEALTH_TIMEOUT_MS = 3000

interface AppInfo {
  name: string
  environment: string
  version: string
  uptime: string
  timestamp: string
}

// Endpoints públicos por diseño (sin guards). liveness/readiness con superficie mínima;
// info expone entorno/versión/uptime en público como excepción consciente para diagnosticar
// despliegues — ver .claude/specs/29-health-check/REQUIREMENTS.md
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly http: HttpHealthIndicator,
    private readonly configService: ConfigService
  ) {}

  @Get('liveness')
  @Version(VERSION_NEUTRAL)
  liveness(): { status: string } {
    return { status: 'ok' }
  }

  @Get('readiness')
  @HealthCheck()
  @Version(VERSION_NEUTRAL)
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: HEALTH_TIMEOUT_MS }),
      () => this.http.pingCheck('sap', SAP_PING_URL, { timeout: HEALTH_TIMEOUT_MS })
    ])
  }

  @Get('info')
  @Version(VERSION_NEUTRAL)
  info(): AppInfo {
    return {
      name: 'SAP Licences API',
      environment: this.configService.get<string>('env') ?? 'unknown',
      version: this.getAppVersion(),
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString()
    }
  }

  private getAppVersion(): string {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      version?: string
    }

    return packageJson.version ?? 'unknown'
  }
}
