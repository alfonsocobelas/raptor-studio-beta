import { UuidV7ValueObject } from './uuidv7-value-object'

/**
 * La operación de borrado (spec 38): cada fila archivada guarda el id de la operación
 * que la arrastró, y restaurar revierte exactamente esa operación en todo el árbol.
 */
export class DeleteOperationId extends UuidV7ValueObject {
  protected static override fieldName = 'Delete operation ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): DeleteOperationId {
    this.ensureIsValidUuidV7(value)
    return new DeleteOperationId(value)
  }

  static override random(): DeleteOperationId {
    return new DeleteOperationId(super.random().value)
  }
}
