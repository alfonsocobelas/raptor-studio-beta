import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  assertSlug,
  deleteDesign,
  listDesigns,
  readDesign,
  writeDesign
} from '@app/backend/contexts/studio/designs/design-files'

/**
 * Spec 21, TASK-01: la capa de ficheros de los diseños. El slug es la ÚNICA
 * puerta a una ruta; la escritura es atómica; un JSON corrupto da error limpio
 * y NUNCA se borra (es el trabajo del usuario, aunque esté roto).
 */
describe('design-files — persistencia en .studio/designs', () => {
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'designs-'))
  })
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  const design = (appName: string) => ({ appName, resources: [], pages: [] })

  describe('assertSlug — el saneado del borde', () => {
    it.each(['vetcare', 'mi-tienda-2'])('acepta «%s»', slug => {
      expect(() => assertSlug(slug)).not.toThrow()
    })

    it.each(['../fuga', 'a/b', 'Mayusculas', '', '-empieza-mal', 'con espacio'])('rechaza «%s»', slug => {
      expect(() => assertSlug(slug)).toThrow()
    })
  })

  it('escribe y lee un diseño; el directorio se crea al primer uso', () => {
    writeDesign(root, 'vetcare', design('vetcare'))

    expect(readDesign(root, 'vetcare')).toEqual(design('vetcare'))
    expect(fs.existsSync(path.join(root, '.studio', 'designs', 'vetcare.json'))).toBe(true)
  })

  it('la escritura no deja ficheros temporales atrás', () => {
    writeDesign(root, 'vetcare', design('vetcare'))

    const files = fs.readdirSync(path.join(root, '.studio', 'designs'))
    expect(files).toEqual(['vetcare.json'])
  })

  it('lista slug, appName y updatedAt sin exigir cargar los cuerpos', () => {
    writeDesign(root, 'vetcare', design('vetcare'))
    writeDesign(root, 'boutique', design('La Boutique'))

    const list = listDesigns(root)

    expect(list.map(d => d.slug).sort()).toEqual(['boutique', 'vetcare'])
    expect(list.find(d => d.slug === 'boutique')?.appName).toBe('La Boutique')
    expect(list.every(d => typeof d.updatedAt === 'string' && d.updatedAt.length > 0)).toBe(true)
  })

  it('leer un diseño inexistente da error limpio', () => {
    expect(() => readDesign(root, 'fantasma')).toThrow(/fantasma/)
  })

  it('un JSON corrupto da error limpio y el fichero NO se borra', () => {
    const dir = path.join(root, '.studio', 'designs')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'roto.json'), '{truncado')

    expect(() => readDesign(root, 'roto')).toThrow(/roto/)
    expect(fs.existsSync(path.join(dir, 'roto.json'))).toBe(true)
  })

  it('un corrupto tampoco tumba la lista: aparece sin appName legible', () => {
    writeDesign(root, 'sano', design('sano'))
    fs.writeFileSync(path.join(root, '.studio', 'designs', 'roto.json'), '{truncado')

    const list = listDesigns(root)

    expect(list.map(d => d.slug).sort()).toEqual(['roto', 'sano'])
  })

  it('borra un diseño', () => {
    writeDesign(root, 'vetcare', design('vetcare'))

    deleteDesign(root, 'vetcare')

    expect(listDesigns(root)).toEqual([])
  })

  it('ninguna operación acepta un slug que escape del directorio', () => {
    expect(() => writeDesign(root, '../fuga', design('x'))).toThrow()
    expect(() => readDesign(root, '../fuga')).toThrow()
    expect(() => deleteDesign(root, '../fuga')).toThrow()
  })
})
