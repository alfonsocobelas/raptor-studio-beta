import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { ClienteDto } from '@app/shared/domain'

const TIPO_OPTIONS: AppSelectOption[] = [
  { value: 'ayuntamiento', label: 'Ayuntamiento' },
  { value: 'regantes', label: 'Comunidad de regantes' },
  { value: 'alimentacion', label: 'Empresa de alimentación' }
]

export interface ClienteFormValue {
  nombre: string
  tipo: string
  telefono: string
  localidad: string
}

@Component({
  selector: 'app-cliente-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="cliente() ? 'Editar cliente' : 'Nuevo cliente'"
      [description]="cliente() ? 'Modifica los datos del cliente' : 'Introduce los datos del nuevo cliente'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de cliente</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Nombre" for="cnombre">
              <input id="cnombre" appInput formControlName="nombre" />
              @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Tipo" for="ctipo">
              <app-select formControlName="tipo" controlId="ctipo" placeholder="" [options]="tipoOptions" />
            </app-form-field>
            <app-form-field label="Teléfono" for="ctelefono">
              <input id="ctelefono" appInput formControlName="telefono" />
            </app-form-field>
            <app-form-field label="Localidad" for="clocalidad">
              <input id="clocalidad" appInput formControlName="localidad" />
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ cliente() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class ClienteDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly cliente = input<ClienteDto | null>(null)
  readonly saved = output<ClienteFormValue>()
  readonly close = output<void>()

  protected readonly tipoOptions = TIPO_OPTIONS

  readonly form = this._fb.nonNullable.group({
    nombre: ['', Validators.required],
    tipo: ['ayuntamiento'],
    telefono: [''],
    localidad: ['']
  })

  constructor() {
    effect(() => {
      const cliente = this.cliente()
      if (cliente) {
        this.form.patchValue({
          nombre: cliente.nombre,
          tipo: cliente.tipo,
          telefono: cliente.telefono ?? '',
          localidad: cliente.localidad ?? ''
        })
      }
    })
  }

  save(): void {
    if (this.form.invalid) {
      return
    }
    const raw = this.form.getRawValue()
    this.saved.emit(raw)
    this.close.emit()
  }
}
