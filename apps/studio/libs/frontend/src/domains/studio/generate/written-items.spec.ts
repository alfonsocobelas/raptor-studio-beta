import { describe, expect, it } from 'vitest'
import type { DesignPage, DraftResource } from '@app/shared/domain'
import { markWritten, plannedItems, type WrittenItem } from './written-items'

const resource = (name: string, labelPlural: string): DraftResource =>
  ({ name, plural: `${name}s`, labelSingular: labelPlural, labelPlural, gender: 'f', fields: [] }) as DraftResource

const design = {
  resources: [resource('prenda', 'Prendas'), resource('proveedor', 'Proveedores')],
  pages: [
    { title: 'Catálogo', blocks: [{ kind: 'table' as const, resource: 'prenda' }] },
    { title: 'Panel', blocks: [{ kind: 'kpi' as const, resources: ['prenda', 'proveedor'] }] }
  ] as DesignPage[],
  slots: { auth: 'single-tenant', infra: 'azure', database: 'postgres' },
  plugins: ['email']
}

const labels = (items: WrittenItem[]): string[] => items.map(i => i.label)
const item = (items: WrittenItem[], label: string): WrittenItem => {
  const found = items.find(i => i.label === label)
  if (!found) throw new Error(`no está «${label}»: ${labels(items).join(', ')}`)
  return found
}

/**
 * El raíl «Mientras tanto» de la maqueta 7C enseña «3 de 4 vistas» con sus chips. Aquí eso no
 * se inventa: la lista se declara ANTES de empezar, con lo que el diseño y las ranuras ya
 * dicen, y cada línea se marca cuando aparece un fichero cuya ruta la nombra.
 */
describe('plannedItems', () => {
  it('lista las entidades del diseño, con el nombre que el usuario les puso', () => {
    const items = plannedItems(design).filter(i => i.kind === 'entity')

    expect(labels(items)).toEqual(['Prendas', 'Proveedores'])
  })

  it('lista las vistas del diseño por su título', () => {
    const items = plannedItems(design).filter(i => i.kind === 'view')

    expect(labels(items)).toEqual(['Catálogo', 'Panel'])
  })

  it('lista los módulos que las ranuras implican, y solo ésos', () => {
    const items = plannedItems(design).filter(i => i.kind === 'module')

    expect(labels(items)).toEqual(['Autenticación', 'Infraestructura Azure', 'Correo saliente'])
  })

  it('sin autenticación, sin nube y sin correo no hay módulos que anunciar', () => {
    const bare = { ...design, slots: { auth: 'none', infra: 'none', database: 'postgres' }, plugins: [] }

    expect(plannedItems(bare).some(i => i.kind === 'module')).toBe(false)
  })

  it('todo arranca sin marcar: nada se da por escrito antes de verlo', () => {
    expect(plannedItems(design).every(i => !i.done)).toBe(true)
  })

  it('el orden es el del diseño: primero las entidades, luego las vistas y al final los módulos', () => {
    expect(plannedItems(design).map(i => i.kind)).toEqual([
      'entity',
      'entity',
      'view',
      'view',
      'module',
      'module',
      'module'
    ])
  })
})

describe('markWritten', () => {
  const planned = plannedItems(design)

  it('una ruta que nombra la entidad la marca', () => {
    const items = markWritten(planned, 'libs/backend/src/contexts/warehouse/modules/prendas/domain/prenda.ts')

    expect(item(items, 'Prendas').done).toBe(true)
    expect(item(items, 'Proveedores').done).toBe(false)
  })

  /** La vista se reconoce por la entidad que la alimenta: el generador emite por recurso. */
  it('la vista se marca cuando aparece el código de la entidad de sus bloques', () => {
    const items = markWritten(planned, 'libs/frontend/src/core/services/prenda.service.ts')

    expect(item(items, 'Catálogo').done).toBe(true)
    expect(item(items, 'Panel').done).toBe(false)
  })

  /** Lo que enseñó el primer rojo: el panel se alimenta de DOS entidades. */
  it('una vista de varias entidades no está escrita hasta que salen todas', () => {
    const conUna = markWritten(planned, 'libs/frontend/src/core/services/prenda.service.ts')
    expect(item(conUna, 'Panel').done).toBe(false)

    const conLasDos = markWritten(conUna, 'libs/frontend/src/core/services/proveedor.service.ts')
    expect(item(conLasDos, 'Panel').done).toBe(true)
  })

  it('una vista sin bloques no se marca nunca: no hay código que la delate', () => {
    const vacia = plannedItems({ ...design, pages: [{ title: 'En blanco', blocks: [] }] as DesignPage[] })

    expect(item(markWritten(vacia, 'libs/x/prenda.ts'), 'En blanco').done).toBe(false)
  })

  it('el módulo de autenticación se marca con el contexto que lo delata', () => {
    const items = markWritten(planned, 'libs/backend/src/contexts/iam/modules/auth/domain/user.ts')

    expect(item(items, 'Autenticación').done).toBe(true)
  })

  /** La regla dura: quedarse corto es aceptable; marcar de más es mentir. */
  it('una ruta que no casa con nada no marca nada', () => {
    const items = markWritten(planned, 'libs/shared/domain/src/index.ts')

    expect(items.every(i => !i.done)).toBe(true)
  })

  it('no confunde una entidad con otra que la contenga', () => {
    const withPrefix = { ...design, resources: [resource('orden', 'Órdenes'), resource('ordenante', 'Ordenantes')] }
    const items = markWritten(plannedItems(withPrefix), 'libs/backend/src/contexts/x/modules/ordenantes/ordenante.ts')

    expect(item(items, 'Ordenantes').done).toBe(true)
    expect(item(items, 'Órdenes').done).toBe(false)
  })

  it('lo ya marcado no se desmarca con la siguiente ruta', () => {
    const first = markWritten(planned, 'libs/backend/x/prenda.entity.ts')
    const second = markWritten(first, 'libs/backend/x/proveedor.entity.ts')

    expect(item(second, 'Prendas').done).toBe(true)
    expect(item(second, 'Proveedores').done).toBe(true)
  })

  it('una ruta vacía no toca nada', () => {
    expect(markWritten(planned, '')).toEqual(planned)
  })
})
