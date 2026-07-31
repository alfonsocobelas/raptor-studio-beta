import * as crypto from 'crypto'
import { InvalidArgumentError } from '../errors'
import { Encoding } from '../enums'
import { Filters } from './filters'
import { Orders } from './orders'

export type CursorValue = string | number | boolean | null

export interface CursorField {
  field: string
  value: CursorValue
}

export type CursorPosition = CursorField[]

interface CursorMetadata {
  position: CursorPosition
  filtersHash?: string
  ordersHash?: string
  createdAt: number
}

export class Cursor {
  private static readonly EXPIRATION_TIME_MS = 24 * 60 * 60 * 1000

  constructor(readonly position: CursorPosition) {}

  static encode(position: CursorPosition, filters?: Filters, orders?: Orders): string {
    const metadata: CursorMetadata = {
      position,
      filtersHash: filters ? this.generateFiltersHash(filters) : undefined,
      ordersHash: orders ? this.generateOrdersHash(orders) : undefined,
      createdAt: Date.now()
    }

    const serialized = JSON.stringify(metadata)

    return Buffer.from(serialized, Encoding.UTF8).toString(Encoding.BASE64)
  }

  static decode(cursor: string, filters?: Filters, orders?: Orders): Cursor {
    const metadata = this.getMetadata(cursor)

    this.ensureIsNotExpired(metadata.createdAt)

    if (filters) {
      this.ensureFiltersMatch(metadata.filtersHash, filters)
    }

    if (orders) {
      this.ensureOrdersMatch(metadata.ordersHash, orders)
    }

    return new Cursor(metadata.position)
  }

  private static getMetadata(cursor: string): CursorMetadata {
    try {
      const raw = Buffer.from(cursor, Encoding.BASE64).toString(Encoding.UTF8)
      const metadata = JSON.parse(raw) as CursorMetadata

      if (!Array.isArray(metadata.position) || !metadata.position.length || !metadata.createdAt) {
        throw new InvalidArgumentError('Invalid cursor format')
      }

      return metadata
    } catch {
      throw new InvalidArgumentError('Invalid cursor format')
    }
  }

  private static ensureIsNotExpired(createdAt: number): void {
    const isExpired = Date.now() - createdAt > this.EXPIRATION_TIME_MS

    if (isExpired) {
      throw new InvalidArgumentError('Cursor is expired')
    }
  }

  private static ensureFiltersMatch(metadataFiltersHash: string | undefined, filters: Filters): void {
    const currentHash = this.generateFiltersHash(filters)

    if (metadataFiltersHash !== currentHash) {
      throw new InvalidArgumentError('Cursor filters do not match current filters')
    }
  }

  private static ensureOrdersMatch(metadataOrdersHash: string | undefined, orders: Orders): void {
    const currentHash = this.generateOrdersHash(orders)

    if (metadataOrdersHash !== currentHash) {
      throw new InvalidArgumentError('Cursor orders do not match current orders')
    }
  }

  private static generateFiltersHash(filters: Filters): string {
    const deterministic = [...filters.filters].sort((a, b) => a.field.value.localeCompare(b.field.value))

    const serialized = JSON.stringify(
      deterministic.map(filter => ({
        field: filter.field.value,
        operator: filter.operator.value,
        value: filter.value.value
      }))
    )

    return crypto.createHash('sha256').update(serialized).digest(Encoding.BASE64)
  }

  private static generateOrdersHash(orders: Orders): string {
    const deterministic = [...orders.orders].sort((a, b) => a.orderBy.value.localeCompare(b.orderBy.value))

    const serialized = JSON.stringify(
      deterministic.map(order => ({
        field: order.orderBy.value,
        direction: order.orderType.value
      }))
    )

    return crypto.createHash('sha256').update(serialized).digest(Encoding.BASE64)
  }
}
