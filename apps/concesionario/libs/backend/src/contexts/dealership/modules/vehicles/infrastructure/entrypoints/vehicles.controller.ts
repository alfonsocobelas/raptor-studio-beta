import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  StreamableFile
} from '@nestjs/common'
import { UserRoleEnum } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { buildExportFile } from '../../../../../shared/infrastructure/export/build-export-file'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ExportVehiclesHandler } from '../../application/handlers/export-vehicles.handler'
import { GetVehicleHandler } from '../../application/handlers/get-vehicle.handler'
import { RegisterVehicleHandler } from '../../application/handlers/register-vehicle.handler'
import { RemoveVehicleHandler } from '../../application/handlers/remove-vehicle.handler'
import { SearchVehiclesHandler } from '../../application/handlers/search-vehicles.handler'
import { UpdateVehicleHandler } from '../../application/handlers/update-vehicle.handler'
import { VehiclePrimitiveProps, VehicleUpdateProps } from '../../domain/vehicle-types'
import { ExportVehiclesQueryDto } from './dtos/export-vehicles-query.dto'
import { VEHICLE_EXPORT_COLUMNS } from './vehicles-export-columns'
import { RegisterVehicleDto } from './dtos/register-vehicle.dto'
import { UpdateVehicleDto } from './dtos/update-vehicle.dto'

@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly registerVehicleHandler: RegisterVehicleHandler,
    private readonly searchVehiclesHandler: SearchVehiclesHandler,
    private readonly getVehicleHandler: GetVehicleHandler,
    private readonly updateVehicleHandler: UpdateVehicleHandler,
    private readonly removeVehicleHandler: RemoveVehicleHandler,
    private readonly exportVehiclesHandler: ExportVehiclesHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterVehicleDto): Promise<void> {
    return this.registerVehicleHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<VehiclePrimitiveProps>> {
    return this.searchVehiclesHandler.handle(query)
  }

  // Exports the full filtered vehicle set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportVehiclesQueryDto): Promise<StreamableFile> {
    const rows = await this.exportVehiclesHandler.handle(query)
    return buildExportFile(rows, VEHICLE_EXPORT_COLUMNS, query.format, 'vehículos')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<VehiclePrimitiveProps> {
    return this.getVehicleHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateVehicleDto): Promise<void> {
    return this.updateVehicleHandler.handle({ id, updates: body as VehicleUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeVehicleHandler.handle({ id })
  }
}
