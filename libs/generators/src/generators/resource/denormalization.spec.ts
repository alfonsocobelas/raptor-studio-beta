import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 60: el campo desnormalizado (form.lookup.denormalizes) se copia del canon en el
 * use case, nunca del DTO. El navegador deja de mandarlo; el backend hace el lookup por
 * el FK y falla con EntityNotFoundError si el origen no existe.
 *
 * Modelo de prueba: contract (customerId → lookup customer.name → customerName).
 */
describe('campos desnormalizados (spec 60)', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  const read = (tree: Tree, path: string) => tree.read(`out/${path}`, 'utf-8') ?? ''

  describe('register use case', () => {
    it('inyecta el repositorio del recurso origen', async () => {
      const source = read(await emit('contract'), 'backend/application/use-cases/register-contract-usecase.service.ts')

      expect(source).toContain('private readonly customerRepository: CustomerRepository')
      expect(source).toContain("import { CustomerRepository } from '../../../customers/domain/customer-repository'")
    })

    it('resuelve el origen por el FK y falla con EntityNotFoundError si no existe', async () => {
      const source = read(await emit('contract'), 'backend/application/use-cases/register-contract-usecase.service.ts')

      expect(source).toContain('await this.customerRepository.get(CustomerId.create(input.customerId))')
      expect(source).toContain("throw new EntityNotFoundError('Customer', input.customerId)")
    })

    it('copia el valor canónico al registrar, ignorando cualquier valor externo', async () => {
      const source = read(await emit('contract'), 'backend/application/use-cases/register-contract-usecase.service.ts')

      expect(source).toContain('customerName: customer.name.value')
    })
  })

  describe('update use case', () => {
    it('refresca la copia solo si el FK viene en updates', async () => {
      const source = read(await emit('contract'), 'backend/application/use-cases/update-contract-usecase.service.ts')

      expect(source).toContain('if (updates.customerId !== undefined)')
      expect(source).toContain('await this.customerRepository.get(CustomerId.create(updates.customerId))')
      expect(source).toContain('customerName: customer.name.value')
    })
  })

  describe('DTOs de escritura', () => {
    it('el DTO HTTP de alta no expone el campo desnormalizado', async () => {
      const source = read(await emit('contract'), 'backend/infrastructure/entrypoints/dtos/register-contract.dto.ts')

      expect(source).not.toContain('customerName')
      expect(source).toContain('customerId')
    })

    it('el DTO HTTP de edición tampoco', async () => {
      const source = read(await emit('contract'), 'backend/infrastructure/entrypoints/dtos/update-contract.dto.ts')

      expect(source).not.toContain('customerName')
    })

    it('el input de aplicación omite el campo: lo aporta el use case', async () => {
      const source = read(await emit('contract'), 'backend/application/dtos/register-contract-input.dto.ts')

      expect(source).toMatch(/Omit<RegisterContractProps, .*'customerName'/)
    })
  })

  describe('módulo NestJS', () => {
    it('importa el módulo del recurso origen para inyectar su repositorio', async () => {
      const source = read(await emit('contract'), 'backend/contracts.module.ts')

      expect(source).toContain("import { CustomersModule } from '../customers/customers.module'")
      expect(source).toMatch(/imports: \[.*CustomersModule/)
    })
  })

  describe('seed local', () => {
    it('las filas derivadas ya no traen el campo desnormalizado', async () => {
      const source = read(await emit('contract'), 'backend/infrastructure/seed/local-seed.fixtures.ts')

      expect(source).not.toContain('customerName')
    })
  })

  describe('import CSV (project tiene import + denormalización)', () => {
    it('resuelve los FKs una vez y valida las filas con el valor canónico', async () => {
      const source = read(await emit('project'), 'backend/application/use-cases/import-projects-usecase.service.ts')

      expect(source).toContain('customerRepository')
      expect(source).toContain('customerNameByCustomerId')
    })
  })

  describe('tests emitidos', () => {
    it('el test del register dobla el repositorio origen y verifica la copia del canon', async () => {
      const source = read(await emit('contract'), 'backend-tests-application/register-contract-usecase.test.ts')

      expect(source).toContain('CustomerRepository')
      expect(source).toContain('EntityNotFoundError')
    })
  })

  describe('frontend — el diálogo ya no resuelve la copia (TASK-03)', () => {
    it('el save no añade el campo desnormalizado al payload', async () => {
      const source = read(await emit('contract'), 'frontend/contract-dialog.component.ts')

      expect(source).not.toContain("customerName: this.customers().find(item => item.id === raw.customerId)")
    })

    it('el FormValue del diálogo no declara el campo', async () => {
      const source = read(await emit('contract'), 'frontend/contract-dialog.component.ts')

      expect(source).not.toMatch(/^\s*customerName: string$/m)
    })
  })

  describe('recurso sin lookup', () => {
    it('no cambia nada: el register de customer sigue con un solo repositorio', async () => {
      const source = read(await emit('customer'), 'backend/application/use-cases/register-customer-usecase.service.ts')

      expect(source).not.toContain('EntityNotFoundError')
      expect(source).toMatch(/constructor\(\s*private readonly customerRepository: CustomerRepository\s*\)/)
    })
  })
})
