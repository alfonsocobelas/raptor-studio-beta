import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { RateLimitConfig } from '../config/config-types'
import { clientIp, RequestWithForwarding } from './client-ip'
import { GLOBAL_THROTTLER } from './rate-limit.constants'

// Rate limit global por IP. Cuenta en la memoria del proceso (el storage por defecto del
// throttler): correcto con UNA réplica, que es el despliegue canónico de esta app. Con más
// réplicas cada una contaría por separado — ese caso lo cubre el almacén redis (sessionStore).
// El límite/ventana globales vienen de config POR ENTORNO: en test van altísimos porque la
// suite e2e dispara cientos de peticiones/min desde 127.0.0.1 y se auto-limitaría.
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // El validador de config garantiza la sección; el ! es seguro.
        const rateLimit = config.get<RateLimitConfig>('rateLimit')!
        return {
          throttlers: [{ name: GLOBAL_THROTTLER, ttl: rateLimit.globalTtlMs, limit: rateLimit.globalLimit }],
          // La IP real del cliente, no la del último proxy — ver client-ip.ts.
          getTracker: (req: RequestWithForwarding) => clientIp(req, rateLimit.trustedProxyHops)
        }
      }
    })
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class RateLimitModule {}
