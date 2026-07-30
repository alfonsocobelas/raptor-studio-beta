import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { SaleDto } from '@app/shared/domain'

const PAYMENT_METHOD_OPTIONS: AppSelectOption[] = [
  { value: 'cash', label: 'Contado' },
  { value: 'financing', label: 'Financiación' },
  { value: 'leasing', label: 'Renting / leasing' }
]

const STATUS_OPTIONS: AppSelectOption[] = [
  { value: 'pending', label: 'Pdte. entrega' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'cancelled', label: 'Cancelada' }
]

export interface SaleFormValue {
  reference: string
  saleDate: string
  vehicleLabel: string
  clientLabel: string
  salesperson: string
  amount: number
  discount: number | undefined
  paymentMethod: string
  status: string
}

@Component({
  selector: 'app-sale-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="sale() ? 'Editar venta' : 'Nueva venta'"
      [description]="sale() ? 'Modifica los datos de la venta' : 'Introduce los datos de la nueva venta'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de la operación</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Referencia" for="sreference">
              <input id="sreference" appInput formControlName="reference" />
              @if (form.controls.reference.touched && form.controls.reference.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Fecha" for="ssaleDate">
              <input id="ssaleDate" type="date" appInput formControlName="saleDate" />
              @if (form.controls.saleDate.touched && form.controls.saleDate.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Vehículo" for="svehicleLabel" class="sm:col-span-2">
              <input id="svehicleLabel" appInput formControlName="vehicleLabel" />
              @if (form.controls.vehicleLabel.touched && form.controls.vehicleLabel.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Cliente" for="sclientLabel" class="sm:col-span-2">
              <input id="sclientLabel" appInput formControlName="clientLabel" />
              @if (form.controls.clientLabel.touched && form.controls.clientLabel.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Comercial" for="ssalesperson">
              <input id="ssalesperson" appInput formControlName="salesperson" />
            </app-form-field>
            <app-form-field label="Estado" for="sstatus">
              <app-select
                formControlName="status"
                controlId="sstatus"
                placeholder="Seleccionar estado"
                [options]="statusOptions"
              />
              @if (form.controls.status.touched && form.controls.status.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Importes</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Importe (€)" for="samount">
              <input id="samount" type="number" appInput formControlName="amount" />
              @if (form.controls.amount.touched && form.controls.amount.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Descuento (€)" for="sdiscount">
              <input id="sdiscount" type="number" appInput formControlName="discount" />
            </app-form-field>
            <app-form-field label="Forma de pago" for="spaymentMethod">
              <app-select
                formControlName="paymentMethod"
                controlId="spaymentMethod"
                placeholder="Seleccionar forma de pago"
                [options]="paymentMethodOptions"
              />
              @if (form.controls.paymentMethod.touched && form.controls.paymentMethod.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ sale() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class SaleDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly sale = input<SaleDto | null>(null)
  readonly saved = output<SaleFormValue>()
  readonly close = output<void>()

  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS
  protected readonly statusOptions = STATUS_OPTIONS

  readonly form = this._fb.nonNullable.group({
    reference: ['', Validators.required],
    saleDate: ['', Validators.required],
    vehicleLabel: ['', Validators.required],
    clientLabel: ['', Validators.required],
    salesperson: [''],
    amount: this._fb.control<number | null>(null, Validators.required),
    discount: this._fb.control<number | null>(null),
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    paymentMethod: this._fb.control<string | null>(null, Validators.required),
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    status: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const sale = this.sale()
      if (sale) {
        this.form.patchValue({
          reference: sale.reference,
          saleDate: sale.saleDate,
          vehicleLabel: sale.vehicleLabel,
          clientLabel: sale.clientLabel,
          salesperson: sale.salesperson ?? '',
          amount: sale.amount,
          discount: sale.discount ?? '',
          paymentMethod: sale.paymentMethod ?? null,
          status: sale.status ?? null
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
      paymentMethod: raw.paymentMethod as string,
      status: raw.status as string,
      amount: raw.amount as number,
      discount: raw.discount ?? undefined
    })
    this.close.emit()
  }
}
