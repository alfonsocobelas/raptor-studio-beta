import * as fs from 'fs'
import * as path from 'path'

/**
 * Spec 35: el arranque de los tests de frontend. Con el runner ya capaz de renderizar
 * componentes (TASK-00), lo siguiente que falla son los huecos de jsdom, que no implementa
 * `matchMedia` ni `scrollIntoView` — este último lo llama brn-select al abrirse, así que
 * cualquier test que despliegue un select emitido muere con un TypeError del CDK.
 */
describe('test-setup de la app emitida', () => {
  const setup = fs.readFileSync(
    path.join(__dirname, 'files-skeleton', 'libs', 'frontend', 'src', 'test-setup.ts.template'),
    'utf-8'
  )

  it('arranca el compilador sin arrastrar zone.js', () => {
    // el `setup-vitest` del plugin de Analog importa zone.js, y la app emitida es zoneless:
    // añadir zone.js solo para el runner metería en el árbol lo que la app no usa
    expect(setup).toContain("import '@angular/compiler'")
    expect(setup).not.toContain("import '@analogjs/vite-plugin-angular/setup-vitest'")
  })

  it('rellena los huecos de jsdom que usan los componentes emitidos', () => {
    expect(setup).toContain('window.matchMedia')
    expect(setup).toContain('scrollIntoView')
  })

  it('importa afterEach en vez de usarlo como global (el fichero entra en el tsconfig del front)', () => {
    // cazado por el gate de typecheck del emitido: como global daba TS2304
    expect(setup).toContain("import { afterEach } from 'vitest'")
  })

  it('limpia los overlays del CDK entre tests', () => {
    // viven fuera del fixture y sobreviven al cleanup: un overlay huérfano deja el body
    // aria-hidden y tumba las queries por rol del test siguiente
    expect(setup).toContain('cdk-overlay-container')
  })

  it('no re-inicializa el TestBed si ya tiene plataforma', () => {
    // initTestEnvironment lanza si se llama dos veces sobre el mismo contexto de módulo
    expect(setup).toContain('testBed.platform')
  })
})
