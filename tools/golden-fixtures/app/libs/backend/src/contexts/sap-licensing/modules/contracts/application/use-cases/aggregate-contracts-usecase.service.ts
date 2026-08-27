import { Injectable } from '@nestjs/common'
import {
  AGGREGATE_GROUP_LIMIT,
  AggregateGroup,
  AggregateInput,
  AggregateOutput,
  ensureAggregateOp,
  opAllowedOn,
  opNeedsField
} from '../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../shared/domain/query/criteria'
import { InvalidArgumentError } from '../../../../../shared/domain/errors'
import { ContractRepository } from '../../domain/contract-repository'
import searchContractConfig from '../config/search-contract-config'

/**
 * Una agregación del recurso, con o sin desglose (specs 71 y 72). La FRONTERA DE CONFIANZA está
 * aquí: los nombres de campo llegan por HTTP y acaban interpolados en la consulta, así que se
 * comprueban contra las listas blancas emitidas antes de bajar al repositorio. El DTO valida la
 * forma; esta es la única capa por la que pasan todos los caminos.
 */
@Injectable()
export class AggregateContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: AggregateInput): Promise<AggregateOutput> {
    const { allowedFilters, allowedOrders, searchableFields, aggregatableFields, groupableFields } =
      searchContractConfig
    const op = ensureAggregateOp(input.op)
    const field = input.field

    // `count` cuenta filas: no mide ninguna columna. El resto exige un campo agregable.
    if (opNeedsField(op)) {
      const kind = (aggregatableFields as Record<string, 'numeric' | 'date' | undefined>)[field ?? '']
      if (!kind) throw new InvalidArgumentError(`The field "${field}" cannot be aggregated`)
      if (!opAllowedOn(op, kind)) {
        throw new InvalidArgumentError(`The operation "${op}" does not apply to a ${kind} field`)
      }
    }

    // dos ejes de agrupación son una tabla cruzada: otra pregunta, y no esta
    if (input.groupBy && input.bucket) {
      throw new InvalidArgumentError('groupBy and bucket are mutually exclusive')
    }
    if (input.groupBy && !(groupableFields as readonly string[]).includes(input.groupBy)) {
      throw new InvalidArgumentError(`The field "${input.groupBy}" cannot be grouped by`)
    }
    if (input.bucket !== undefined && input.bucket !== 'month') {
      throw new InvalidArgumentError(`The bucket "${input.bucket}" is not supported`)
    }
    if (input.bucket) {
      const kind = (aggregatableFields as Record<string, 'numeric' | 'date' | undefined>)[input.bucketField ?? '']
      if (kind !== 'date') throw new InvalidArgumentError(`The bucket needs a date field`)
    }

    // el mismo lenguaje de filtro que el listado: una sola sintaxis en toda la app
    const criteria = Criteria.fromOffset(
      { page: 1, pageSize: 1, filters: input.filters } as never,
      allowedFilters,
      allowedOrders,
      searchableFields
    )

    const value = opNeedsField(op)
      ? await this.contractRepository.aggregate(criteria, op, field as string)
      : await this.contractRepository.count(criteria)

    if (!input.groupBy && !input.bucket) return { value }

    const raw = await this.contractRepository.aggregateGrouped(criteria, {
      op,
      field,
      groupBy: input.groupBy,
      bucketField: input.bucket ? input.bucketField : undefined,
      limit: AGGREGATE_GROUP_LIMIT
    })
    const truncated = raw.length > AGGREGATE_GROUP_LIMIT
    const groups = truncated ? raw.slice(0, AGGREGATE_GROUP_LIMIT) : raw

    return {
      value,
      groups: input.bucket ? monthsOf(groups, input.months ?? 12, op) : groups,
      ...(truncated ? { truncated: true } : {})
    }
  }
}

/**
 * Los meses vacíos los rellena el DOMINIO, no el motor: ninguno de los dos genera filas que no
 * existen, y una serie con huecos no se puede dibujar.
 *
 * El hueco vale 0 al contar, sumar o contar distintos. En la media, el máximo y el mínimo el mes
 * sin datos se queda a `null`: la media de un mes vacío no es cero.
 */
function monthsOf(groups: AggregateGroup[], months: number, op: string): AggregateGroup[] {
  const found = new Map(groups.map(group => [group.key, group.value]))
  const empty = op === 'count' || op === 'sum' || op === 'distinct' ? 0 : null
  const now = new Date()

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1)
    const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`
    return { key, value: found.has(key) ? (found.get(key) ?? null) : empty }
  })
}
