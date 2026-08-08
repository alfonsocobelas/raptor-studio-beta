import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { VISITA_CONSTRAINTS as LIMITS } from '../../../domain/visita-constants'

export class RegisterVisitaDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.REFERENCIA.MIN)
  @MaxLength(LIMITS.REFERENCIA.MAX)
  referencia!: string

  @IsString()
  @IsNotEmpty()
  fecha!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.INTERESADO.MAX)
  interesado?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.OBSERVACIONES.MAX)
  observaciones?: string

  @IsBoolean()
  confirmada!: boolean

  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  propiedadId!: string

  @IsString()
  @IsNotEmpty()
  propiedadName!: string
}
