import { beforeEach, describe, expect, it } from 'vitest'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { AppSelect, type AppSelectOption } from './select'
import { chooseInSelect, openSelect, selectValueLabel } from './select.harness'

@Component({
  imports: [FormsModule, AppSelect],
  template: `
    <app-select
      data-testid="tipo"
      placeholder="Elegir"
      [options]="options"
      [disabled]="disabled()"
      [ngModel]="value()"
      [ngModelOptions]="{ standalone: true }"
      (ngModelChange)="value.set($event)"
    />
  `
})
class HostComponent {
  readonly options: AppSelectOption[] = [
    { value: 'string', label: 'texto' },
    { value: 'date', label: 'fecha' }
  ]
  readonly value = signal<string | null>(null)
  readonly disabled = signal(false)
}

@Component({
  imports: [AppSelect],
  template: `
    <app-select data-testid="denso" size="sm" [options]="options" />
    <app-select data-testid="normal" [options]="options" />
  `
})
class SizedHostComponent {
  readonly options: AppSelectOption[] = [{ value: 'string', label: 'texto' }]
}

function mount() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

describe('AppSelect', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({})
  })

  it('sin valor enseña el placeholder, y elegir una opción lo escribe en el formulario', async () => {
    const fixture = mount()

    expect(selectValueLabel(fixture, 'tipo')).toBe('Elegir')

    await chooseInSelect(fixture, 'tipo', 'fecha')

    expect(fixture.componentInstance.value()).toBe('date')
    expect(selectValueLabel(fixture, 'tipo')).toBe('fecha')
  })

  it('deshabilitado no se puede abrir', async () => {
    const fixture = mount()
    fixture.componentInstance.disabled.set(true)
    fixture.detectChanges()
    await fixture.whenStable()

    const trigger = fixture.nativeElement.querySelector('[data-testid="tipo"] button') as HTMLButtonElement
    expect(trigger.disabled).toBe(true)
    expect(await openSelect(fixture, 'tipo')).toEqual([])
  })

  /**
   * La flecha del disparador la pinta helm con un tamaño fijo (16px) que NO mira el
   * `size` del control: en una fila densa —26px de alto y letra de 12px— quedaba como
   * el elemento más gordo, y más grande que los chevrones del raíl de Vistas (13px).
   * En jsdom no hay Tailwind que medir, así que el test exige la clase que la achica.
   */
  it('la variante densa achica la flecha; la normal se queda con la de helm', () => {
    const fixture = TestBed.createComponent(SizedHostComponent)
    fixture.detectChanges()

    const trigger = (testid: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${testid}"] button`) as HTMLButtonElement

    expect(trigger('denso').className).toContain('[&_ng-icon]:text-[13px]')
    expect(trigger('normal').className).not.toContain('[&_ng-icon]:text-[13px]')
  })
})
