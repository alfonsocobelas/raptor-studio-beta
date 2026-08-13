import { describe, expect, it } from 'vitest'
import type { DesignPage } from '@app/shared/domain'
import { detailPageIndex, detailResource } from './detail-page'

function page(title: string, resource: string, drillDown = false): DesignPage {
  return { title, blocks: [{ kind: 'table', resource }], ...(drillDown ? { drillDown: true } : {}) }
}

describe('detailResource', () => {
  it('es la entidad del primer bloque que habla de una', () => {
    expect(detailResource(page('Instalación', 'instalacion', true))).toBe('instalacion')
  })

  it('es indefinida cuando la vista no habla de ninguna entidad', () => {
    expect(detailResource({ title: 'En blanco', blocks: [] })).toBeUndefined()
  })
})

describe('detailPageIndex', () => {
  it('encuentra la ficha de la entidad y devuelve su posición en el diseño', () => {
    const pages = [page('Instalaciones', 'instalacion'), page('Productos', 'producto'), page('Ficha', 'producto', true)]

    expect(detailPageIndex(pages, 'producto')).toBe(2)
  })

  it('no confunde el listado con la ficha: sin ficha no hay a dónde ir', () => {
    const pages = [page('Productos', 'producto')]

    expect(detailPageIndex(pages, 'producto')).toBeNull()
  })

  it('la ficha de otra entidad no vale', () => {
    const pages = [page('Productos', 'producto'), page('Ficha', 'instalacion', true)]

    expect(detailPageIndex(pages, 'producto')).toBeNull()
  })
})
