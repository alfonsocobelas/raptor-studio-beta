import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import kernelGenerator from '../kernel/kernel'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@acc/schema'

/**
 * Spec 14: `attachments: true` emite la pieza de subida de ficheros como módulo
 * ADITIVO — tabla propia, sin tocar el agregado ni los módulos existentes.
 */
describe('resource generator — adjuntos', () => {
  const withAttachments = (): ResourceDefinition =>
    ({ ...MODELS['supplier'], name: 'invoice', plural: 'invoices', attachments: true }) as ResourceDefinition

  const generate = async (model: ResourceDefinition): Promise<Tree> => {
    registerModels([model])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }

  it('emite entidad, servicio y controller de adjuntos + el componente frontend', async () => {
    const tree = await generate(withAttachments())

    expect(tree.exists('out/backend/infrastructure/attachments/invoice-attachment.entity.ts')).toBe(true)
    expect(tree.exists('out/backend/infrastructure/attachments/invoice-attachments.service.ts')).toBe(true)
    expect(tree.exists('out/backend/infrastructure/attachments/invoice-attachments.controller.ts')).toBe(true)
    expect(tree.exists('out/frontend/invoice-attachments.component.ts')).toBe(true)
  })

  it('el controller expone subir, listar, descargar y borrar bajo el recurso', async () => {
    const tree = await generate(withAttachments())
    const controller = tree.read('out/backend/infrastructure/attachments/invoice-attachments.controller.ts', 'utf-8')

    expect(controller).toContain("@Controller('invoices/attachments')")
    expect(controller).toContain('@UseInterceptors(FileInterceptor')
    expect(controller).toContain("@Get(':id/download')")
    expect(controller).toContain('@Delete')
  })

  it('el servicio valida tamaño y MIME y compensa el binario si fallan los metadatos', async () => {
    const tree = await generate(withAttachments())
    const service = tree.read('out/backend/infrastructure/attachments/invoice-attachments.service.ts', 'utf-8')

    expect(service).toContain('MAX_ATTACHMENT_SIZE_BYTES')
    expect(service).toContain('ALLOWED_ATTACHMENT_MIME_TYPES')
    expect(service).toContain('this.fileStorage.delete(storageKey)')
    // el key SIEMPRE lo genera el backend
    expect(service).toContain('const storageKey = uuidv7()')
  })

  it('el módulo del recurso registra la entidad, el controller y el servicio', async () => {
    const tree = await generate(withAttachments())
    const module = tree.read('out/backend/invoices.module.ts', 'utf-8')

    expect(module).toContain('TypeOrmModule.forFeature([TypeOrmInvoiceAttachmentEntity])')
    expect(module).toContain('InvoiceAttachmentsController')
    expect(module).toContain('InvoiceAttachmentsService')
  })

  it('sin attachments no emite NADA de la pieza (aditivo puro)', async () => {
    const tree = await generate({ ...MODELS['supplier'], name: 'plain', plural: 'plains' } as ResourceDefinition)

    expect(tree.exists('out/backend/infrastructure/attachments/plain-attachment.entity.ts')).toBe(false)
    expect(tree.exists('out/frontend/plain-attachments.component.ts')).toBe(false)
    expect(tree.read('out/backend/plains.module.ts', 'utf-8')).not.toContain('Attachments')
  })

  it('el kernel añade adapter local + módulo de storage SOLO si hay adjuntos', async () => {
    registerModels([withAttachments()])
    const withFiles = createTreeWithEmptyWorkspace()
    await kernelGenerator(withFiles, { directory: 'k1', models: 'invoice' })
    const withoutFiles = createTreeWithEmptyWorkspace()
    await kernelGenerator(withoutFiles, { directory: 'k2', models: 'supplier' })

    // el puerto ya formaba parte del kernel curado; lo nuevo es el adapter por defecto
    expect(withFiles.exists('k1/contexts/shared/infrastructure/storage/local-file-storage.ts')).toBe(true)
    expect(withFiles.exists('k1/contexts/shared/infrastructure/storage/storage.module.ts')).toBe(true)
    expect(withFiles.exists('k1/contexts/shared/domain/storage/attachment-constants.ts')).toBe(true)
    expect(withoutFiles.exists('k2/contexts/shared/infrastructure/storage/local-file-storage.ts')).toBe(false)
    expect(withoutFiles.exists('k2/contexts/shared/domain/storage/attachment-constants.ts')).toBe(false)
  })
})
