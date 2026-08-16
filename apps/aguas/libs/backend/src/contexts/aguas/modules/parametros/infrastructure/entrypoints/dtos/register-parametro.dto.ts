import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator'
import { PARAMETRO_CONSTRAINTS as LIMITS } from '../../../domain/parametro-constants'

export class RegisterParametroDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.CODIGO.MIN)
  @MaxLength(LIMITS.CODIGO.MAX)
  codigo!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.METODO.MAX)
  metodo?: string

  @IsNumber()
  @Min(0)
  limiteLegal!: number

  @IsNumber()
  @Min(0)
  precio!: number
}
