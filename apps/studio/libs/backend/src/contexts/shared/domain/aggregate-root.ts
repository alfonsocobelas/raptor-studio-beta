export abstract class AggregateRoot {
  abstract toPrimitives(): unknown
  abstract equals(other: AggregateRoot): boolean
}
