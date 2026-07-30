import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import {
  BillingFrequencyEnum,
  ContractDto,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTypeEnum,
  RenewalTypeEnum
} from '@sap-licenses/shared/domain'
import { CustomerService } from '../../../../../../core/services/customer.service'
import {
  BILLING_FREQUENCY_LABELS,
  CONTRACT_SOURCE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  RENEWAL_TYPE_LABELS
} from './contract-labels'

export interface ContractFormValue {
  contractType: ContractTypeEnum
  contractNumber: string
  customerId: string
  isFavorite: boolean
  status: ContractStatusEnum
  source: ContractSourceEnum
  startDate: string
  endDate: string | null
  currency: string
  billingFrequency: BillingFrequencyEnum
  renewalType: RenewalTypeEnum
  notes: string
  customerName: string
}

const dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate')?.value
  const end = group.get('endDate')?.value
  return start && end && end < start ? { dateRange: true } : null
}

@Component({
  selector: 'app-contract-dialog',
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
        <h3 hlmDialogTitle>{{ contract() ? 'Editar contrato' : 'Nuevo contrato' }}</h3>
        <p hlmDialogDescription>
          {{ contract() ? 'Modifica los datos del contrato' : 'Introduce los datos del nuevo contrato' }}
        </p>
      </hlm-dialog-header>
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save(ctx)">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos del contrato</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field>
              <label hlmFieldLabel for="cnum">Nº Contrato</label>
              <input id="cnum" hlmInput formControlName="contractNumber" />
              @if (form.controls.contractNumber.touched && form.controls.contractNumber.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ctype">Tipo</label>
              <hlm-select formControlName="contractType" [itemToString]="contractTypeToLabel">
                <hlm-select-trigger buttonId="ctype">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="cloud">Cloud</hlm-select-item>
                  <hlm-select-item value="onprem">On-premise</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ccust">Cliente</label>
              <hlm-select formControlName="customerId" [itemToString]="customerIdToLabel">
                <hlm-select-trigger buttonId="ccust">
                  <hlm-select-value placeholder="Seleccionar cliente" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal showScroll>
                  @for (item of customers(); track item.id) {
                    <hlm-select-item [value]="item.id">{{ item.name }}</hlm-select-item>
                  }
                </hlm-select-content>
              </hlm-select>
              @if (form.controls.customerId.touched && form.controls.customerId.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cstart">Fecha inicio</label>
              <input id="cstart" type="date" hlmInput formControlName="startDate" />
              @if (form.controls.startDate.touched && form.controls.startDate.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cend">Fecha fin</label>
              <input id="cend" type="date" hlmInput formControlName="endDate" />
              <!-- forceShow: dateRange es un error de grupo; sin él, hlm-field-error se oculta porque
                   el control endDate está válido (solo mira los errores de su propio control). -->
              @if (form.errors?.['dateRange']) {
                <hlm-field-error forceShow>La fecha fin debe ser posterior a la de inicio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cstatus">Estado</label>
              <hlm-select formControlName="status" [itemToString]="statusToLabel">
                <hlm-select-trigger buttonId="cstatus">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="active">Activo</hlm-select-item>
                  <hlm-select-item value="expiring">Por expirar</hlm-select-item>
                  <hlm-select-item value="expired">Expirado</hlm-select-item>
                  <hlm-select-item value="terminated">Terminado</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ccurrency">Moneda</label>
              <input id="ccurrency" hlmInput formControlName="currency" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cbilling">Facturación</label>
              <hlm-select formControlName="billingFrequency" [itemToString]="billingFrequencyToLabel">
                <hlm-select-trigger buttonId="cbilling">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="monthly">Mensual</hlm-select-item>
                  <hlm-select-item value="quarterly">Trimestral</hlm-select-item>
                  <hlm-select-item value="semiannual">Semestral</hlm-select-item>
                  <hlm-select-item value="yearly">Anual</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="crenewal">Renovación</label>
              <hlm-select formControlName="renewalType" [itemToString]="renewalTypeToLabel">
                <hlm-select-trigger buttonId="crenewal">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="auto">Automática</hlm-select-item>
                  <hlm-select-item value="manual">Manual</hlm-select-item>
                  <hlm-select-item value="none">Sin renovación</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="csource">Origen</label>
              <hlm-select formControlName="source" [itemToString]="sourceToLabel">
                <hlm-select-trigger buttonId="csource">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="AVVALE_SOLD">Vendido por Avvale</hlm-select-item>
                  <hlm-select-item value="CUSTOMER_OWNED">Propiedad del cliente</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel class="flex items-center gap-2">
                <input type="checkbox" formControlName="isFavorite" />
                Marcar como favorito
              </label>
            </hlm-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Notas</h4>
          <hlm-field>
            <label hlmFieldLabel for="cnotes">Notas internas</label>
            <textarea id="cnotes" class="resize-none" hlmInput formControlName="notes" rows="3"></textarea>
          </hlm-field>
        </div>

        <hlm-dialog-footer>
          <button type="button" hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" hlmBtn>
            {{ contract() ? 'Guardar' : 'Crear' }}
          </button>
        </hlm-dialog-footer>
      </form>
    </hlm-dialog-content>
  `
})
export class ContractDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _customerService = inject(CustomerService)

  readonly contract = input<ContractDto | null>(null)
  readonly saved = output<ContractFormValue>()

  readonly customers = computed(() => this._customerService.customers.value()?.items ?? [])

  protected readonly contractTypeToLabel = (value: unknown): string =>
    CONTRACT_TYPE_LABELS[value as ContractTypeEnum] ?? ''
  protected readonly statusToLabel = (value: unknown): string =>
    CONTRACT_STATUS_LABELS[value as ContractStatusEnum] ?? ''
  protected readonly sourceToLabel = (value: unknown): string =>
    CONTRACT_SOURCE_LABELS[value as ContractSourceEnum] ?? ''
  protected readonly billingFrequencyToLabel = (value: unknown): string =>
    BILLING_FREQUENCY_LABELS[value as BillingFrequencyEnum] ?? ''
  protected readonly renewalTypeToLabel = (value: unknown): string =>
    RENEWAL_TYPE_LABELS[value as RenewalTypeEnum] ?? ''
  protected readonly customerIdToLabel = (value: unknown): string =>
    this.customers().find(item => item.id === value)?.name ?? ''

  readonly form = this._fb.nonNullable.group(
    {
      contractType: [ContractTypeEnum.CLOUD],
      contractNumber: ['', Validators.required],
      // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
      customerId: this._fb.control<string | null>(null, Validators.required),
      isFavorite: [false],
      status: [ContractStatusEnum.ACTIVE],
      source: [ContractSourceEnum.AVVALE_SOLD],
      startDate: ['', Validators.required],
      endDate: [''],
      currency: ['EUR'],
      billingFrequency: [BillingFrequencyEnum.YEARLY],
      renewalType: [RenewalTypeEnum.MANUAL],
      notes: ['']
    },
    { validators: dateRangeValidator }
  )

  constructor() {
    effect(() => {
      const contract = this.contract()
      if (contract) {
        this.form.patchValue({
          contractType: contract.contractType,
          contractNumber: contract.contractNumber ?? '',
          customerId: contract.customerId,
          isFavorite: contract.isFavorite,
          status: contract.status,
          source: contract.source,
          startDate: contract.startDate ?? '',
          endDate: contract.endDate ?? '',
          currency: contract.currency ?? '',
          billingFrequency: contract.billingFrequency,
          renewalType: contract.renewalType,
          notes: contract.notes ?? ''
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
      customerId: raw.customerId ?? '',
      customerName: this.customers().find(item => item.id === raw.customerId)?.name ?? '',
      endDate: raw.endDate || null
    })
    ctx.close()
  }
}
