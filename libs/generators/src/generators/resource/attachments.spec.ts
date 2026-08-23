import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import kernelGenerator from '../kernel/kernel'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 14: `attachments: true` emite la pieza de subida de ficheros como módulo
 * ADITIVO — tabla propia, sin tocar el agregado ni los módulos existentes.
 */
describe('resource generator — adjuntos', () => {
  const withAttachments = (): ResourceDefinition =>
    ({
      ...MODELS['supplier'],
      name: 'invoice',
      plural: 'invoices',
      attachments: true,
      detail: {}
    }) as ResourceDefinition

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

    expect(controller).toContain("@Controller('invoices/:invoiceId/attachments')")
    expect(controller).toContain('@UseInterceptors(FileInterceptor')
    expect(controller).toContain("@Get(':id/download')")
    expect(controller).toContain('@Delete')
  })

  it('el servicio compensa el binario si fallan los metadatos', async () => {
    // spec 25: la validación de tamaño y MIME se comprobaba aquí; ahora vive en los VOs del
    // dominio y la cubre el bloque «validación en el dominio» de más abajo
    const tree = await generate(withAttachments())
    const service = tree.read('out/backend/infrastructure/attachments/invoice-attachments.service.ts', 'utf-8')

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

  /**
   * TASK-02 (spec 25): las reglas de fichero son de dominio. El servicio construye los VOs y
   * el borde traduce su error; sin `if`s de validación en infraestructura.
   */
  describe('validación en el dominio', () => {
    it('el servicio valida construyendo los value objects', async () => {
      const tree = await generate(withAttachments())
      const service = tree.read('out/backend/infrastructure/attachments/invoice-attachments.service.ts', 'utf-8') ?? ''

      expect(service).toContain('AttachmentFileName.create')
      expect(service).toContain('AttachmentMimeType.create')
      expect(service).toContain('AttachmentSizeBytes.create')
    })

    it('ya no valida con ifs ni conoce las constantes de límite', async () => {
      const tree = await generate(withAttachments())
      const service = tree.read('out/backend/infrastructure/attachments/invoice-attachments.service.ts', 'utf-8') ?? ''

      expect(service).not.toContain('MAX_ATTACHMENT_SIZE_BYTES')
      expect(service).not.toContain('ALLOWED_ATTACHMENT_MIME_TYPES')
      expect(service).not.toMatch(/if \(file\.(sizeBytes|mimeType)/)
    })

    it('conserva lo que ya estaba bien: storageKey de backend y rollback del binario', async () => {
      const tree = await generate(withAttachments())
      const service = tree.read('out/backend/infrastructure/attachments/invoice-attachments.service.ts', 'utf-8') ?? ''

      expect(service).toContain('const storageKey = uuidv7()')
      expect(service).toContain('this.fileStorage.delete(storageKey)')
    })
  })
})

describe('adjuntos — persistencia y migración', () => {
  const invoice = () =>
    ({
      ...MODELS['supplier'],
      name: 'invoice',
      plural: 'invoices',
      attachments: true,
      detail: {}
    }) as ResourceDefinition

  it('el DataSource del kernel registra la entidad de adjuntos', async () => {
    registerModels([invoice()])
    const tree = createTreeWithEmptyWorkspace()
    await kernelGenerator(tree, { directory: 'k', models: 'invoice' })

    const persistence = tree.read(
      'k/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module.ts',
      'utf-8'
    )
    expect(persistence).toContain('TypeOrmInvoiceAttachmentEntity')
    expect(persistence).toContain('infrastructure/attachments/invoice-attachment.entity')
  })

  it('la migración inicial crea (y borra) la tabla de adjuntos', async () => {
    const { migrationsPlugin } = await import('../app/plugins/migrations.plugin')
    const tree = createTreeWithEmptyWorkspace()
    migrationsPlugin.apply?.(tree, {
      root: 'r',
      appName: 'app',
      backendSrc: 'r/libs/backend/src',
      frontendSrc: 'r/libs/frontend/src',
      models: [invoice()],
      scope: '@app',
      sessionStore: 'postgres'
    })

    const file = tree
      .children('r/libs/backend/src/contexts/shared/infrastructure/persistence/typeorm/migrations')
      .find(f => f.includes('InitialSchema')) as string
    const migration =
      tree.read(`r/libs/backend/src/contexts/shared/infrastructure/persistence/typeorm/migrations/${file}`, 'utf-8') ??
      ''

    expect(migration).toContain('CREATE TABLE warehouse.invoices_attachments')
    expect(migration).toContain('storage_key UUID')
    expect(migration).toContain('DROP TABLE IF EXISTS warehouse.invoices_attachments')
    // el borrado de adjuntos va ANTES del de su recurso (FK-safe)
    const dropLines = migration.split('\n').filter(line => line.includes('DROP TABLE IF EXISTS'))
    const attachmentsAt = dropLines.findIndex(line => line.includes('invoices_attachments'))
    const resourceAt = dropLines.findIndex(line => line.includes('invoices') && !line.includes('attachments'))
    expect(attachmentsAt).toBeGreaterThanOrEqual(0)
    expect(attachmentsAt).toBeLessThan(resourceAt)
  })
})

/**
 * Spec 16 · TASK-04: los adjuntos cuelgan del REGISTRO, no del recurso. Las
 * radiografías son de un paciente concreto, no de «pacientes».
 */
describe('resource generator — adjuntos por registro', () => {
  const withAttachments = (): ResourceDefinition =>
    ({
      ...MODELS['supplier'],
      name: 'invoice',
      plural: 'invoices',
      attachments: true,
      detail: {}
    }) as ResourceDefinition

  const generate = async (): Promise<Tree> => {
    registerModels([withAttachments()])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'invoice', directory: 'out' })
    return tree
  }

  it('el módulo importa StorageModule con la profundidad real del árbol emitido', async () => {
    const tree = await generate()
    const module = tree.read('out/backend/invoices.module.ts', 'utf-8')

    // contexts/<ctx>/modules/<plural>/ → shared vive tres niveles arriba
    expect(module).toContain("from '../../../shared/infrastructure/storage/storage.module'")
  })

  it('la entidad guarda a qué registro pertenece el adjunto', async () => {
    const tree = await generate()
    const entity = tree.read('out/backend/infrastructure/attachments/invoice-attachment.entity.ts', 'utf-8')

    expect(entity).toContain("name: 'invoice_id'")
    expect(entity).toContain('invoiceId!: string')
  })

  it('las rutas cuelgan del registro', async () => {
    const tree = await generate()
    const controller = tree.read('out/backend/infrastructure/attachments/invoice-attachments.controller.ts', 'utf-8')

    expect(controller).toContain("@Controller('invoices/:invoiceId/attachments')")
    expect(controller).toContain("@Param('invoiceId', ParseUUIDv7Pipe)")
  })

  it('el servicio filtra y sella por registro', async () => {
    const tree = await generate()
    const service = tree.read('out/backend/infrastructure/attachments/invoice-attachments.service.ts', 'utf-8')

    expect(service).toContain('invoiceId')
    expect(service).toContain('where: { invoiceId }')
  })

  it('el componente recibe el registro al que pertenece', async () => {
    const tree = await generate()
    const component = tree.read('out/frontend/invoice-attachments.component.ts', 'utf-8')

    expect(component).toContain('invoiceId = input.required<string>()')
  })
})
