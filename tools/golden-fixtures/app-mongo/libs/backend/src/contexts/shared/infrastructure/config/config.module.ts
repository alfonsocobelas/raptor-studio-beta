import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import azureConfigLoader from './loaders/azure/azure-config-loader'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      // The loader is the seam for secret resolution: swap it for a different provider.
      load: [azureConfigLoader]
    })
  ]
})
export class CoreConfigModule {}
