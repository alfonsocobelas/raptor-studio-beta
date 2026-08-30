import { Module } from '@nestjs/common'
import { StudioFillController } from './studio-fill.controller'
import { StudioGenerateController } from './studio-generate.controller'
import { StudioValidateController } from './studio-validate.controller'

@Module({
  controllers: [StudioGenerateController, StudioFillController, StudioValidateController]
})
export class StudioGenerateModule {}
