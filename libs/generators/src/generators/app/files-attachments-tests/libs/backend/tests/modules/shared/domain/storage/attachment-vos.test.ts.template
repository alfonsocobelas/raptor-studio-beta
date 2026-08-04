import fc from 'fast-check'
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_FILE_NAME_LENGTH,
  MAX_ATTACHMENT_SIZE_BYTES
} from '../../../../../src/contexts/shared/domain/storage/attachment-constants'
import { AttachmentFileName } from '../../../../../src/contexts/shared/domain/storage/value-objects/attachment-file-name.vo'
import { AttachmentMimeType } from '../../../../../src/contexts/shared/domain/storage/value-objects/attachment-mime-type.vo'
import { AttachmentSizeBytes } from '../../../../../src/contexts/shared/domain/storage/value-objects/attachment-size-bytes.vo'

// Las reglas de fichero son de DOMINIO: el borde HTTP solo traduce el error a un status.
describe('AttachmentFileName', () => {
  it('acepta cualquier nombre no vacío dentro del máximo', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: MAX_ATTACHMENT_FILE_NAME_LENGTH }), name => {
        fc.pre(name.trim().length > 0)

        expect(AttachmentFileName.create(name).value).toBe(name)
      })
    )
  })

  it('rechaza el vacío y el whitespace', () => {
    expect(() => AttachmentFileName.create('')).toThrow()
    expect(() => AttachmentFileName.create('   ')).toThrow()
  })

  it('rechaza por encima del máximo', () => {
    expect(() => AttachmentFileName.create('a'.repeat(MAX_ATTACHMENT_FILE_NAME_LENGTH + 1))).toThrow()
  })
})

describe('AttachmentMimeType', () => {
  it('acepta todos los tipos de la allowlist', () => {
    for (const mimeType of ALLOWED_ATTACHMENT_MIME_TYPES) {
      expect(AttachmentMimeType.create(mimeType).value).toBe(mimeType)
    }
  })

  it('rechaza cualquier tipo fuera de la allowlist', () => {
    // el ejecutable es el caso que importa: nada de subir binarios arbitrarios
    expect(() => AttachmentMimeType.create('application/x-msdownload')).toThrow()
    expect(() => AttachmentMimeType.create('')).toThrow()
  })
})

describe('AttachmentSizeBytes', () => {
  it('acepta cualquier entero entre 1 y el máximo', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: MAX_ATTACHMENT_SIZE_BYTES }), size => {
        expect(AttachmentSizeBytes.create(size).value).toBe(size)
      })
    )
  })

  it('rechaza el fichero vacío, el negativo y el decimal', () => {
    expect(() => AttachmentSizeBytes.create(0)).toThrow()
    expect(() => AttachmentSizeBytes.create(-1)).toThrow()
    expect(() => AttachmentSizeBytes.create(1.5)).toThrow()
  })

  it('rechaza por encima del máximo', () => {
    expect(() => AttachmentSizeBytes.create(MAX_ATTACHMENT_SIZE_BYTES + 1)).toThrow()
  })
})
