import { ChangeDetectionStrategy, Component, computed, forwardRef, input, output, signal } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { AppInput } from './input.directive'
import { AppSelectOption } from './select'

/**
 * Combobox con búsqueda asíncrona para campos de referencia (spec 66): quien lo usa
 * escucha (searchChange) —ya con debounce— y repone [options]; el valor del formulario
 * es SIEMPRE el id. Con miles de registros un desplegable no sirve: aquí se teclea.
 */
@Component({
  selector: 'app-lookup',
  // el <input> pasa por el CONTRATO en vez de copiar sus clases: una sola fuente para el estilo
  // del campo, y la piel lo alcanza por [appinput] como a cualquier otro (spec 69)
  imports: [AppInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppLookup), multi: true }],
  template: `
    <div class="relative">
      <input
        [id]="controlId()"
        type="text"
        role="combobox"
        autocomplete="off"
        appInput
        [placeholder]="placeholder()"
        [attr.aria-expanded]="open()"
        [value]="text()"
        (input)="onType($any($event.target).value)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown.escape)="close()"
      />
      @if (open()) {
        <ul
          class="app-panel bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border p-1 shadow-md"
        >
          @for (option of options(); track option.value) {
            <li>
              <!-- mousedown, no click: el blur del input cerraría la lista antes del click -->
              <button
                type="button"
                class="hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm"
                [class.bg-accent]="option.value === value()"
                (mousedown)="select(option)"
              >
                {{ option.label }}
              </button>
            </li>
          } @empty {
            <li class="text-muted-foreground px-2 py-1.5 text-sm">Sin resultados</li>
          }
          @if (hasMore()) {
            <li>
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm"
                (mousedown)="more($event)"
              >
                Ver más resultados…
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class AppLookup implements ControlValueAccessor {
  readonly options = input<AppSelectOption[]>([])
  readonly placeholder = input('')
  readonly controlId = input('')
  /** Quedan más resultados en el servidor: se ofrece «Ver más». */
  readonly hasMore = input(false)
  /** Término tecleado, ya con debounce: quien escucha repone [options]. */
  readonly searchChange = output<string>()
  /** El usuario pidió la página siguiente: quien escucha AÑADE a [options]. */
  readonly loadMore = output<void>()

  protected readonly value = signal<string | null>(null)
  protected readonly open = signal(false)
  /** Texto tecleado mientras se busca; null = enseñar la etiqueta del valor vigente. */
  private readonly _typed = signal<string | null>(null)
  private _debounce: ReturnType<typeof setTimeout> | undefined
  private _onChange: (value: string | null) => void = () => undefined
  private _onTouched: () => void = () => undefined

  protected readonly text = computed(() => {
    const typed = this._typed()
    if (typed !== null) return typed
    const current = this.value()
    return this.options().find(option => option.value === current)?.label ?? ''
  })

  protected onType(term: string): void {
    this._typed.set(term)
    this.open.set(true)
    clearTimeout(this._debounce)
    this._debounce = setTimeout(() => this.searchChange.emit(term), 300)
  }

  protected onFocus(): void {
    this.open.set(true)
  }

  protected onBlur(): void {
    // el blur gana al mousedown si se cierra en el acto: se deja pasar el turno
    setTimeout(() => {
      this.open.set(false)
      this._typed.set(null)
      this._onTouched()
    }, 120)
  }

  protected close(): void {
    this.open.set(false)
    this._typed.set(null)
  }

  protected more(event: Event): void {
    // ni blur ni cierre: la lista sigue abierta mientras llegan más resultados
    event.preventDefault()
    this.loadMore.emit()
  }

  protected select(option: AppSelectOption): void {
    this.value.set(option.value)
    this._typed.set(null)
    this.open.set(false)
    this._onChange(option.value)
    this._onTouched()
  }

  writeValue(value: string | null): void {
    this.value.set(value)
    this._typed.set(null)
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this._onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn
  }
}
