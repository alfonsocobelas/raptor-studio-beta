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
