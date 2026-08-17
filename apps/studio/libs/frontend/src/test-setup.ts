// Sin `@analogjs/vite-plugin-angular/setup-vitest`: ese arranque carga zone.js y la app es
// zoneless. La compilación AOT la aporta el plugin en vitest.config.mts, no este fichero.
import { getTestBed } from '@angular/core/testing'
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing'

// jsdom no implementa ResizeObserver; el brain de Spartan observa el disparador del desplegable
// para dimensionar el popover, y sin esto el montaje revienta antes de pintar nada.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe(): void {
      return undefined
    }
    unobserve(): void {
      return undefined
    }
    disconnect(): void {
      return undefined
    }
  }
}

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

// jsdom no implementa scrollIntoView; brn-select desplaza hasta la opción activa al abrir.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined
}

// Los overlays del CDK (popovers, desplegables, diálogos) viven fuera del fixture y sobreviven
// a su destrucción: un overlay huérfano deja el resto del body en aria-hidden y rompe las
// consultas por rol del test siguiente.
afterEach(() => {
  document.querySelectorAll('.cdk-overlay-container').forEach(el => el.remove())
})

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
