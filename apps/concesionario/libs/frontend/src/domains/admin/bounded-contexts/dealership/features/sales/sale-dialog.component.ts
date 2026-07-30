import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { SaleDto } from '@app/shared/domain'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Contado',
  financing: 'Financiación',
  leasing: 'Renting / leasing'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pdte. entrega',
  delivered: 'Entregada',
  cancelled: 'Cancelada'
}

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
  imports: [
    ReactiveFormsModule,
    HlmDialogImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-content *hlmDialogPortal="let ctx" class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <hlm-dialog-header>
        <h3 hlmDialogTitle>{{ sale() ? 'Editar venta' : 'Nueva venta' }}</h3>
        <p hlmDialogDescription>
          {{ sale() ? 'Modifica los datos de la venta' : 'Introduce los datos de la nueva venta' }}
        </p>
      </hlm-dialog-header>
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save(ctx)">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de la operación</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field>
              <label hlmFieldLabel for="sreference">Referencia</label>
              <input id="sreference" hlmInput formControlName="reference" />
              @if (form.controls.reference.touched && form.controls.reference.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ssaleDate">Fecha</label>
              <input id="ssaleDate" type="date" hlmInput formControlName="saleDate" />
              @if (form.controls.saleDate.touched && form.controls.saleDate.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field class="sm:col-span-2">
              <label hlmFieldLabel for="svehicleLabel">Vehículo</label>
              <input id="svehicleLabel" hlmInput formControlName="vehicleLabel" />
              @if (form.controls.vehicleLabel.touched && form.controls.vehicleLabel.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field class="sm:col-span-2">
              <label hlmFieldLabel for="sclientLabel">Cliente</label>
              <input id="sclientLabel" hlmInput formControlName="clientLabel" />
              @if (form.controls.clientLabel.touched && form.controls.clientLabel.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ssalesperson">Comercial</label>
              <input id="ssalesperson" hlmInput formControlName="salesperson" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="sstatus">Estado</label>
              <hlm-select formControlName="status" [itemToString]="statusToLabel">
                <hlm-select-trigger buttonId="sstatus">
                  <hlm-select-value placeholder="Seleccionar estado" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="pending">Pdte. entrega</hlm-select-item>
                  <hlm-select-item value="delivered">Entregada</hlm-select-item>
                  <hlm-select-item value="cancelled">Cancelada</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
              <hlm-field-error>Obligatorio</hlm-field-error>
            </hlm-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Importes</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field>
              <label hlmFieldLabel for="samount">Importe (€)</label>
              <input id="samount" type="number" hlmInput formControlName="amount" />
              @if (form.controls.amount.touched && form.controls.amount.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="sdiscount">Descuento (€)</label>
              <input id="sdiscount" type="number" hlmInput formControlName="discount" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="spaymentMethod">Forma de pago</label>
              <hlm-select formControlName="paymentMethod" [itemToString]="paymentMethodToLabel">
                <hlm-select-trigger buttonId="spaymentMethod">
                  <hlm-select-value placeholder="Seleccionar forma de pago" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="cash">Contado</hlm-select-item>
                  <hlm-select-item value="financing">Financiación</hlm-select-item>
                  <hlm-select-item value="leasing">Renting / leasing</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
              <hlm-field-error>Obligatorio</hlm-field-error>
            </hlm-field>
          </div>
        </div>

        <hlm-dialog-footer>
          <button type="button" hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" hlmBtn>
            {{ sale() ? 'Guardar' : 'Crear' }}
          </button>
        </hlm-dialog-footer>
      </form>
    </hlm-dialog-content>
  `
})
export class SaleDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly sale = input<SaleDto | null>(null)
  readonly saved = output<SaleFormValue>()

  protected readonly paymentMethodToLabel = (value: unknown): string => PAYMENT_METHOD_LABELS[String(value)] ?? ''
  protected readonly statusToLabel = (value: unknown): string => STATUS_LABELS[String(value)] ?? ''

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

  save(ctx: { close: () => void }): void {
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
    ctx.close()
  }
}
