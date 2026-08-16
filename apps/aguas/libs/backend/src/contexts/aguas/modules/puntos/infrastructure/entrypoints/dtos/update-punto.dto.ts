import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { PUNTO_CONSTRAINTS as LIMITS } from '../../../domain/punto-constants'
import { PuntoTipoagua } from '../../../domain/value-objects/punto-tipoagua.vo'

export class UpdatePuntoDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.NOMBRE.MIN)
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre?: string

  @IsOptional()
  @IsIn([...PuntoTipoagua.VALUES])
  tipoAgua?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.DIRECCION.MAX)
  direccion?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COORDENADAS.MAX)
  coordenadas?: string

  @IsOptional()
  @IsBoolean()
  obligatorio?: boolean

  @IsOptional()
  @IsString()
  @IsUUID('7')
  clienteId?: string

  @IsOptional()
  @IsString()
  clienteName?: string
}
