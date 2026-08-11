import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { fillFlowSlotsGenerator, flowFillReport, pendingFlowSlots } from './fill-flow-slots'

/**
 * Spec 39, TASK-10: recolección. El comando de relleno empieza por saber QUÉ falta.
 * Sin ejecutor de IA disponible reporta y termina sin tocar nada: la IA vive en los
 * bordes y bajo gate, así que un comando sin ejecutor no es un fallo, es un informe.
 */
describe('fill-flow-slots — recolección (spec 39)', () => {
  const PROCESS = 'apps/demo/libs/backend/src/contexts/warehouse/processes/ciclo/ciclo.process.ts'

  const emittedApp = (): Tree => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write(
      PROCESS,
      [
        'export class CicloProcess {',
        '  async revisar(id: GarmentId): Promise<void> {',
        '    // @ai:begin flow-revisar — Se revisa y registra',
        '    // @ai:end',
        '  }',
        '',
        '  async subsanar(): Promise<void> {',
        '    // @ai:begin flow-subsanar — Se subsana',
        '    await this.garmentRepository.save(x)',
        '    // @ai:end',
        '  }',
        '}',
        ''
      ].join('\n')
    )
    // un hueco de otra familia: el relleno de flujos no es asunto suyo
    tree.write(
      'apps/demo/libs/backend/src/contexts/warehouse/modules/garments/domain/garment.ts',
      'class Garment {\n  // @ai:begin domain-extra\n  // @ai:end\n}\n'
    )
    return tree
  }

  it('lista los huecos flow-* vacíos de la app emitida y solo esos', () => {
    const tree = emittedApp()

    expect(pendingFlowSlots(tree, 'apps/demo')).toEqual([{ file: PROCESS, id: 'flow-revisar' }])
  })

  it('sin ejecutor disponible el informe declara los pendientes y ningún relleno', () => {
    const tree = emittedApp()

    expect(flowFillReport(tree, { directory: 'apps/demo' })).toEqual({
      executor: 'none',
      pending: [{ file: PROCESS, id: 'flow-revisar' }],
      filled: []
    })
  })

  it('sin ejecutor el comando no toca un solo fichero', async () => {
    const tree = emittedApp()
    const GARMENT = 'apps/demo/libs/backend/src/contexts/warehouse/modules/garments/domain/garment.ts'
    const before = new Map([
      [PROCESS, tree.read(PROCESS, 'utf-8')],
      [GARMENT, tree.read(GARMENT, 'utf-8')]
    ])
    const changesBefore = tree.listChanges().length

    // el generador devuelve void a propósito: Nx invoca como callback lo que devuelve
    // un generador (`if (task) await task()`), así que el informe va por función pura
    await expect(fillFlowSlotsGenerator(tree, { directory: 'apps/demo' })).resolves.toBeUndefined()

    // THEN: el árbol queda byte a byte como estaba
    for (const [file, content] of before) {
      expect(tree.read(file, 'utf-8')).toBe(content)
    }
    // ni un cambio nuevo en el árbol (los previos son los que escribió este test)
    expect(tree.listChanges().length).toBe(changesBefore)
  })

  it('sin huecos pendientes el informe va vacío', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('apps/demo/a.ts', 'const a = 1\n')

    expect(flowFillReport(tree, { directory: 'apps/demo' }).pending).toEqual([])
  })

  it('falla fuerte si el directorio no existe (no se rellena lo que no está)', async () => {
    const tree = createTreeWithEmptyWorkspace()

    await expect(fillFlowSlotsGenerator(tree, { directory: 'apps/no-existe' })).rejects.toThrow('apps/no-existe')
  })
})
