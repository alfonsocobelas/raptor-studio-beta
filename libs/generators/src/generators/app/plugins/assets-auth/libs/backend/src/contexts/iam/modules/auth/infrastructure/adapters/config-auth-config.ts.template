import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthConfig } from '../../application/ports/auth-config'

@Injectable()
export class ConfigAuthConfig extends AuthConfig {
  constructor(private readonly config: ConfigService) {
    super()
  }

  get appBaseUrl(): string {
    return this.config.get<string>('app.baseUrl') ?? 'http://localhost:4200'
  }
}
