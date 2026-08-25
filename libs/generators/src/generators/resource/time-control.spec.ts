import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 65: un campo de hora se edita con el input nativo type="time" y el DTO
 * valida HH:mm en el borde. El valor es siempre el string que emite el navegador.
 */
describe('resource generator — control time', () => {
  const withTime = (): ResourceDefinition => {
    const base = MODELS['supplier']
    return {
      ...base,
      name: 'shift',
      plural: 'shifts',
      form: {},
      fields: {
        ...base.fields,
        startTime: {
          type: 'string',
          required: true,
          vo: { name: 'ShiftStartTime', fieldName: 'Inicio' },
          table: { show: true, label: 'Inicio' },
          form: { control: 'time', label: 'Hora de inicio', section: 'general', order: 9 },
          column: { type: 'varchar', length: 5 }
        }
      }
    } as ResourceDefinition
  }

  const generate = async (): Promise<Tree> => {
    registerModels([withTime()])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'shift', directory: 'out' })
    return tree
  }

  it('el diálogo emite el input nativo de hora', async () => {
    const tree = await generate()
    const dialog = tree.read('out/frontend/shift-dialog.component.ts', 'utf-8') ?? ''

    expect(dialog).toContain('type="time"')
    expect(dialog).toContain('formControlName="startTime"')
  })

  it('la página-formulario emite el mismo control', async () => {
    const tree = await generate()
    const formPage = tree.read('out/frontend/shift-form-page.component.ts', 'utf-8') ?? ''

    expect(formPage).toContain('type="time"')
  })

  it('el test de VOs emitido importa también los VOs que solo se sanean', async () => {
    const tree = await generate()
    const voTest = tree.read('out/backend-tests/value-objects/shift-value-vos.vo.test.ts', 'utf-8') ?? ''

    expect(voTest).toContain('ShiftStartTime.create')
    expect(voTest).toMatch(/import \{ ShiftStartTime \}/)
  })

  it('el DTO valida HH:mm de 24 horas', async () => {
    const tree = await generate()
    const dto = tree.read('out/backend/infrastructure/entrypoints/dtos/register-shift.dto.ts', 'utf-8') ?? ''

    expect(dto).toContain('@Matches(/^([01]\\d|2[0-3]):[0-5]\\d$/)')
    expect(dto).toMatch(/import \{[^}]*Matches[^}]*\} from 'class-validator'/)
  })
})
