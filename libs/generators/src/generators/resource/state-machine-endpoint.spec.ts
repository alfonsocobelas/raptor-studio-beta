import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 43 TASK-09: la vertical de la transición — caso de uso de tres líneas (cargar →
 * transicionar → guardar), endpoint POST /:id/<verbo> → 204, guarda rechazada → 409 por
 * TIPO (el error de transición viaja con CONFLICT), id inexistente → 404 como el CRUD.
 */
describe('el caso de uso y el endpoint de una transición', () => {
  let tree: Tree
  const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
  })

  it('emite un caso de uso por transición: cargar, transicionar, guardar', () => {
    const useCase = read('backend/application/use-cases/terminate-contract-usecase.service.ts')

    expect(useCase).toContain('export class TerminateContractUseCase')
    expect(useCase).toContain('contractRepository.get(contractId)')
    expect(useCase).toContain("throw new EntityNotFoundError('Contract', input.id)")
    expect(useCase).toContain('contract.terminate()')
    expect(useCase).toContain('contractRepository.save(contract)')

    expect(read('backend/application/use-cases/expire-contract-usecase.service.ts')).toContain('contract.expire()')
  })

  it('emite el handler de delegación fina', () => {
    const handler = read('backend/application/handlers/terminate-contract.handler.ts')

    expect(handler).toContain('export class TerminateContractHandler')
    expect(handler).toContain('this.useCase.invoke(input)')
  })

  it('el controller cuelga POST /:id/<verbo> con 204', () => {
    const controller = read('backend/infrastructure/entrypoints/contracts.controller.ts')

    expect(controller).toContain("@Post(':id/terminate')")
    expect(controller).toContain("@Post(':id/expire')")
    expect(controller).toMatch(/@Post\(':id\/terminate'\)[\s\S]{0,200}@HttpCode\(HttpStatus\.NO_CONTENT\)/)
    expect(controller).toContain('this.terminateContractHandler.handle({ id })')
  })

  it('el módulo provee caso de uso y handler de cada transición', () => {
    const module = read('backend/contracts.module.ts')

    expect(module).toContain('TerminateContractHandler')
    expect(module).toContain('TerminateContractUseCase')
    expect(module).toContain('ExpireContractUseCase')
  })

  it('la guarda rechazada viaja como 409: el error de transición lleva CONFLICT', () => {
    const errors = read('backend/domain/contract-errors.ts')

    expect(errors).toMatch(/ContractInvalidTransitionError[\s\S]{0,200}CONFLICT/)
  })

  it('un recurso sin máquina no emite nada de esto', async () => {
    const clean = createTreeWithEmptyWorkspace()
    await resourceGenerator(clean, { name: 'customer', directory: 'out' })

    expect(clean.exists('out/backend/application/use-cases/terminate-customer-usecase.service.ts')).toBe(false)
    expect(clean.read('out/backend/infrastructure/entrypoints/customers.controller.ts', 'utf-8')).not.toContain(
      ':id/terminate'
    )
  })
})

/**
 * Bug cazado en la validación viva (spec 44): con un verbo multi-palabra («a-en-analisis»)
 * el módulo derivaba el fichero del PascalCase (aen-analisis-…) y no encontraba el handler
 * emitido (a-en-analisis-…). El import del módulo debe usar el MISMO slug que el fichero.
 */
describe('el cableado del módulo con verbos multi-palabra', () => {
  it('importa handler y use case con el slug exacto del fichero emitido', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderEntrypoints } = require('./build-entrypoints')
    const definition = {
      schemaVersion: 1,
      name: 'muestra',
      plural: 'muestras',
      context: 'aguas',
      schemaName: 'aguas',
      formSections: [{ id: 'general', title: 'Datos' }],
      state: {
        field: 'estado',
        initial: 'recibida',
        transitions: [{ name: 'a-en-analisis', label: 'A en análisis', from: ['recibida'], to: 'en_analisis' }]
      },
      fields: {
        id: { type: 'uuid', pk: true },
        estado: {
          type: 'string',
          vo: { name: 'MuestraEstado', fieldName: 'Estado', values: ['recibida', 'en_analisis'] }
        }
      }
    }

    const entry = renderEntrypoints(definition, true)

    expect(entry.moduleHandlerImports.join('\n')).toContain(
      "import { AEnAnalisisMuestraHandler } from './application/handlers/a-en-analisis-muestra.handler'"
    )
    expect(entry.moduleUseCaseImports.join('\n')).toContain(
      "from './application/use-cases/a-en-analisis-muestra-usecase.service'"
    )
  })
})
