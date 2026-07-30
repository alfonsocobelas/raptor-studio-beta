import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'

/**
 * Filtro impuesto por el servidor para acotar la búsqueda de clientes a los activos.
 * Se aplica por defecto; solo se omite cuando el cliente pide includeArchived (spec 32).
 */
export function activeCustomersFilter(): Filter {
  return new Filter(FilterField.create('status'), FilterOperator.create(Operator.EQUAL), FilterValue.create('active'))
}

/**
 * Filtro complementario para acotar un conteo/búsqueda a los clientes archivados (spec 40).
 */
export function archivedCustomersFilter(): Filter {
  return new Filter(FilterField.create('status'), FilterOperator.create(Operator.EQUAL), FilterValue.create('archived'))
}
