import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { CustomerClassification, CustomerDto } from '@sap-licenses/shared/domain'

const CUSTOMER_TYPE_OPTIONS: AppSelectOption[] = [
  { value: 'cloud', label: 'Cloud' },
  { value: 'onprem', label: 'On-prem' },
  { value: 'hybrid', label: 'Hybrid' }
]

export interface CustomerFormValue {
  sapId: string
  name: string
  taxId: string
  industry: string
  address: string
  phone: string
  notes: string
  customerType: CustomerClassification
}

@Component({
  selector: 'app-customer-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="customer() ? 'Editar cliente' : 'Nuevo cliente'"
      [description]="customer() ? 'Modifica los datos del cliente' : 'Introduce los datos del nuevo cliente'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos generales</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="ID SAP" for="csapId">
              <input id="csapId" appInput formControlName="sapId" />
              @if (form.controls.sapId.touched && form.controls.sapId.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Nombre" for="cname">
              <input id="cname" appInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="CIF / NIF" for="ctaxId">
              <input id="ctaxId" appInput formControlName="taxId" />
            </app-form-field>
            <app-form-field label="Industria" for="cindustry">
              <input id="cindustry" appInput formControlName="industry" />
            </app-form-field>
            <app-form-field label="Tipo" for="ctype">
              <app-select
                formControlName="customerType"
                controlId="ctype"
                placeholder="Seleccionar tipo"
                [options]="customerTypeOptions"
              />
              @if (form.controls.customerType.touched && form.controls.customerType.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Dirección" for="caddress">
              <input id="caddress" appInput formControlName="address" />
            </app-form-field>
            <app-form-field label="Teléfono" for="cphone">
              <input id="cphone" appInput formControlName="phone" />
            </app-form-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Notas</h4>
          <app-form-field label="Notas internas" for="cnotes">
            <textarea id="cnotes" class="resize-none" appInput formControlName="notes" rows="3"></textarea>
          </app-form-field>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ customer() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class CustomerDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly customer = input<CustomerDto | null>(null)
  readonly saved = output<CustomerFormValue>()
  readonly close = output<void>()

  protected readonly customerTypeOptions = CUSTOMER_TYPE_OPTIONS

  readonly form = this._fb.nonNullable.group({
    sapId: ['', Validators.required],
    name: ['', Validators.required],
    taxId: [''],
    industry: [''],
    address: [''],
    phone: [''],
    notes: [''],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    customerType: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const customer = this.customer()
      if (customer) {
        this.form.patchValue({
          sapId: customer.sapId,
          name: customer.name,
          taxId: customer.taxId ?? '',
          industry: customer.industry ?? '',
          address: customer.address ?? '',
          phone: customer.phone ?? '',
          notes: customer.notes ?? '',
          customerType: customer.customerType ?? null
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
      customerType: raw.customerType as CustomerClassification
    })
    this.close.emit()
  }
}
