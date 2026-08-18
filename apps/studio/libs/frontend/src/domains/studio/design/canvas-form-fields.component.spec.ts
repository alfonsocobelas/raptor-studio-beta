import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import type { DraftResource } from '@app/shared/domain'
import { openSelect, selectValueLabel } from '../../../shared/components/ui/select.harness'
import { CanvasFormFieldsComponent } from './canvas-form-fields.component'

const RESOURCE: DraftResource = {
  name: 'pedido',
  labelSingular: 'Pedido',
  labelPlural: 'Pedidos',
  fields: [
    {
      name: 'estado',
      label: 'Estado',
      type: 'enum',
      values: [
        { value: 'borrador', label: 'Borrador' },
        { value: 'enviado', label: 'Enviado' }
      ]
    }
  ]
}

function mount() {
  const fixture = TestBed.createComponent(CanvasFormFieldsComponent)
  fixture.componentRef.setInput('resource', RESOURCE)
  fixture.detectChanges()
  return fixture
}

/**
 * El lienzo previsualiza la app que se va a generar, y el generador emite app-select
 * (files-ui/spartan/.../select.ts.template): un <select> nativo aquí haría mentir a la
 * previsualización, porque su lista la pintaría el sistema operativo.
 */
describe('CanvasFormFieldsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({})
  })

  it('un campo de lista se previsualiza con el desplegable del estudio, no con el del navegador', async () => {
    const fixture = mount()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('select')).toBeNull()
    expect(selectValueLabel(fixture, 'form-select-estado')).toBe('Seleccionar…')
    expect(await openSelect(fixture, 'form-select-estado')).toEqual(['Borrador', 'Enviado'])
  })
})
