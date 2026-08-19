import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { DesignStore } from './design-store'
import { InspectorComponent } from './inspector.component'

function mount(resource: string) {
  const fixture = TestBed.createComponent(InspectorComponent)
  fixture.componentRef.setInput('resource', resource)
  fixture.detectChanges()
  return fixture
}

describe('InspectorComponent', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addResource('Cliente')
  })

  // El inspector edita columnas. La frase de negocio es de la entidad y vive en la pestaña
  // Entidad del panel de Modelo; aquí solo repetía lo mismo para cada bloque.
  it('no pide la frase de negocio: eso no es una propiedad del componente', () => {
    const fixture = mount('cliente')

    expect(fixture.nativeElement.querySelector('[data-testid="resource-brief"]')).toBeNull()
  })

  /**
   * El desplegable nativo lo pinta el sistema operativo, no el CSS del estudio: la lista
   * desplegada se vería del navegador. El contrato app-select (ADR-003) lo pinta el estudio.
   */
  it('el tipo de la columna se elige con el desplegable del estudio, no con el del navegador', async () => {
    const fixture = mount('cliente')
    await fixture.whenStable()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('select')).toBeNull()

    const trigger = fixture.nativeElement.querySelector('[data-testid="field-type-0"] button')
    expect(trigger?.textContent).toContain('texto')

    trigger.click()
    fixture.detectChanges()
    await fixture.whenStable()

    // La lista vive en un overlay del CDK, fuera del fixture: se busca en el documento.
    const option = [...document.querySelectorAll('hlm-select-item')].find(item =>
      item.textContent?.includes('fecha')
    ) as HTMLElement | undefined
    expect(option).toBeDefined()

    option?.click()
    fixture.detectChanges()

    expect(store.resources()[0].fields[0].type).toBe('date')
  })
})
