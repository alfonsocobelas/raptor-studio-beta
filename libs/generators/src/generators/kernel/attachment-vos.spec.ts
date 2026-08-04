import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import kernelGenerator from './kernel'
import { appGenerator } from '../app/app'
import { MODELS, registerModels } from '../resource/models/registry'
import type { ResourceDefinition } from '@acc/schema'

/**
 * TASK-01 (spec 25): las reglas de fichero (nombre, MIME, tamaño) suben al DOMINIO como value
 * objects, espejo del canon `qbr` de la referencia. Viven en el kernel y no por recurso: son
 * transversales y sus constantes ya son compartidas.
 */
describe('kernel — value objects de adjunto', () => {
  const DIR = 'tmp/generated/kernel/contexts/shared/domain/storage/value-objects'
  let tree: Tree

  beforeAll(async () => {
    // el kernel emite la pieza de adjuntos solo si algún modelo la declara
    registerModels([
      { ...MODELS['supplier'], name: 'invoice', plural: 'invoices', attachments: true } as ResourceDefinition
    ])
    tree = createTreeWithEmptyWorkspace()
    await kernelGenerator(tree, { models: 'invoice' })
  })

  const read = (file: string): string => tree.read(`${DIR}/${file}`, 'utf-8') ?? ''

  it('emite los tres VOs junto a las constantes de adjunto', () => {
    expect(tree.exists(`${DIR}/attachment-file-name.vo.ts`)).toBe(true)
    expect(tree.exists(`${DIR}/attachment-mime-type.vo.ts`)).toBe(true)
    expect(tree.exists(`${DIR}/attachment-size-bytes.vo.ts`)).toBe(true)
  })

  it('el nombre es un StringValueObject con longitud máxima', () => {
    const source = read('attachment-file-name.vo.ts')

    expect(source).toContain('extends StringValueObject')
    expect(source).toContain('ensureIsString')
    expect(source).toContain('MAX_ATTACHMENT_FILE_NAME_LENGTH')
  })

  it('el MIME es un EnumValueObject sobre la lista permitida (allowlist, no denylist)', () => {
    const source = read('attachment-mime-type.vo.ts')

    expect(source).toContain('extends EnumValueObject')
    expect(source).toContain('ALLOWED_ATTACHMENT_MIME_TYPES')
    expect(source).toContain('ensureIsValidEnum')
  })

  it('el tamaño es un IntegerValueObject acotado por el máximo compartido', () => {
    const source = read('attachment-size-bytes.vo.ts')

    expect(source).toContain('extends IntegerValueObject')
    expect(source).toContain('ensureIsInteger')
    expect(source).toContain('MAX_ATTACHMENT_SIZE_BYTES')
  })
})

/**
 * Los tests de los VOs los emite el generador de APP, no el kernel: el kernel escribe en
 * `libs/backend/src` y los tests viven fuera, donde el proyecto `unit` del jest emitido los busca
 * (`libs/backend/tests/modules/**`).
 */
describe('app — tests emitidos de los VOs de adjunto', () => {
  it('los deja donde la suite de la app los ejecuta', async () => {
    registerModels([
      { ...MODELS['supplier'], name: 'invoice', plural: 'invoices', attachments: true } as ResourceDefinition
    ])
    const tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'invoice', skipInstall: true })

    expect(tree.exists('apps/demo/libs/backend/tests/modules/shared/domain/storage/attachment-vos.test.ts')).toBe(true)
  })
})
