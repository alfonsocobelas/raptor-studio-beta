import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { CustomerClassification, CustomerDto } from '@sap-licenses/shared/domain'

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  cloud: 'Cloud',
  onprem: 'On-prem',
  hybrid: 'Hybrid'
}

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
        <h3 hlmDialogTitle>{{ customer() ? 'Editar cliente' : 'Nuevo cliente' }}</h3>
        <p hlmDialogDescription>
          {{ customer() ? 'Modifica los datos del cliente' : 'Introduce los datos del nuevo cliente' }}
        </p>
      </hlm-dialog-header>
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save(ctx)">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos generales</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field>
              <label hlmFieldLabel for="csapId"> ID SAP </label>
              <input id="csapId" hlmInput formControlName="sapId" />
              @if (form.controls.sapId.touched && form.controls.sapId.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cname"> Nombre </label>
              <input id="cname" hlmInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ctaxId"> CIF / NIF </label>
              <input id="ctaxId" hlmInput formControlName="taxId" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cindustry"> Industria </label>
              <input id="cindustry" hlmInput formControlName="industry" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ctype"> Tipo </label>
              <!-- itemToString: con el popover cerrado los items no están instanciados y el trigger
                   mostraría el valor crudo en modo edición en vez de la etiqueta. -->
              <hlm-select formControlName="customerType" [itemToString]="customerTypeToLabel">
                <hlm-select-trigger buttonId="ctype">
                  <hlm-select-value placeholder="Seleccionar tipo" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="cloud">Cloud</hlm-select-item>
                  <hlm-select-item value="onprem">On-prem</hlm-select-item>
                  <hlm-select-item value="hybrid">Hybrid</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
              <hlm-field-error>Obligatorio</hlm-field-error>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="caddress"> Dirección </label>
              <input id="caddress" hlmInput formControlName="address" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cphone"> Teléfono </label>
              <input id="cphone" hlmInput formControlName="phone" />
            </hlm-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Notas</h4>
          <hlm-field>
            <label hlmFieldLabel for="cnotes"> Notas internas </label>
            <textarea id="cnotes" class="resize-none" hlmInput formControlName="notes" rows="3"></textarea>
          </hlm-field>
        </div>

        <hlm-dialog-footer>
          <button type="button" hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" hlmBtn>
            {{ customer() ? 'Guardar' : 'Crear' }}
          </button>
        </hlm-dialog-footer>
      </form>
    </hlm-dialog-content>
  `
})
export class CustomerDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly customer = input<CustomerDto | null>(null)
  readonly saved = output<CustomerFormValue>()

  protected readonly customerTypeToLabel = (value: unknown): string => CUSTOMER_TYPE_LABELS[String(value)] ?? ''

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

  save(ctx: { close: () => void }): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue()
      this.saved.emit({ ...raw, customerType: raw.customerType as CustomerClassification })
      ctx.close()
    }
  }
}
