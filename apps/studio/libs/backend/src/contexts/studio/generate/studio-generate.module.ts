import { Module } from '@nestjs/common'
import { StudioFillController } from './studio-fill.controller'
import { StudioGenerateController } from './studio-generate.controller'
import { StudioRepairController } from './studio-repair.controller'
import { StudioValidateController } from './studio-validate.controller'

@Module({
  controllers: [StudioGenerateController, StudioFillController, StudioValidateController, StudioRepairController]
})
export class StudioGenerateModule {}
