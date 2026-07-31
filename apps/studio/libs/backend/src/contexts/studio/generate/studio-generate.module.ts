import { Module } from '@nestjs/common'
import { StudioGenerateController } from './studio-generate.controller'

@Module({
  controllers: [StudioGenerateController]
})
export class StudioGenerateModule {}
