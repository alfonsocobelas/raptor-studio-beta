import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'

export interface AppSelectOption {
  value: string
  label: string
}

/** Desplegable (piel Material). Misma API que la implementación Spartan. */
@Component({
  selector: 'app-select',
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppSelect), multi: true }],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
      <mat-select [id]="controlId()" [value]="value()" [placeholder]="placeholder()" (valueChange)="onSelect($event)">
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `
})
export class AppSelect implements ControlValueAccessor {
  readonly options = input<AppSelectOption[]>([])
  readonly placeholder = input('')
  readonly controlId = input('')

  protected readonly value = signal<string | null>(null)
  private _onChange: (value: string | null) => void = () => undefined
  private _onTouched: () => void = () => undefined

  writeValue(value: string | null): void {
    this.value.set(value)
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this._onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn
  }

  protected onSelect(value: string | null): void {
    this.value.set(value)
    this._onChange(value)
    this._onTouched()
  }
}
