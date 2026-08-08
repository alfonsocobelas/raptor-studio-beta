import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { StudioDesignsController } from '@app/backend/contexts/studio/designs/studio-designs.controller'

/**
 * Spec 21, TASK-02: REST de diseños. El PUT pasa por el MISMO gate que el chat
 * (validateDesign); un slug inválido o un diseño que no pasa → 400 sin tocar
 * disco; un diseño inexistente → 404.
 */
describe('StudioDesignsController', () => {
  let root: string
  let controller: StudioDesignsController

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'designs-api-'))
    process.env['ACELERADOR_ROOT'] = root
    controller = new StudioDesignsController()
  })
  afterEach(() => {
    delete process.env['ACELERADOR_ROOT']
    fs.rmSync(root, { recursive: true, force: true })
  })

  const valid = () => ({
    appName: 'vetcare',
    resources: [
      {
        name: 'paciente',
        plural: 'pacientes',
        labelSingular: 'Paciente',
        labelPlural: 'Pacientes',
        gender: 'm' as const,
        fields: [{ name: 'nombre', label: 'Nombre', type: 'string' as const }]
      }
    ],
    pages: []
  })

  it('guarda un diseño válido y lo devuelve', () => {
    controller.save('vetcare', valid())

    expect(controller.get('vetcare')).toEqual(valid())
    expect(controller.list().map(d => d.slug)).toEqual(['vetcare'])
  })

  it('un PUT que no pasa el gate es 400 y el fichero previo queda intacto', () => {
    controller.save('vetcare', valid())
    const broken = {
      ...valid(),
      resources: [
        {
          ...valid().resources[0],
          fields: [{ name: 'x', label: 'X', type: 'ref' as const }] // ref sin destino: el gate lo rechaza
        }
      ]
    }

    expect(() => controller.save('vetcare', broken)).toThrow(BadRequestException)
    expect(controller.get('vetcare')).toEqual(valid())
  })

  it('un slug inválido es 400 en todas las rutas', () => {
    expect(() => controller.get('../fuga')).toThrow(BadRequestException)
    expect(() => controller.save('../fuga', valid())).toThrow(BadRequestException)
    expect(() => controller.remove('../fuga')).toThrow(BadRequestException)
  })

  it('pedir un diseño inexistente es 404', () => {
    expect(() => controller.get('fantasma')).toThrow(NotFoundException)
  })

  it('un fichero corrupto es error limpio, no un 500 mudo, y no se borra', () => {
    const dir = path.join(root, '.studio', 'designs')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'roto.json'), '{truncado')

    expect(() => controller.get('roto')).toThrow(/roto/)
    expect(fs.existsSync(path.join(dir, 'roto.json'))).toBe(true)
  })

  it('borra un diseño', () => {
    controller.save('vetcare', valid())

    controller.remove('vetcare')

    expect(controller.list()).toEqual([])
  })
})
