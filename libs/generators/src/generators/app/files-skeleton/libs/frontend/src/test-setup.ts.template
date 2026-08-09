// Sin `@analogjs/vite-plugin-angular/setup-vitest` a propósito: ese arranque importa zone.js y
// esta app es zoneless (provideZonelessChangeDetection). El compilador basta para las plantillas.
import '@angular/compiler'
import { getTestBed } from '@angular/core/testing'
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing'

// jsdom no implementa matchMedia; los componentes que leen el esquema de color lo necesitan.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }) as unknown as MediaQueryList
}

// jsdom no implementa scrollIntoView, y brn-select desplaza la opción activa al abrirse:
// sin esto, todo test que despliegue un select emitido muere con un TypeError del CDK.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined
}

// Los overlays del CDK (popovers, selects, diálogos) viven fuera del fixture y sobreviven al
// cleanup: un overlay aria-modal huérfano deja el resto del body como aria-hidden y rompe las
// queries por rol del test siguiente.
afterEach(() => {
  document.querySelectorAll('.cdk-overlay-container').forEach(el => el.remove())
})

// initTestEnvironment lanza si ya se llamó sobre el mismo contexto de módulo. Se inicializa solo
// si hace falta: resetear el entorno tumbaría a otro fichero que estuviera a mitad de sus tests.
const testBed = getTestBed()

if (!testBed.platform) {
  testBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
}
