import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { DesignStore } from './design-store'
import { ModelSummaryComponent } from './model-summary.component'

function mount() {
  const fixture = TestBed.createComponent(ModelSummaryComponent)
  fixture.detectChanges()
  return fixture
}

describe('ModelSummaryComponent', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] })
    store = TestBed.inject(DesignStore)
  })

  it('sin nada dibujado no cuenta nada', () => {
    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('Sin entidades')
  })

  it('cuenta las entidades en singular', () => {
    store.addResource('Producto')

    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('1 entidad')
    expect(fixture.nativeElement.textContent).not.toContain('entidades')
  })

  it('cuenta entidades y relaciones en plural', () => {
    store.addResource('Producto')
    store.addResource('Proveedor')
    store.addResource('Movimiento')
    store.addRelation('producto', 'proveedor')
    store.addRelation('movimiento', 'producto')

    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('3 entidades')
    expect(fixture.nativeElement.textContent).toContain('2 relaciones')
  })

  it('una sola relación va en singular', () => {
    store.addResource('Producto')
    store.addResource('Proveedor')
    store.addRelation('producto', 'proveedor')

    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('1 relación')
    expect(fixture.nativeElement.textContent).not.toContain('relaciones')
  })

  it('sin relaciones no menciona relaciones: el resumen no dice ceros', () => {
    store.addResource('Producto')

    const fixture = mount()

    expect(fixture.nativeElement.textContent).not.toContain('relaci')
  })
})
