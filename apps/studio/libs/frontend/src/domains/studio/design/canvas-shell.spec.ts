import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { DesignStore } from './design-store'
import { PreviewPreset, PreviewSettings } from './preview-settings'
import { StudioCanvasComponent } from './studio-canvas.component'

/**
 * El espejo del shell del lienzo, fotografiado (spec 69, TASK-03).
 *
 * La instantánea es lo que impide que el shell del lienzo derive respecto al emitido sin que
 * nadie se entere: ya pasó dos veces. Se fotografían los nodos de CROMO (los `mock-*`), no el
 * contenido del lienzo — el bloque de tabla es de otros componentes y ya tiene sus tests.
 *
 * Con las cinco pieles retiradas (2026-08-27) queda una foto: la del neutro. Los nodos de cromo
 * que sólo tenían las pieles borradas (banda, miga, barra de estado) siguen en la lista a
 * propósito: la foto documenta que hoy NO existen.
 */
const CHROME = ['mock-sidebar', 'mock-banner', 'mock-modules', 'mock-breadcrumb', 'mock-statusbar', 'mock-theme-toggle']

function mount(preset: PreviewPreset) {
  const store = TestBed.inject(DesignStore)
  store.addPage('list', 'Vehículos')
  TestBed.inject(PreviewSettings).preset.set(preset)

  const fixture = TestBed.createComponent(StudioCanvasComponent)
  fixture.detectChanges()
  return fixture
}

/**
 * Los ids de encapsulación de Angular (`_ngcontent-*`, `_nghost-*`) se borran de la foto: son la
 * identidad del componente que pinta el nodo, y mover el shell a un componente propio los cambia
 * por definición. Lo que tiene que ser idéntico es el MARCADO, no quién lo escribe.
 */
const normalise = (html: string): string =>
  html
    .replace(/ _ng(content|host)-[a-z0-9-]+=""/g, '')
    // Y el ORDEN de las clases se ordena alfabéticamente: en HTML no significa nada (la cascada
    // de Tailwind no depende del orden del atributo), pero pasar una clase de estática a
    // vinculada la mueve al final. Lo que tiene que ser idéntico es el CONJUNTO.
    .replace(/class="([^"]*)"/g, (_, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    // Y los nodos-comentario que Angular deja como ancla de su control de flujo
    // (`<!--container-->`, `<!--ng-container-->`): no se pintan, y un outlet de plantilla añade
    // los suyos. Lo que tiene que ser idéntico es lo que se VE.
    .replace(/<!--.*?-->/g, '')

/** El cromo del shell, nodo a nodo y en orden, tal y como queda en el DOM. */
function chrome(fixture: ReturnType<typeof mount>): string {
  const scope: HTMLElement | null = fixture.nativeElement.querySelector('[data-testid="preview-scope"]')
  expect(scope).not.toBeNull()

  const parts = [`scope.class=${scope?.className}`]
  for (const id of CHROME) {
    const node: HTMLElement | null = fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
    parts.push(`${id}: ${node ? normalise(node.outerHTML) : '—'}`)
  }
  return parts.join('\n\n')
}

describe('el shell del lienzo por piel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({})
  })

  it('actual: barra lateral neutra con logotipo, sin barra de estado', () => {
    expect(chrome(mount('actual'))).toMatchSnapshot()
  })
})
