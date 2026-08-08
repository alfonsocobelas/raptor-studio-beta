import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import { PROPIEDAD_CONSTRAINTS as LIMITS } from '../../../domain/propiedad-constants'
import { PropiedadEstado } from '../../../domain/value-objects/propiedad-estado.vo'

export class RegisterPropiedadDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.TITULO.MIN)
  @MaxLength(LIMITS.TITULO.MAX)
  titulo!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.ZONA.MAX)
  zona?: string

  @IsIn([...PropiedadEstado.VALUES])
  estado!: string

  @IsInt()
  @Min(0)
  metrosCuadrados!: number

  @IsInt()
  @Min(0)
  habitaciones!: number

  @IsNumber()
  @Min(0)
  precio!: number

  @IsString()
  @IsNotEmpty()
  fechaAlta!: string

  @IsBoolean()
  exclusiva!: boolean

  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  agenteId!: string

  @IsString()
  @IsNotEmpty()
  agenteName!: string
}
