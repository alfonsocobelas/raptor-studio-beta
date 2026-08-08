import { Module } from '@nestjs/common'
import { StudioDesignsController } from './studio-designs.controller'

@Module({
  controllers: [StudioDesignsController]
})
export class StudioDesignsModule {}
