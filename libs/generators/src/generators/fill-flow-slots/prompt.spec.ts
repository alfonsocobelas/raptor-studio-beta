import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app/app'
import { buildFlowSlotPrompt } from './prompt'
import { pendingFlowSlots } from './fill-flow-slots'

/**
 * Spec 39, TASK-11: el prompt de un hueco. Contexto ACOTADO — negocio, mapa del flujo,
 * JSDoc del paso y firmas de los repos inyectados — más el contrato coreográfico. Nada
 * más entra: lo que no está en el prompt no puede inventarse dentro del hueco.
 */
describe('fill-flow-slots — prompt por hueco (spec 39)', () => {
  const APP = 'apps/demo'
  const PROCESS = `${APP}/libs/backend/src/contexts/warehouse/processes/ciclo/ciclo.process.ts`
  const OTHER_PROCESS = `${APP}/libs/backend/src/contexts/warehouse/processes/otro/otro.process.ts`

  const emittedApp = (): Tree => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write(
      `${APP}/CLAUDE.md`,
      [
        '# demo — contexto del negocio',
        '',
        '## Negocio',
        '',
        'Un almacén textil que mueve prendas entre tiendas.',
        '',
        '## Reglas',
        '',
        '- Una prenda sin código no entra en el almacén',
        '',
        '## Procesos de negocio',
        '',
        '### Ciclo de pedido',
        '',
        '1. (inicio) Llega un pedido',
        '2. Se revisa y registra · entidad: garment',
        ''
      ].join('\n')
    )
    tree.write(
      PROCESS,
      [
        "import { GarmentId } from '../../../shared/domain/value-objects/garments/garment-id.vo'",
        "import { GarmentRepository } from '../../modules/garments/domain/garment-repository'",
        '',
        '/**',
        ' * Ciclo de pedido',
        ' *',
        ' * 1. (inicio) Llega un pedido',
        ' * 2. Se revisa y registra · entidad: garment',
        ' * 3. (fin) Pedido en curso',
        ' */',
        '@Injectable()',
        'export class CicloProcess {',
        '  constructor(private readonly garmentRepository: GarmentRepository) {}',
        '',
        '  /**',
        '   * Paso 2 — Se revisa y registra',
        '   * Viene de: 1. Llega un pedido',
        '   * Va a: 3. Pedido en curso',
        '   */',
        '  async revisar(id: GarmentId): Promise<void> {',
        '    // @ai:begin flow-revisar — Se revisa y registra',
        '    // @ai:end',
        '  }',
        '',
        '  /**',
        '   * Paso 3 — Se archiva',
        '   */',
        '  async archivar(): Promise<void> {',
        '    // @ai:begin flow-archivar — Se archiva',
        '    // @ai:end',
        '  }',
        '}',
        ''
      ].join('\n')
    )
    // otro flujo del mismo contexto: su mapa NO es contexto de este hueco
    tree.write(
      OTHER_PROCESS,
      ['/**', ' * Devolución de material', ' * 1. (inicio) Llega una devolución', ' */', 'export class OtroProcess {}', ''].join(
        '\n'
      )
    )
    tree.write(
      `${APP}/libs/backend/src/contexts/warehouse/modules/garments/domain/garment-repository.ts`,
      [
        "import { Garment } from './garment'",
        '',
        'export abstract class GarmentRepository {',
        '  abstract register(garment: Garment): Promise<void>',
        '  abstract get(garmentId: GarmentId): Promise<Nullable<Garment>>',
        '  // @ai:begin port-extra — finders no derivables',
        '  // @ai:end',
        '}',
        ''
      ].join('\n')
    )
    // el agregado NO entra en el prompt: el paso habla con el repositorio
    tree.write(
      `${APP}/libs/backend/src/contexts/warehouse/modules/garments/domain/garment.ts`,
      'export class Garment {\n  private secretoDelAgregado = 1\n}\n'
    )
    return tree
  }

  const promptFor = (id: string): string => {
    const tree = emittedApp()
    return buildFlowSlotPrompt(tree, APP, { file: PROCESS, id })
  }

  it('lleva la memoria del negocio, sin repetir la sección de procesos', () => {
    const prompt = promptFor('flow-revisar')

    expect(prompt).toContain('Un almacén textil que mueve prendas entre tiendas.')
    expect(prompt).toContain('Una prenda sin código no entra en el almacén')
    // el mapa llega acotado por el JSDoc de la clase; repetirlo desde el CLAUDE.md sobra
    expect(prompt).not.toContain('## Procesos de negocio')
  })

  it('lleva el mapa del flujo del paso y el JSDoc del paso, con su firma', () => {
    const prompt = promptFor('flow-revisar')

    expect(prompt).toContain('1. (inicio) Llega un pedido')
    expect(prompt).toContain('Paso 2 — Se revisa y registra')
    expect(prompt).toContain('Viene de: 1. Llega un pedido')
    // la firma es SOLO la del método del hueco: se ancla la línea entera porque un
    // `toContain` de la firma pasa igual si arrastra medio fichero por delante
    expect(prompt).toContain('Firma: async revisar(id: GarmentId): Promise<void>\nHueco:')
  })

  it('lleva las firmas de los repositorios inyectados, sin las líneas de marcador', () => {
    const prompt = promptFor('flow-revisar')

    expect(prompt).toContain('GarmentRepository')
    expect(prompt).toContain('abstract register(garment: Garment): Promise<void>')
    expect(prompt).toContain('abstract get(garmentId: GarmentId): Promise<Nullable<Garment>>')
    expect(prompt).toContain('this.garmentRepository')
    expect(prompt).not.toContain('@ai:begin port-extra')
  })

  it('lleva el contrato coreográfico completo', () => {
    const prompt = promptFor('flow-revisar')

    expect(prompt).toMatch(/autosuficiente/i)
    expect(prompt).toMatch(/guarda de estado/i)
    expect(prompt).toMatch(/no invoques.*otros? (métodos de )?paso/i)
    expect(prompt).toMatch(/fuera del hueco/i)
  })

  it('no entra nada más: ni el agregado, ni otro flujo, ni el JSDoc de otro paso', () => {
    const prompt = promptFor('flow-revisar')

    expect(prompt).not.toContain('secretoDelAgregado')
    expect(prompt).not.toContain('Devolución de material')
    expect(prompt).not.toContain('Paso 3 — Se archiva')
  })

  it('cada hueco recibe el JSDoc y la firma de SU paso, sin arrastrar el paso anterior', () => {
    const prompt = promptFor('flow-archivar')

    expect(prompt).toContain('Paso 3 — Se archiva')
    expect(prompt).toContain('Firma: async archivar(): Promise<void>\nHueco:')
    expect(prompt).not.toContain('Paso 2 — Se revisa y registra')
    // el hueco del paso anterior no se cuela por ninguna vía
    expect(prompt).not.toContain('flow-revisar')
  })

  it('falla fuerte si el hueco no está en el fichero', () => {
    const tree = emittedApp()

    expect(() => buildFlowSlotPrompt(tree, APP, { file: PROCESS, id: 'flow-fantasma' })).toThrow('flow-fantasma')
  })

  /**
   * El árbol de test no pasa por prettier y la app real sí (visto en TASK-09): el
   * parseo tiene que aguantar las dos formas, y esto lo prueba contra el emitido real.
   */
  it('funciona sobre una app emitida de verdad (constructor partido por prettier)', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'golden', app: 'golden', skipInstall: true })

    const slots = pendingFlowSlots(tree, 'apps/golden')
    const contrato = slots.find(slot => slot.id === 'flow-contrato')
    if (!contrato) throw new Error('la app de oro debería tener el hueco flow-contrato')

    const prompt = buildFlowSlotPrompt(tree, 'apps/golden', contrato)

    // negocio y mapa
    expect(prompt).toContain('Gestión de licencias SAP')
    expect(prompt).toContain('1. (inicio) El cliente pide una implantación')
    // el paso y su firma
    expect(prompt).toContain('Paso 2 — Se firma el contrato con su vigencia')
    expect(prompt).toContain('Firma: async contrato(id: ContractId): Promise<void>\nHueco:')
    // los DOS repos inyectados y sus firmas reales
    expect(prompt).toContain('abstract register(contract: Contract): Promise<void>')
    expect(prompt).toContain('abstract matching(criteria: Criteria): Promise<Project[]>')
  })

  it('en un paso intermedio de la app real la firma no arrastra los pasos anteriores', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'golden', app: 'golden', skipInstall: true })

    const ampliacion = pendingFlowSlots(tree, 'apps/golden').find(slot => slot.id === 'flow-ampliacion')
    if (!ampliacion) throw new Error('la app de oro debería tener el hueco flow-ampliacion')

    const prompt = buildFlowSlotPrompt(tree, 'apps/golden', ampliacion)

    expect(prompt).toContain('Firma: async ampliacion(): Promise<void>\nHueco:')
    expect(prompt).not.toContain('flow-contrato')
    expect(prompt).not.toContain('flow-proyecto')
  })
})
