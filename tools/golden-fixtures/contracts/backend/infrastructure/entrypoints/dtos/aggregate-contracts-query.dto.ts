import { IsIn, IsNotEmpty, IsString } from 'class-validator'
import { AGGREGATE_OPS, AggregateOp } from '../../../../../../shared/domain/query/aggregate'
import { PaginateOffsetDto } from '../../../../../../shared/infrastructure/dtos/paginate-offset.dto'

// Extiende PaginateOffsetDto porque ParseCriteriaPipe siempre emite page/pageSize bajo el
// ValidationPipe global con forbidNonWhitelisted. La agregación los ignora: no pagina.
//
// Aquí se valida la FORMA (que la operación sea una de cinco, que el campo sea una cadena). Que
// ESTE campo de ESTE recurso sea agregable es una regla de aplicación y la comprueba el caso de
// uso, que es la única capa por la que pasan todos los caminos.
export class AggregateContractsQueryDto extends PaginateOffsetDto {
  @IsIn(AGGREGATE_OPS)
  op!: AggregateOp

  @IsString()
  @IsNotEmpty()
  field!: string
}
