import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { GarmentId } from '../../../../shared/domain/value-objects/garments/garment-id.vo'
import {
  GarmentAggregateProps,
  GarmentPrimitiveProps,
  GarmentUniquenessUpdateProps,
  GarmentUpdateProps,
  RegisterGarmentProps
} from './garment-types'
import { GarmentBrand } from './value-objects/garment-brand.vo'
import { GarmentCategory } from './value-objects/garment-category.vo'
import { GarmentColor } from './value-objects/garment-color.vo'
import { GarmentName } from './value-objects/garment-name.vo'
import { GarmentPrice } from './value-objects/garment-price.vo'
import { GarmentSize } from './value-objects/garment-size.vo'
import { GarmentStatus } from './value-objects/garment-status.vo'
import { Sku } from './value-objects/sku.vo'
import { StockUnits } from './value-objects/stock-units.vo'

export class Garment extends AggregateRoot {
  private constructor(
    private readonly _id: GarmentId,
    private _sku: Sku,
    private _name: GarmentName,
    private _category: GarmentCategory,
    private _size: GarmentSize,
    private _brand: GarmentBrand,
    private _color: GarmentColor,
    private _price: GarmentPrice,
    private _stock: StockUnits,
    private _status: GarmentStatus
  ) {
    super()
  }

  //#region ...Getters...
  get id(): GarmentId {
    return this._id
  }
  get sku(): Sku {
    return this._sku
  }
  get name(): GarmentName {
    return this._name
  }
  get category(): GarmentCategory {
    return this._category
  }
  get size(): GarmentSize {
    return this._size
  }
  get brand(): GarmentBrand {
    return this._brand
  }
  get color(): GarmentColor {
    return this._color
  }
  get price(): GarmentPrice {
    return this._price
  }
  get stock(): StockUnits {
    return this._stock
  }
  get status(): GarmentStatus {
    return this._status
  }
  //#endregion

  static create(props: GarmentAggregateProps): Garment {
    return new Garment(
      props.id,
      props.sku,
      props.name,
      props.category,
      props.size,
      props.brand,
      props.color,
      props.price,
      props.stock,
      props.status
    )
  }

  static register(props: RegisterGarmentProps): Garment {
    return Garment.create({
      id: GarmentId.create(props.id),
      sku: Sku.create(props.sku),
      name: GarmentName.create(props.name),
      category: GarmentCategory.create(props.category),
      size: GarmentSize.create(props.size),
      brand: GarmentBrand.create(props.brand ?? ''),
      color: GarmentColor.create(props.color ?? ''),
      price: GarmentPrice.create(props.price),
      stock: StockUnits.create(props.stock),
      status: GarmentStatus.create(props.status)
    })
  }

  static fromPrimitives(props: GarmentPrimitiveProps): Garment {
    return new Garment(
      GarmentId.create(props.id),
      Sku.create(props.sku),
      GarmentName.create(props.name),
      GarmentCategory.create(props.category),
      GarmentSize.create(props.size),
      GarmentBrand.create(props.brand),
      GarmentColor.create(props.color),
      GarmentPrice.create(props.price),
      StockUnits.create(props.stock),
      GarmentStatus.create(props.status)
    )
  }

  toPrimitives(): GarmentPrimitiveProps {
    return {
      id: this._id.value,
      sku: this._sku.value,
      name: this._name.value,
      category: this._category.value,
      size: this._size.value,
      brand: this._brand.value,
      color: this._color.value,
      price: this._price.value,
      stock: this._stock.value,
      status: this._status.value
    }
  }

  updateDetails(updates: GarmentUpdateProps): void {
    if (updates.sku !== undefined) {
      this._sku = Sku.create(updates.sku)
    }
    if (updates.name !== undefined) {
      this._name = GarmentName.create(updates.name)
    }
    if (updates.category !== undefined) {
      this._category = GarmentCategory.create(updates.category)
    }
    if (updates.size !== undefined) {
      this._size = GarmentSize.create(updates.size)
    }
    if (updates.brand !== undefined) {
      this._brand = GarmentBrand.create(updates.brand)
    }
    if (updates.color !== undefined) {
      this._color = GarmentColor.create(updates.color)
    }
    if (updates.price !== undefined) {
      this._price = GarmentPrice.create(updates.price)
    }
    if (updates.stock !== undefined) {
      this._stock = StockUnits.create(updates.stock)
    }
    if (updates.status !== undefined) {
      this._status = GarmentStatus.create(updates.status)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Garment)) {
      return false
    }
    return this._id.equals(other._id)
  }

  newSkuIfChanged(updates: GarmentUniquenessUpdateProps): Undefinable<Sku> {
    if (!updates.sku) {
      return
    }

    const newSku = Sku.create(updates.sku)

    if (this._sku.equals(newSku)) {
      return
    }

    return newSku
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
