import { IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator'
import { MUESTRA_CONSTRAINTS as LIMITS } from '../../../domain/muestra-constants'
import { MuestraEstado } from '../../../domain/value-objects/muestra-estado.vo'

export class UpdateMuestraDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.CODIGO.MIN)
  @MaxLength(LIMITS.CODIGO.MAX)
  codigo?: string

  @IsOptional()
  @IsIn([...MuestraEstado.VALUES])
  estado?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TECNICO.MAX)
  tecnico?: string

  @IsOptional()
  @IsString()
  recogida?: string

  @IsOptional()
  @IsString()
  limiteInforme?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  importe?: number

  @IsOptional()
  @IsString()
  @IsUUID('7')
  puntoId?: string

  @IsOptional()
  @IsString()
  puntoName?: string
}
