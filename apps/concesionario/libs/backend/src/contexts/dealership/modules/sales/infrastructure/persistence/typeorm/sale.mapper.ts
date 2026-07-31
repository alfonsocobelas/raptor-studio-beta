import { Sale } from '../../../domain/sale'
import { TypeOrmSaleEntity } from './typeorm-sale.entity'

export class SaleMapper {
  static toDomain(entity: TypeOrmSaleEntity): Sale {
    return Sale.fromPrimitives({
      id: entity.id,
      reference: entity.reference,
      saleDate: entity.saleDate,
      vehicleLabel: entity.vehicleLabel,
      clientLabel: entity.clientLabel,
      salesperson: entity.salesperson,
      amount: entity.amount,
      discount: entity.discount,
      paymentMethod: entity.paymentMethod,
      status: entity.status
    })
  }

  static toPersistence(domain: Sale): TypeOrmSaleEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmSaleEntity()
    entity.id = primitives.id
    entity.reference = primitives.reference
    entity.saleDate = primitives.saleDate
    entity.vehicleLabel = primitives.vehicleLabel
    entity.clientLabel = primitives.clientLabel
    entity.salesperson = primitives.salesperson
    entity.amount = primitives.amount
    entity.discount = primitives.discount
    entity.paymentMethod = primitives.paymentMethod
    entity.status = primitives.status

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
