import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { ParametroDto } from '@app/shared/domain'

export interface ParametroFormValue {
  codigo: string
  nombre: string
  metodo: string
  limiteLegal: number
  precio: number
}

@Component({
  selector: 'app-parametro-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="parametro() ? 'Editar parámetro' : 'Nuevo parámetro'"
      [description]="parametro() ? 'Modifica los datos del parámetro' : 'Introduce los datos del nuevo parámetro'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de parámetro</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Código" for="pcodigo">
              <input id="pcodigo" appInput formControlName="codigo" />
              @if (form.controls.codigo.touched && form.controls.codigo.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Nombre" for="pnombre">
              <input id="pnombre" appInput formControlName="nombre" />
            </app-form-field>
            <app-form-field label="Método" for="pmetodo">
              <input id="pmetodo" appInput formControlName="metodo" />
            </app-form-field>
            <app-form-field label="Límite legal" for="plimiteLegal">
              <input id="plimiteLegal" type="number" appInput formControlName="limiteLegal" />
              @if (form.controls.limiteLegal.touched && form.controls.limiteLegal.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Precio" for="pprecio">
              <input id="pprecio" type="number" appInput formControlName="precio" />
              @if (form.controls.precio.touched && form.controls.precio.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ parametro() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class ParametroDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly parametro = input<ParametroDto | null>(null)
  readonly saved = output<ParametroFormValue>()
  readonly close = output<void>()

  readonly form = this._fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: [''],
    metodo: [''],
    limiteLegal: this._fb.control<number | null>(null, Validators.required),
    precio: this._fb.control<number | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const parametro = this.parametro()
      if (parametro) {
        this.form.patchValue({
          codigo: parametro.codigo,
          nombre: parametro.nombre ?? '',
          metodo: parametro.metodo ?? '',
          limiteLegal: parametro.limiteLegal,
          precio: parametro.precio
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
      limiteLegal: raw.limiteLegal as number,
      precio: raw.precio as number
    })
    this.close.emit()
  }
}
