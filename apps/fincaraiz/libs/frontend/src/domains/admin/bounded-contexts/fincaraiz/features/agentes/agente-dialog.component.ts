import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AgenteDto } from '@app/shared/domain'

export interface AgenteFormValue {
  nombre: string
  email: string
  telefono: string
  comisionPorcentaje: number
  activo: boolean
}

@Component({
  selector: 'app-agente-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="agente() ? 'Editar agente' : 'Nuevo agente'"
      [description]="agente() ? 'Modifica los datos del agente' : 'Introduce los datos del nuevo agente'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de agente</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Nombre" for="anombre">
              <input id="anombre" appInput formControlName="nombre" />
              @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Email" for="aemail">
              <input id="aemail" appInput formControlName="email" />
            </app-form-field>
            <app-form-field label="Teléfono" for="atelefono">
              <input id="atelefono" appInput formControlName="telefono" />
            </app-form-field>
            <app-form-field label="Comisión (%)" for="acomisionPorcentaje">
              <input id="acomisionPorcentaje" type="number" appInput formControlName="comisionPorcentaje" />
              @if (form.controls.comisionPorcentaje.touched && form.controls.comisionPorcentaje.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Activo" for="aactivo">
              <label class="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" formControlName="activo" />
                Activo
              </label>
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ agente() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class AgenteDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly agente = input<AgenteDto | null>(null)
  readonly saved = output<AgenteFormValue>()
  readonly close = output<void>()

  readonly form = this._fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: [''],
    telefono: [''],
    comisionPorcentaje: this._fb.control<number | null>(null, Validators.required),
    activo: [false]
  })

  constructor() {
    effect(() => {
      const agente = this.agente()
      if (agente) {
        this.form.patchValue({
          nombre: agente.nombre,
          email: agente.email ?? '',
          telefono: agente.telefono ?? '',
          comisionPorcentaje: agente.comisionPorcentaje,
          activo: agente.activo
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
      comisionPorcentaje: raw.comisionPorcentaje as number
    })
    this.close.emit()
  }
}
