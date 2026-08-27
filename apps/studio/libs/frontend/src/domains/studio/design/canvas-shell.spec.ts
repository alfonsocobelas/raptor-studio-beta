import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { DesignStore } from './design-store'
import { PreviewPreset, PreviewSettings } from './preview-settings'
import { StudioCanvasComponent } from './studio-canvas.component'

/**
 * El espejo del shell del lienzo, blindado antes de extraerlo a datos (spec 69, TASK-03).
 *
 * Hasta hoy el shell de cada piel se escribía a mano en la plantilla del lienzo con un `@if` por
 * preset. Con tres pieles nuevas eso son cinco ramas y ~300 líneas duplicadas, y ya derivó dos
 * veces respecto al emitido. La extracción a un descriptor no puede cambiar NADA de lo que hoy
 * se ve, así que estas instantáneas se graban con el código viejo y tienen que sobrevivir al
 * refactor carácter a carácter.
 *
 * Se fotografían los nodos de CROMO (los `mock-*`), no el contenido del lienzo: el bloque de
 * tabla es de otros componentes y ya tiene sus tests.
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

  it('cabina: barra a contraste con contadores y barra de estado', () => {
    expect(chrome(mount('cabina'))).toMatchSnapshot()
  })

  it('suite: banda de marca, pestañas de módulo y miga', () => {
    expect(chrome(mount('suite'))).toMatchSnapshot()
  })

  // ── Spec 69: la familia raptor. Estas tres NO tienen foto previa que respetar (nacen aquí),
  // así que la instantánea las fija de aquí en adelante y el test dice qué se espera de cada una.
  it('taller: raíl de lino con versalita y marcador de acento', () => {
    const fixture = mount('taller')
    const rail = fixture.nativeElement.querySelector('[data-testid="mock-sidebar"]')

    // el acento del TEMA, no un naranja escrito a mano
    expect(rail.innerHTML).toContain('var(--shell-accent)')
    expect(rail.innerHTML).not.toMatch(/#f15539|#d75f3d/)
    // versalita bajo el nombre y el pie de sesión calcado del emitido
    expect(rail.textContent).toContain('Panel de gestión')
    expect(fixture.nativeElement.querySelector('[data-testid="mock-session-footer"]')).not.toBeNull()
    expect(chrome(fixture)).toMatchSnapshot()
  })

  it('rotulo: banda de tinta con el logotipo en el acento y la navegación dentro', () => {
    const fixture = mount('rotulo')
    const banner = fixture.nativeElement.querySelector('[data-testid="mock-banner"]')

    // el logotipo toma el acento del TEMA y la navegación vive en la banda, no en un raíl
    expect(banner.innerHTML).toContain('var(--shell-accent)')
    expect(banner.querySelector('[data-testid="nav-page-0"]')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('[data-testid="mock-sidebar"]')).toBeNull()
    expect(chrome(fixture)).toMatchSnapshot()
  })

  it('banco: el mismo raíl apretado, con la ruta arriba', () => {
    const fixture = mount('banco')

    // la barra de ruta es lo que lo separa de taller; el raíl sigue siendo de lino, no invertido
    const path = fixture.nativeElement.querySelector('[data-testid="mock-statusbar"]')
    expect(path?.textContent).toContain('mi-app')
    expect(fixture.nativeElement.querySelector('[data-testid="mock-sidebar"]')).not.toBeNull()
    expect(chrome(fixture)).toMatchSnapshot()
  })
})
