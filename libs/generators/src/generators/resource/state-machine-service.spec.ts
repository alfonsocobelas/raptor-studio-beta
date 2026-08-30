import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 43 TASK-10: el servicio Angular emitido gana un método por transición — POST al
 * verbo y reload del listado, el mismo contrato que create/update. El test emitido del
 * servicio cubre el POST.
 */
describe('el servicio frontend con máquina de estados', () => {
  let tree: Tree
  const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
  })

  it('emite un método por transición: POST al verbo y recarga', () => {
    const service = read('frontend/contract.service.ts')

    expect(service).toContain('terminate(id: string, version: number): Promise<void> {')
    expect(service).toMatch(/post<void>\(`\$\{API_URL\}\/\$\{id\}\/terminate`, \{ version \}\)/)
    expect(service).toMatch(/terminate\(id: string, version: number\): Promise<void> \{[\s\S]{0,200}this\.contracts\.reload\(\)/)
    expect(service).toContain('expire(id: string, version: number): Promise<void> {')
  })

  it('el spec emitido del servicio cubre la transición', () => {
    const spec = read('frontend/contract.service.spec.ts')

    expect(spec).toContain('terminate')
    expect(spec).toMatch(/httpPost\).toHaveBeenCalledWith\([\s\S]{0,80}\/terminate/)
  })

  it('un recurso sin máquina no gana métodos de transición', async () => {
    const clean = createTreeWithEmptyWorkspace()
    await resourceGenerator(clean, { name: 'customer', directory: 'out' })

    expect(clean.read('out/frontend/customer.service.ts', 'utf-8')).not.toContain('terminate(')
  })
})
