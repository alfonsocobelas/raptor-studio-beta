import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { MetricId } from '../value-objects/metric-id.vo'

export class LicenseWithCustomerAndMetricSpecification extends Criteria {
  private constructor(customerId: CustomerId, metricId: MetricId) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('customerId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(customerId.value)
        ),
        new Filter(
          FilterField.create('metricId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(metricId.value)
        )
      ])
    })
  }

  static withCustomerAndMetric(customerId: CustomerId, metricId: MetricId): LicenseWithCustomerAndMetricSpecification {
    return new LicenseWithCustomerAndMetricSpecification(customerId, metricId)
  }
}

export const withCustomerAndMetric = LicenseWithCustomerAndMetricSpecification.withCustomerAndMetric
