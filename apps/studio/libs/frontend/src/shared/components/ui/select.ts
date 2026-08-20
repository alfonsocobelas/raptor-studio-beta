import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core'
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
  // en bloque: si el anfitrión fuese en línea, el w-full del disparador mediría el texto
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppSelect), multi: true }],
  template: `
    <hlm-select
      [value]="value()"
      [disabled]="isDisabled()"
      (valueChange)="onSelect($event)"
      [itemToString]="toLabel"
    >
      <hlm-select-trigger [buttonId]="controlId()" [size]="size()" [class]="triggerClass()">
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
  readonly disabled = input(false)
  /**
   * `sm` para las filas densas de un panel, donde el tamaño normal deja el desplegable
   * más alto y con más letra que el texto al que acompaña.
   */
  readonly size = input<'default' | 'sm'>('default')

  /**
   * `w-full`: el disparador de helm viene `w-fit` y se encoge hasta su etiqueta, así que una
   * columna de desplegables quedaba con el borde izquierdo distinto en cada fila y los
   * contenedores de ancho fijo que los envuelven (los `w-48` del código emitido) no servían
   * de nada. El ancho lo decide quien lo coloca, como con cualquier control de formulario.
   *
   * El alto va por la MISMA variante que usa el disparador (data-[size=sm]:h-8); una clase
   * `h-*` suelta no la sustituye y el desplegable se quedaba 6px más alto que su fila.
   *
   * La flecha se achica aparte: helm la fija a 16px en el propio ng-icon y no mira el
   * `size`, así que en la fila densa —26px de alto, letra de 12px— era el elemento más
   * gordo, y más grande que los chevrones del raíl de Vistas. Va como variante
   * descendente para ganar por especificidad a la clase que helm pone en el icono.
   */
  protected readonly triggerClass = computed(() =>
    this.size() === 'sm' ? 'w-full data-[size=sm]:h-[26px] gap-1 px-2 py-0 text-xs [&_ng-icon]:text-[13px]' : 'w-full'
  )

  protected readonly value = signal<string | null>(null)
  // Deshabilitado por dos vías: el input directo y el que impone el formulario
  // (setDisabledState llega por [disabled] junto a ngModel o por form.disable()).
  private readonly disabledByForm = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm())
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

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled)
  }

  // hlm-select puede emitir undefined al limpiar: el contrato normaliza a null.
  protected onSelect(value: string | null | undefined): void {
    const normalized = value ?? null
    this.value.set(normalized)
    this._onChange(normalized)
    this._onTouched()
  }
}
