import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import { AGENTE_CONSTRAINTS as LIMITS } from '../../../domain/agente-constants'

export class RegisterAgenteDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.NOMBRE.MIN)
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.EMAIL.MAX)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TELEFONO.MAX)
  telefono?: string

  @IsNumber()
  @Min(0)
  comisionPorcentaje!: number

  @IsBoolean()
  activo!: boolean
}
