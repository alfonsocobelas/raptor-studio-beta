import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { PuntoDto } from '@app/shared/domain'
import { ClienteService } from '../../../../../../core/services/cliente.service'

const TIPO_AGUA_OPTIONS: AppSelectOption[] = [
  { value: 'potable', label: 'Potable' },
  { value: 'riego', label: 'Riego' },
  { value: 'residual', label: 'Residual' },
  { value: 'proceso', label: 'De proceso' }
]

export interface PuntoFormValue {
  nombre: string
  tipoAgua: string
  direccion: string
  coordenadas: string
  obligatorio: boolean
  clienteId: string
  clienteName: string
}

@Component({
  selector: 'app-punto-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="punto() ? 'Editar punto de muestreo' : 'Nuevo punto de muestreo'"
      [description]="
        punto() ? 'Modifica los datos del punto de muestreo' : 'Introduce los datos del nuevo punto de muestreo'
      "
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de punto de muestreo</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Nombre" for="pnombre">
              <input id="pnombre" appInput formControlName="nombre" />
              @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Tipo de agua" for="ptipoAgua">
              <app-select formControlName="tipoAgua" controlId="ptipoAgua" placeholder="" [options]="tipoAguaOptions" />
            </app-form-field>
            <app-form-field label="Dirección" for="pdireccion">
              <input id="pdireccion" appInput formControlName="direccion" />
            </app-form-field>
            <app-form-field label="Coordenadas" for="pcoordenadas">
              <input id="pcoordenadas" appInput formControlName="coordenadas" />
            </app-form-field>
            <app-form-field label="Control obligatorio" for="pobligatorio">
              <label class="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" formControlName="obligatorio" />
                Control obligatorio
              </label>
            </app-form-field>
            <app-form-field label="Cliente" for="pclienteId">
              <app-select
                formControlName="clienteId"
                controlId="pclienteId"
                placeholder="Seleccionar cliente"
                [options]="clienteIdOptions()"
              />
              @if (form.controls.clienteId.touched && form.controls.clienteId.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ punto() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class PuntoDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _clienteService = inject(ClienteService)

  readonly punto = input<PuntoDto | null>(null)
  readonly saved = output<PuntoFormValue>()
  readonly close = output<void>()

  readonly clientes = computed(() => this._clienteService.clientes.value()?.items ?? [])
  protected readonly clienteIdOptions = computed<AppSelectOption[]>(() =>
    this.clientes().map(item => ({ value: item.id, label: item.nombre }))
  )

  protected readonly tipoAguaOptions = TIPO_AGUA_OPTIONS

  readonly form = this._fb.nonNullable.group({
    nombre: ['', Validators.required],
    tipoAgua: ['potable'],
    direccion: [''],
    coordenadas: [''],
    obligatorio: [false],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    clienteId: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const punto = this.punto()
      if (punto) {
        this.form.patchValue({
          nombre: punto.nombre,
          tipoAgua: punto.tipoAgua,
          direccion: punto.direccion ?? '',
          coordenadas: punto.coordenadas ?? '',
          obligatorio: punto.obligatorio,
          clienteId: punto.clienteId
        })
      }
    })
  }

  save(): void {
    if (this.form.invalid) {
      return
    }
    const raw = this.form.getRawValue()
    this.saved.emit({
      ...raw,
      clienteId: raw.clienteId ?? '',
      clienteName: this.clientes().find(item => item.id === raw.clienteId)?.nombre ?? ''
    })
    this.close.emit()
  }
}
