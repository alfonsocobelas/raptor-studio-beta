import { Module } from '@nestjs/common'
import { StudioFillController } from './studio-fill.controller'
import { StudioGenerateController } from './studio-generate.controller'

@Module({
  controllers: [StudioGenerateController, StudioFillController]
})
export class StudioGenerateModule {}
