import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { HlmSelectImports } from '@spartan-ng/helm/select'

export interface AppSelectOption {
  value: string
  label: string
}

/** Desplegable enchufado a formularios reactivos. Contrato del acelerador. */
@Component({
  selector: 'app-select',
  imports: [HlmSelectImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppSelect), multi: true }],
  template: `
    <hlm-select [value]="value()" (valueChange)="onSelect($event)" [itemToString]="toLabel">
      <hlm-select-trigger class="app-control" [buttonId]="controlId()">
        <hlm-select-value [placeholder]="placeholder()" />
      </hlm-select-trigger>
      <hlm-select-content *hlmSelectPortal>
        @for (option of options(); track option.value) {
          <hlm-select-item [value]="option.value">{{ option.label }}</hlm-select-item>
        }
      </hlm-select-content>
    </hlm-select>
  `
})
export class AppSelect implements ControlValueAccessor {
  readonly options = input<AppSelectOption[]>([])
  readonly placeholder = input('')
  readonly controlId = input('')

  protected readonly value = signal<string | null>(null)
  private _onChange: (value: string | null) => void = () => undefined
  private _onTouched: () => void = () => undefined

  // itemToString: con el popover cerrado los items no están instanciados, así que el
  // trigger mostraría el valor crudo en vez de su etiqueta.
  protected readonly toLabel = (value: unknown): string =>
    this.options().find(option => option.value === String(value))?.label ?? ''

  writeValue(value: string | null): void {
    this.value.set(value)
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this._onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn
  }

  // hlm-select puede emitir undefined al limpiar: el contrato normaliza a null.
  protected onSelect(value: string | null | undefined): void {
    const normalized = value ?? null
    this.value.set(normalized)
    this._onChange(normalized)
    this._onTouched()
  }
}
