import { Injectable } from '@nestjs/common'
import {
  AggregateInput,
  AggregateOutput,
  ensureAggregateOp,
  opAllowedOn
} from '../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../shared/domain/query/criteria'
import { InvalidArgumentError } from '../../../../../shared/domain/errors'
import { ContractRepository } from '../../domain/contract-repository'
import searchContractConfig from '../config/search-contract-config'

/**
 * Una agregación del recurso (spec 71). La FRONTERA DE CONFIANZA está aquí: el nombre del campo
 * llega por HTTP y acaba interpolado en la consulta, así que se comprueba contra la lista blanca
 * emitida del recurso antes de bajar al repositorio. El DTO valida la forma; esta es la única capa
 * por la que pasan todos los caminos.
 */
@Injectable()
export class AggregateContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: AggregateInput): Promise<AggregateOutput> {
    const { allowedFilters, allowedOrders, searchableFields, aggregatableFields } = searchContractConfig
    const op = ensureAggregateOp(input.op)
    const kind = (aggregatableFields as Record<string, 'numeric' | 'date' | undefined>)[input.field]

    if (!kind) {
      throw new InvalidArgumentError(`The field "${input.field}" cannot be aggregated`)
    }
    if (!opAllowedOn(op, kind)) {
      throw new InvalidArgumentError(`The operation "${op}" does not apply to a ${kind} field`)
    }

    // el mismo lenguaje de filtro que el listado: una sola sintaxis en toda la app
    const criteria = Criteria.fromOffset(
      { page: 1, pageSize: 1, filters: input.filters } as never,
      allowedFilters,
      allowedOrders,
      searchableFields
    )

    return { value: await this.contractRepository.aggregate(criteria, op, input.field) }
  }
}
