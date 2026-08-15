import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { pendingFlowSlotIds } from '@app/backend/contexts/studio/generate/pending-slots'

/**
 * Spec 45 TASK-01: el `done` de generar cuenta los huecos `flow-*` que quedaron vacíos.
 * Es un escáner de disco (el generador ya terminó): hueco = @ai:begin flow-… seguido de
 * @ai:end sin nada más que espacio en medio.
 */
describe('pendingFlowSlotIds', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'slots-'))
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  const processFile = (content: string, name = 'alta.process.ts'): void => {
    const dir = path.join(root, 'libs/backend/src/contexts/x/processes/alta')
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, name), content)
  }

  it('cuenta los huecos flow-* vacíos, en orden de aparición', () => {
    processFile(
      [
        'class AltaProcess {',
        '  async pedir(): Promise<void> {',
        '    // @ai:begin flow-pedir — Se pide',
        '    // @ai:end',
        '  }',
        '  async cerrar(): Promise<void> {',
        '    // @ai:begin flow-cerrar — Se cierra',
        '    // @ai:end',
        '  }',
        '}'
      ].join('\n')
    )

    expect(pendingFlowSlotIds(root)).toEqual(['flow-pedir', 'flow-cerrar'])
  })

  it('un hueco YA RELLENO no cuenta', () => {
    processFile(
      [
        '    // @ai:begin flow-pedir — Se pide',
        '    await this.repo.save(x)',
        '    // @ai:end',
        '    // @ai:begin flow-cerrar — Se cierra',
        '    // @ai:end'
      ].join('\n')
    )

    expect(pendingFlowSlotIds(root)).toEqual(['flow-cerrar'])
  })

  it('los huecos que no son de paso (domain-extra) no cuentan', () => {
    processFile(['  // @ai:begin domain-extra — métodos', '  // @ai:end'].join('\n'))

    expect(pendingFlowSlotIds(root)).toEqual([])
  })

  it('una app sin processes/ da lista vacía, no error', () => {
    expect(pendingFlowSlotIds(root)).toEqual([])
  })
})
