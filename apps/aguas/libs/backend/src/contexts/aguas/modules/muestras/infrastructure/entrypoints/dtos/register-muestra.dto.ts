import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator'
import { MUESTRA_CONSTRAINTS as LIMITS } from '../../../domain/muestra-constants'
import { MuestraEstado } from '../../../domain/value-objects/muestra-estado.vo'

export class RegisterMuestraDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.CODIGO.MIN)
  @MaxLength(LIMITS.CODIGO.MAX)
  codigo!: string

  @IsIn([...MuestraEstado.VALUES])
  estado!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TECNICO.MAX)
  tecnico?: string

  @IsString()
  @IsNotEmpty()
  recogida!: string

  @IsString()
  @IsNotEmpty()
  limiteInforme!: string

  @IsNumber()
  @Min(0)
  importe!: number

  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  puntoId!: string

  @IsString()
  @IsNotEmpty()
  puntoName!: string
}
