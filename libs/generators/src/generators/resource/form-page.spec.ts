import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 48: la página-formulario es el MISMO formulario del diálogo emitido como
 * página con ruta propia — alta que crea y navega al listado. Convive con el
 * diálogo: el listado no cambia.
 */
describe('resource generator — página-formulario (spec 48)', () => {
  const withForm = (extra: Partial<ResourceDefinition> = {}): ResourceDefinition =>
    ({ ...MODELS['supplier'], name: 'invoice', plural: 'invoices', form: {}, ...extra }) as ResourceDefinition

  const generate = async (model: ResourceDefinition): Promise<Tree> => {
    registerModels([model])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }

  it('no emite la página si el modelo no declara form', async () => {
    const tree = await generate({ ...withForm(), form: undefined })

    expect(tree.exists('out/frontend/invoice-form-page.component.ts')).toBe(false)
  })

  it('con form declarado emite la página junto al diálogo intacto', async () => {
    const tree = await generate(withForm())

    expect(tree.exists('out/frontend/invoice-form-page.component.ts')).toBe(true)
    expect(tree.exists('out/frontend/invoice-dialog.component.ts')).toBe(true)
  })

  it('la página crea con el service y navega al listado con toast', async () => {
    const tree = await generate(withForm())
    const page = tree.read('out/frontend/invoice-form-page.component.ts', 'utf-8') ?? ''

    expect(page).toContain('class InvoiceFormPageComponent')
    expect(page).toContain('this._service.create({ id: generateId(), ...value })')
    expect(page).toContain('this._notify.success(')
    expect(page).toContain('this._router.navigate')
  })

  it('el formulario de la página es el del diálogo: mismos controles y validaciones', async () => {
    const tree = await generate(withForm())
    const page = tree.read('out/frontend/invoice-form-page.component.ts', 'utf-8') ?? ''
    const dialog = tree.read('out/frontend/invoice-dialog.component.ts', 'utf-8') ?? ''

    // el grupo reactivo sale de las MISMAS sustituciones: si diverge, divergieron las plantillas
    const groupOf = (source: string): string => source.split('this._fb.nonNullable.group')[1]?.split(')')[0] ?? ''
    expect(groupOf(page)).toBe(groupOf(dialog))
  })

  it('con :id carga el registro, precarga el form y guarda con update', async () => {
    const tree = await generate(withForm())
    const page = tree.read('out/frontend/invoice-form-page.component.ts', 'utf-8') ?? ''

    expect(page).toContain("this._route.snapshot.paramMap.get('id')")
    expect(page).toContain('await this._service.findOne(id)')
    expect(page).toContain('this.form.patchValue')
    expect(page).toContain('await this._service.update(id, { ...value, version: this.editingVersion() })')
  })

  it('la cabecera y el botón cambian con el modo, con los textos del diálogo', async () => {
    const tree = await generate(withForm())
    const page = tree.read('out/frontend/invoice-form-page.component.ts', 'utf-8') ?? ''
    const dialog = tree.read('out/frontend/invoice-dialog.component.ts', 'utf-8') ?? ''

    const editTitle = dialog.match(/\? '([^']+)' : '/)?.[1] ?? '__no-title__'
    expect(page).toContain(editTitle)
    expect(page).toContain("? 'Guardar' : 'Crear'")
  })

  it('mientras carga el registro no se pinta el formulario, y el 404 tiene aviso', async () => {
    const tree = await generate(withForm())
    const page = tree.read('out/frontend/invoice-form-page.component.ts', 'utf-8') ?? ''

    expect(page).toContain('loading')
    expect(page).toContain('notFound')
  })

  it('importa los enums que el grupo del form referencia (sin arrastrar el DTO)', async () => {
    registerModels([{ ...MODELS['project'], form: {} } as ResourceDefinition, MODELS['customer']])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'project', directory: 'out' })
    const page = tree.read('out/frontend/project-form-page.component.ts', 'utf-8') ?? ''

    expect(page).toContain("import { ProjectImplementerEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'")
    expect(page).not.toContain('ProjectDto')
  })

  it('emite el spec de la página con los servicios de lookup mockeados', async () => {
    registerModels([{ ...MODELS['project'], form: {} } as ResourceDefinition, MODELS['customer']])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'project', directory: 'out' })
    const spec = tree.read('out/frontend/project-form-page.component.spec.ts', 'utf-8') ?? ''

    expect(spec).toContain('ProjectFormPageComponent')
    expect(spec).toContain(
      '{ provide: CustomerService, useValue: { lookup: () => Promise.resolve({ items: [], hasMore: false }), findOne: () => new Promise(() => undefined) } }'
    )
  })

  it('sin form no cambia nada de lo demás emitido', async () => {
    const con = await generate(withForm())
    const sin = await generate({ ...withForm(), form: undefined })

    const list = 'out/frontend/invoices-list.component.ts'
    expect(con.read(list, 'utf-8')).toBe(sin.read(list, 'utf-8'))
  })
})
