import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { SupplierDto } from '@app/shared/domain'

export interface SupplierFormValue {
  name: string
  taxId: string
  email: string
  phone: string
  city: string
  leadTimeDays: number
}

@Component({
  selector: 'app-supplier-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="supplier() ? 'Editar proveedor' : 'Nuevo proveedor'"
      [description]="supplier() ? 'Modifica los datos del proveedor' : 'Introduce los datos del nuevo proveedor'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos del proveedor</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Nombre" for="sname" class="sm:col-span-2">
              <input id="sname" appInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="CIF" for="staxId">
              <input id="staxId" appInput formControlName="taxId" />
            </app-form-field>
            <app-form-field label="Email" for="semail">
              <input id="semail" appInput formControlName="email" />
            </app-form-field>
            <app-form-field label="Teléfono" for="sphone">
              <input id="sphone" appInput formControlName="phone" />
            </app-form-field>
            <app-form-field label="Ciudad" for="scity">
              <input id="scity" appInput formControlName="city" />
            </app-form-field>
            <app-form-field label="Plazo de entrega (días)" for="sleadTimeDays">
              <input id="sleadTimeDays" type="number" appInput formControlName="leadTimeDays" />
              @if (form.controls.leadTimeDays.touched && form.controls.leadTimeDays.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ supplier() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class SupplierDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly supplier = input<SupplierDto | null>(null)
  readonly saved = output<SupplierFormValue>()
  readonly close = output<void>()

  readonly form = this._fb.nonNullable.group({
    name: ['', Validators.required],
    taxId: [''],
    email: [''],
    phone: [''],
    city: [''],
    leadTimeDays: this._fb.control<number | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const supplier = this.supplier()
      if (supplier) {
        this.form.patchValue({
          name: supplier.name,
          taxId: supplier.taxId ?? '',
          email: supplier.email ?? '',
          phone: supplier.phone ?? '',
          city: supplier.city ?? '',
          leadTimeDays: supplier.leadTimeDays
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
      leadTimeDays: raw.leadTimeDays as number
    })
    this.close.emit()
  }
}
