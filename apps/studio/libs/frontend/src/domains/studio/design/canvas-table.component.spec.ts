import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { chooseInSelect, openSelect } from '../../../shared/components/ui/select.harness'
import { CanvasTableComponent } from './canvas-table.component'
import { DesignStore } from './design-store'

function mount() {
  const fixture = TestBed.createComponent(CanvasTableComponent)
  fixture.componentRef.setInput('resource', 'producto')
  fixture.detectChanges()
  return fixture
}

/** El editor de una columna se abre pulsando su cabecera en el lienzo. */
function openColumnEditor(fixture: ReturnType<typeof mount>, field: string) {
  const header = fixture.nativeElement.querySelector(`[data-testid="col-header-${field}"]`) as HTMLElement
  header.click()
  fixture.detectChanges()
}

describe('CanvasTableComponent — el editor de columnas', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addResource('Producto')
  })

  const firstField = () => store.resources()[0].fields[0].name

  // El desplegable nativo lo pinta el sistema operativo, no el CSS del estudio (ADR-003).
  it('el tipo se elige con el desplegable del estudio, no con el del navegador', async () => {
    const fixture = mount()
    openColumnEditor(fixture, firstField())

    expect(fixture.nativeElement.querySelector('select')).toBeNull()

    await chooseInSelect(fixture, 'col-editor-type', 'fecha')

    expect(store.resources()[0].fields[0].type).toBe('date')
  })

  it('una columna de tipo referencia elige a qué entidad apunta', async () => {
    store.addResource('Proveedor')
    const fixture = mount()
    openColumnEditor(fixture, firstField())
    await chooseInSelect(fixture, 'col-editor-type', 'referencia a…')

    // la propia entidad no es candidata: una referencia a sí misma no la ofrece el lienzo
    expect(await openSelect(fixture, 'col-editor-refto')).not.toContain('Producto')

    await chooseInSelect(fixture, 'col-editor-refto', 'Proveedor')

    expect(store.resources()[0].fields[0].refTo).toBe('proveedor')
  })
})

/**
 * Spec 54: la avería de la demo taller (campo `text`, 2000 caracteres) partía la celda en cinco
 * líneas, la fila medía 140px y arrastraba a las vecinas — «OR-2026-0141» se rompía en dos. El
 * emitido ya iba a una línea, así que el lienzo prometía una tabla que no existe.
 */
describe('CanvasTableComponent — el ancho de la columna de texto largo', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addResource('Producto')
    store.addField('producto')
    store.updateField('producto', 1, { name: 'descripcion', label: 'Descripción', type: 'text' })
  })

  const cell = (fixture: ReturnType<typeof mount>, field: string) =>
    fixture.nativeElement.querySelector(`[data-testid="cell-${field}"]`) as HTMLElement

  it('la celda de texto largo se corta con elipsis en el mismo techo que la app emitida', () => {
    const fixture = mount()

    const capped = cell(fixture, 'descripcion').querySelector('span') as HTMLElement
    expect(capped.className).toContain('truncate')
    expect(capped.style.maxWidth).toBe('280px')
  })

  it('una columna normal no lleva techo: el ancho lo sigue mandando su contenido', () => {
    const fixture = mount()

    expect(cell(fixture, 'nombre').querySelector('span')).toBeNull()
  })

  // La de acciones es un flex de iconos y la última va vacía: aquí se mide el dato.
  it('ninguna celda de datos envuelve: una fila mide una línea, como en el emitido', () => {
    const fixture = mount()

    const cells = [...fixture.nativeElement.querySelectorAll('tbody [data-testid^="cell-"]')] as HTMLElement[]
    expect(cells.length).toBeGreaterThan(0)
    expect(cells.every(td => td.className.includes('whitespace-nowrap'))).toBe(true)
  })
})
