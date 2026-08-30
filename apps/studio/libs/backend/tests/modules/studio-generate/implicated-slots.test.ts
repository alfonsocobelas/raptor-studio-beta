import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { implicatedSlotIds } from '@app/backend/contexts/studio/generate/implicated-slots'

/**
 * Spec 75 TASK-03: cuando la validación falla, hay que saber si el rojo es de un hueco
 * relleno por IA (reparable) o del código canónico (defecto del generador, jamás se
 * parchea a mano). Sospechoso = hueco flow-* CON cuerpo cuyo fichero cita la salida
 * del fallo (por basename: un falso positivo solo gasta una propuesta bajo gate).
 */
describe('implicatedSlotIds', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'implicated-'))
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  const processFile = (name: string, content: string): void => {
    const dir = path.join(root, 'libs/backend/src/contexts/x/processes')
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, name), content)
  }

  const FILLED = [
    'class AltaProcess {',
    '  async pedir(): Promise<void> {',
    '    // @ai:begin flow-pedir — Se pide',
    '    await this.repo.save(x)',
    '    // @ai:end',
    '  }',
    '}'
  ].join('\n')

  it('un hueco relleno cuyo fichero cita el informe es sospechoso', () => {
    processFile('alta.process.ts', FILLED)

    const suspects = implicatedSlotIds(root, "FAIL alta.process.ts\n  error TS2304: Cannot find name 'x'")

    expect(suspects).toEqual(['flow-pedir'])
  })

  it('un hueco VACÍO no es sospechoso aunque su fichero esté citado: no hay nada que reparar', () => {
    processFile('alta.process.ts', ['    // @ai:begin flow-pedir — Se pide', '    // @ai:end'].join('\n'))

    expect(implicatedSlotIds(root, 'FAIL alta.process.ts')).toEqual([])
  })

  it('un fichero que el informe no cita no aporta sospechosos', () => {
    processFile('alta.process.ts', FILLED)
    processFile(
      'baja.process.ts',
      ['    // @ai:begin flow-cerrar — Se cierra', '    await this.repo.remove(x)', '    // @ai:end'].join('\n')
    )

    expect(implicatedSlotIds(root, 'FAIL alta.process.ts')).toEqual(['flow-pedir'])
  })

  it('sin ficheros citados no hay sospechosos: el fallo es canónico', () => {
    processFile('alta.process.ts', FILLED)

    expect(implicatedSlotIds(root, 'FAIL libs/backend/tests/modules/shared/uuid.vo.test.ts')).toEqual([])
  })
})
