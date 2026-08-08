import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { VISITA_CONSTRAINTS as LIMITS } from '../../../domain/visita-constants'

export class UpdateVisitaDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.REFERENCIA.MIN)
  @MaxLength(LIMITS.REFERENCIA.MAX)
  referencia?: string

  @IsOptional()
  @IsString()
  fecha?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.INTERESADO.MAX)
  interesado?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.OBSERVACIONES.MAX)
  observaciones?: string

  @IsOptional()
  @IsBoolean()
  confirmada?: boolean

  @IsOptional()
  @IsString()
  @IsUUID('7')
  propiedadId?: string

  @IsOptional()
  @IsString()
  propiedadName?: string
}
