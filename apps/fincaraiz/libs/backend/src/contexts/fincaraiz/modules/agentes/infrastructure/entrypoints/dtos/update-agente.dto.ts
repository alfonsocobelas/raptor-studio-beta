import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { AGENTE_CONSTRAINTS as LIMITS } from '../../../domain/agente-constants'

export class UpdateAgenteDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.NOMBRE.MIN)
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.EMAIL.MAX)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TELEFONO.MAX)
  telefono?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  comisionPorcentaje?: number

  @IsOptional()
  @IsBoolean()
  activo?: boolean
}
