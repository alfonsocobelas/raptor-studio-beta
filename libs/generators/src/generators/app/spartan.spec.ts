import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import * as fs from 'fs'
import * as path from 'path'
import { SPARTAN_COMPONENTS } from './spartan-components'

/**
 * Defecto 13: pedir los componentes uno a uno al CLI de Spartan costaba 16
 * arranques de Nx (20 min) y reventaba el tope del backend, dejando la app a
 * medias. Los helm son CÓDIGO MATERIALIZADO, así que viajan vendorizados con el
 * generador y se copian, que es lo mismo que hacía el CLI pero sin red ni Nx.
 */
describe('componentes Spartan vendorizados', () => {
  const vendor = path.join(__dirname, 'files-skeleton-ui', 'spartan', 'libs', 'ui')

  it('el generador trae todos los componentes que el esqueleto importa', () => {
    for (const component of SPARTAN_COMPONENTS) {
      expect(fs.existsSync(path.join(vendor, component))).toBe(true)
    }
  })

  it('cada componente trae su punto de entrada', () => {
    for (const component of SPARTAN_COMPONENTS) {
      expect(fs.existsSync(path.join(vendor, component, 'src', 'index.ts.template'))).toBe(true)
    }
  })

  it('el tsconfig emitido mapea cada componente a su fuente vendorizada', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'files-skeleton', 'tsconfig.base.json.template'), 'utf-8')
    ) as { compilerOptions: { paths: Record<string, string[]> } }

    for (const component of SPARTAN_COMPONENTS) {
      expect(tsconfig.compilerOptions.paths[`@spartan-ng/helm/${component}`]).toEqual([
        `libs/ui/${component}/src/index.ts`
      ])
    }
  })
})

/** El árbol vacío solo se usa para fijar la firma del generador en el futuro. */
describe('createTreeWithEmptyWorkspace', () => {
  it('está disponible', () => expect(createTreeWithEmptyWorkspace()).toBeDefined())
})
