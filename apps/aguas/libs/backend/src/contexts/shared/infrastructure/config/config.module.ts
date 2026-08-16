import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configLoader from './loaders/config-loader'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      // El loader es la costura de resolución de secretos: el proveedor de infra lo sustituye.
      load: [configLoader]
    })
  ]
})
export class CoreConfigModule {}
