import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { readSlotBody, replaceSlotBody } from '../resource/ai-slots'
import {
  fillFlowSlotsGenerator,
  fillPendingFlowSlots,
  flowFillReport,
  pendingFlowSlots,
  type SlotExecutor,
  type SlotGate
} from './fill-flow-slots'

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
      filled: [],
      rejected: []
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

  /**
   * Spec 39, TASK-12 (segunda mitad): un hueco entra en el árbol solo si su relleno
   * se queda dentro del hueco Y el gate lo acepta. Si algo falla, el hueco vuelve a
   * quedar vacío y se reporta el motivo: nunca queda código rojo en la app.
   */
  describe('relleno bajo gate por hueco', () => {
    const BODY = '    const garment = await this.garmentRepository.get(id)\n'

    /** Ejecutor de mentira: propone lo que se le diga y anota los prompts que recibió */
    const executorThat = (propose: (current: string, id: string) => string | undefined): SlotExecutor & { prompts: string[] } => ({
      name: 'fake',
      prompts: [],
      async propose(prompt, slot, current) {
        this.prompts.push(prompt)
        return propose(current, slot.id)
      }
    })

    /**
     * La PRIMERA llamada de un gate es siempre la línea base (la app sin tocar), y en
     * estos tests está verde: lo que se modela es una app sana que un relleno rompe.
     */
    const gateThat = (reason?: string): SlotGate & { calls: number } => ({
      calls: 0,
      async run(_slot, _content) {
        this.calls++
        return this.calls === 1 ? undefined : reason
      }
    })

    /** Una app que ya venía en rojo: el gate falla desde la línea base. */
    const gateRedFromTheStart = (reason: string): SlotGate & { calls: number } => ({
      calls: 0,
      async run(_slot, _content) {
        this.calls++
        return reason
      }
    })

    it('acepta un relleno válido: queda en el árbol y sale del informe de pendientes', async () => {
      const tree = emittedApp()
      const executor = executorThat(current => replaceSlotBody(current, 'flow-revisar', BODY))
      const gate = gateThat()

      const report = await fillPendingFlowSlots(tree, { directory: 'apps/demo', executor, gate })

      expect(report.filled).toEqual([{ file: PROCESS, id: 'flow-revisar' }])
      expect(report.rejected).toEqual([])
      expect(report.pending).toEqual([])
      expect(readSlotBody(tree.read(PROCESS, 'utf-8') ?? '', 'flow-revisar')).toBe(BODY)
      // el prompt del hueco llegó al ejecutor
      expect(executor.prompts[0]).toContain('Rellena el cuerpo del paso «flow-revisar»')
      // línea base + el hueco
      expect(gate.calls).toBe(2)
    })

    it('rechaza un relleno que se sale del hueco, sin tocar el árbol ni gastar el gate', async () => {
      const tree = emittedApp()
      const before = tree.read(PROCESS, 'utf-8')
      const executor = executorThat(current =>
        replaceSlotBody(current, 'flow-revisar', BODY).replace('export class CicloProcess {', "import { x } from 'fs'\nexport class CicloProcess {")
      )
      const gate = gateThat()

      const report = await fillPendingFlowSlots(tree, { directory: 'apps/demo', executor, gate })

      expect(report.filled).toEqual([])
      expect(report.rejected[0].reason).toMatch(/fuera del hueco/i)
      expect(tree.read(PROCESS, 'utf-8')).toBe(before)
      // solo la línea base: no se corre un gate de minutos sobre algo ya invalidado
      expect(gate.calls).toBe(1)
    })

    it('si el gate se pone rojo, el hueco vuelve a quedar vacío y se reporta el motivo', async () => {
      const tree = emittedApp()
      const before = tree.read(PROCESS, 'utf-8')
      const executor = executorThat(current => replaceSlotBody(current, 'flow-revisar', BODY))

      const report = await fillPendingFlowSlots(tree, {
        directory: 'apps/demo',
        executor,
        gate: gateThat("typecheck: error TS2304: Cannot find name 'garment'")
      })

      expect(report.filled).toEqual([])
      expect(report.rejected[0]).toEqual({
        slot: { file: PROCESS, id: 'flow-revisar' },
        reason: "typecheck: error TS2304: Cannot find name 'garment'"
      })
      // nunca queda código rojo: el fichero vuelve exactamente a como estaba
      expect(tree.read(PROCESS, 'utf-8')).toBe(before)
      expect(report.pending).toEqual([{ file: PROCESS, id: 'flow-revisar' }])
    })

    it('si el ejecutor no propone nada, se reporta y no se escribe', async () => {
      const tree = emittedApp()
      const before = tree.read(PROCESS, 'utf-8')

      const report = await fillPendingFlowSlots(tree, {
        directory: 'apps/demo',
        executor: executorThat(() => undefined),
        gate: gateThat()
      })

      expect(report.rejected[0].reason).toMatch(/no propuso/i)
      expect(tree.read(PROCESS, 'utf-8')).toBe(before)
    })

    it('un hueco rechazado no arrastra a los demás', async () => {
      const tree = emittedApp()
      // dos huecos vacíos en el mismo fichero
      tree.write(PROCESS, replaceSlotBody(tree.read(PROCESS, 'utf-8') ?? '', 'flow-subsanar', ''))
      const executor = executorThat((current, id) =>
        id === 'flow-revisar' ? current : replaceSlotBody(current, id, '    await this.garmentRepository.save(x)\n')
      )

      const report = await fillPendingFlowSlots(tree, { directory: 'apps/demo', executor, gate: gateThat() })

      expect(report.rejected.map(r => r.slot.id)).toEqual(['flow-revisar'])
      expect(report.filled.map(s => s.id)).toEqual(['flow-subsanar'])
      expect(readSlotBody(tree.read(PROCESS, 'utf-8') ?? '', 'flow-subsanar')).toContain('save(x)')
    })

    it('un ejecutor sin gate no se acepta: la IA no entra sin frontera', async () => {
      const tree = emittedApp()

      await expect(
        fillPendingFlowSlots(tree, { directory: 'apps/demo', executor: executorThat(current => current) })
      ).rejects.toThrow(/gate/i)
    })

    it('con --slot solo se toca ese hueco (una prueba real no cuesta cinco gates)', async () => {
      const tree = emittedApp()
      tree.write(PROCESS, replaceSlotBody(tree.read(PROCESS, 'utf-8') ?? '', 'flow-subsanar', ''))
      const executor = executorThat((current, id) => replaceSlotBody(current, id, BODY))

      const report = await fillPendingFlowSlots(tree, {
        directory: 'apps/demo',
        slot: 'flow-subsanar',
        executor,
        gate: gateThat()
      })

      expect(report.filled.map(s => s.id)).toEqual(['flow-subsanar'])
      expect(executor.prompts).toHaveLength(1)
      // el otro sigue pendiente, intacto
      expect(report.pending.map(s => s.id)).toEqual(['flow-revisar'])
    })

    it('el gate recibe el contenido ya relleno (compilar es cosa del disco, no del árbol)', async () => {
      const tree = emittedApp()
      const seen: string[] = []

      await fillPendingFlowSlots(tree, {
        directory: 'apps/demo',
        executor: executorThat(current => replaceSlotBody(current, 'flow-revisar', BODY)),
        gate: {
          async run(_slot, content) {
            seen.push(content)
            return undefined
          }
        }
      })

      // la primera llamada es la línea base (sin tocar); la segunda ya lleva el relleno
      expect(readSlotBody(seen[0], 'flow-revisar')).toBe('')
      expect(readSlotBody(seen[1], 'flow-revisar')).toBe(BODY)
    })

    /**
     * Encontrado en la corrida real de TASK-13: la app solaris no compilaba ANTES de
     * rellenar (un VO compartido colgando, defecto ajeno a esta spec) y cada hueco se
     * rechazaba con el error de un fichero que nadie había tocado. Si la línea base ya
     * está roja hay que decirlo una vez y no culpar a los rellenos.
     */
    it('si la app ya estaba en rojo antes de rellenar, se dice y no se intenta nada', async () => {
      const tree = emittedApp()
      const executor = executorThat(current => replaceSlotBody(current, 'flow-revisar', BODY))
      const gate = gateRedFromTheStart('`npm run typecheck` en rojo:\ninstallation.ts(106,27): error TS2304')

      const report = await fillPendingFlowSlots(tree, { directory: 'apps/demo', executor, gate })

      expect(report.baseline).toMatch(/en rojo/)
      expect(report.filled).toEqual([])
      expect(report.rejected).toEqual([])
      // no se le pide nada al ejecutor: no hay contra qué medir un relleno
      expect(executor.prompts).toEqual([])
      expect(gate.calls).toBe(1)
    })

    it('con la línea base en verde el informe no reporta baseline', async () => {
      const tree = emittedApp()

      const report = await fillPendingFlowSlots(tree, {
        directory: 'apps/demo',
        executor: executorThat(current => replaceSlotBody(current, 'flow-revisar', BODY)),
        gate: gateThat()
      })

      expect(report.baseline).toBeUndefined()
      expect(report.filled).toHaveLength(1)
    })

    it('el informe nombra al ejecutor que se usó', async () => {
      const tree = emittedApp()

      const report = await fillPendingFlowSlots(tree, {
        directory: 'apps/demo',
        executor: executorThat(current => replaceSlotBody(current, 'flow-revisar', BODY)),
        gate: gateThat()
      })

      expect(report.executor).toBe('fake')
    })
  })
})
