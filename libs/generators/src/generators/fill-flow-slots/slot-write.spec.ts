import { readSlotBody, replaceSlotBody } from '../resource/ai-slots'
import { validateSlotOnlyEdit } from './slot-write'

/**
 * Spec 39, TASK-12 (primera mitad): la escritura queda ACOTADA al hueco. Quien rellena
 * propone el fichero entero; aquí se decide si esa propuesta toca solo el hueco pedido.
 * Cualquier edición fuera lo invalida: es la frontera que hace segura a la IA del borde.
 */
const FILE = [
  "import { GarmentId } from './garment-id.vo'",
  '',
  'export class CicloProcess {',
  '  constructor(private readonly garmentRepository: GarmentRepository) {}',
  '',
  '  async revisar(id: GarmentId): Promise<void> {',
  '    // @ai:begin flow-revisar — Se revisa y registra',
  '    // @ai:end',
  '  }',
  '',
  '  async archivar(): Promise<void> {',
  '    // @ai:begin flow-archivar — Se archiva',
  '    // @ai:end',
  '  }',
  '}',
  ''
].join('\n')

describe('ai-slots — leer y sustituir el cuerpo de UN hueco', () => {
  it('lee el cuerpo del hueco pedido', () => {
    const filled = replaceSlotBody(FILE, 'flow-revisar', '    const g = 1\n')

    expect(readSlotBody(filled, 'flow-revisar')).toBe('    const g = 1\n')
    expect(readSlotBody(filled, 'flow-archivar')).toBe('')
  })

  it('un hueco que no existe se lee como undefined y no se puede sustituir', () => {
    expect(readSlotBody(FILE, 'flow-fantasma')).toBeUndefined()
    expect(replaceSlotBody(FILE, 'flow-fantasma', 'x')).toBe(FILE)
  })

  it('sustituir un cuerpo deja el resto del fichero byte a byte igual', () => {
    const filled = replaceSlotBody(FILE, 'flow-revisar', '    const g = 1\n')

    expect(filled).toContain('    const g = 1\n')
    // el otro hueco y todo lo demás intactos: se comprueba volviendo a vaciarlo
    expect(replaceSlotBody(filled, 'flow-revisar', '')).toBe(FILE)
  })

  it('le pone salto de línea al cuerpo si no lo trae (no se pega al marcador de cierre)', () => {
    const filled = replaceSlotBody(FILE, 'flow-revisar', '    const g = 1')

    expect(filled).toContain('    const g = 1\n    // @ai:end')
  })
})

describe('validateSlotOnlyEdit (frontera de la escritura)', () => {
  const accepts = (candidate: string, id = 'flow-revisar') => validateSlotOnlyEdit(FILE, candidate, id)

  it('acepta una propuesta que solo escribe dentro del hueco pedido', () => {
    const candidate = replaceSlotBody(FILE, 'flow-revisar', '    await this.garmentRepository.get(id)\n')

    expect(accepts(candidate)).toBeUndefined()
  })

  it('rechaza que se toque cualquier cosa fuera del hueco', () => {
    const candidate = replaceSlotBody(FILE, 'flow-revisar', '    const g = 1\n').replace(
      "import { GarmentId } from './garment-id.vo'",
      "import { GarmentId } from './garment-id.vo'\nimport { readFileSync } from 'fs'"
    )

    expect(accepts(candidate)).toMatch(/fuera del hueco/i)
  })

  it('rechaza que se escriba en OTRO hueco a la vez', () => {
    const candidate = replaceSlotBody(replaceSlotBody(FILE, 'flow-revisar', '    const g = 1\n'), 'flow-archivar', '    const a = 2\n')

    expect(accepts(candidate)).toMatch(/fuera del hueco/i)
  })

  it('rechaza que desaparezcan los marcadores del hueco', () => {
    const candidate = FILE.replace('    // @ai:begin flow-revisar — Se revisa y registra\n    // @ai:end\n', '    const g = 1\n')

    expect(accepts(candidate)).toMatch(/marcador/i)
  })

  it('rechaza una propuesta que deja el hueco vacío (no hay nada que aceptar)', () => {
    expect(accepts(FILE)).toMatch(/vacío/i)
  })

  it('reescribir el texto del marcador cuenta como editar fuera del hueco', () => {
    // el marcador lo escribe la plantilla, no quien rellena: retocarlo es salirse
    const candidate = replaceSlotBody(FILE, 'flow-revisar', '    const g = 1\n').replace(
      '// @ai:begin flow-revisar — Se revisa y registra',
      '// @ai:begin flow-revisar — otro texto'
    )

    expect(accepts(candidate)).toMatch(/fuera del hueco/i)
  })

  it('cambiar el id del hueco se reporta como marcadores perdidos', () => {
    const candidate = replaceSlotBody(FILE, 'flow-revisar', '    const g = 1\n').replace('flow-revisar', 'flow-otro')

    expect(accepts(candidate)).toMatch(/marcador/i)
  })
})
