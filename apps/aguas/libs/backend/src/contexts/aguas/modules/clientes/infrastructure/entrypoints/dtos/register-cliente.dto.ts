import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { CLIENTE_CONSTRAINTS as LIMITS } from '../../../domain/cliente-constants'
import { ClienteTipo } from '../../../domain/value-objects/cliente-tipo.vo'

export class RegisterClienteDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.NOMBRE.MIN)
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre!: string

  @IsIn([...ClienteTipo.VALUES])
  tipo!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TELEFONO.MAX)
  telefono?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.LOCALIDAD.MAX)
  localidad?: string
}
