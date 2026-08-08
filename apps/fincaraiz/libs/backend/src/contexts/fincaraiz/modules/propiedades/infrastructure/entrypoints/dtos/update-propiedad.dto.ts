import {
  IsBoolean,
  IsIn,
  IsInt,
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

export class UpdatePropiedadDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.TITULO.MIN)
  @MaxLength(LIMITS.TITULO.MAX)
  titulo?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.ZONA.MAX)
  zona?: string

  @IsOptional()
  @IsIn([...PropiedadEstado.VALUES])
  estado?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  metrosCuadrados?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  habitaciones?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number

  @IsOptional()
  @IsString()
  fechaAlta?: string

  @IsOptional()
  @IsBoolean()
  exclusiva?: boolean

  @IsOptional()
  @IsString()
  @IsUUID('7')
  agenteId?: string

  @IsOptional()
  @IsString()
  agenteName?: string
}
