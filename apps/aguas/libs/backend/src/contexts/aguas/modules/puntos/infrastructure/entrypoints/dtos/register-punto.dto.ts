import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { PUNTO_CONSTRAINTS as LIMITS } from '../../../domain/punto-constants'
import { PuntoTipoagua } from '../../../domain/value-objects/punto-tipoagua.vo'

export class RegisterPuntoDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.NOMBRE.MIN)
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre!: string

  @IsIn([...PuntoTipoagua.VALUES])
  tipoAgua!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.DIRECCION.MAX)
  direccion?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COORDENADAS.MAX)
  coordenadas?: string

  @IsBoolean()
  obligatorio!: boolean

  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  clienteId!: string

  @IsString()
  @IsNotEmpty()
  clienteName!: string
}
