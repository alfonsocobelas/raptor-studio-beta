import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { PARAMETRO_CONSTRAINTS as LIMITS } from '../../../domain/parametro-constants'

export class UpdateParametroDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.CODIGO.MIN)
  @MaxLength(LIMITS.CODIGO.MAX)
  codigo?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.METODO.MAX)
  metodo?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  limiteLegal?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number
}
