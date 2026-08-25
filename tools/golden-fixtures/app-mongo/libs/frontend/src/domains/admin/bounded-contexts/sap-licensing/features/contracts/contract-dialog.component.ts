import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core'
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { AppLookup } from '../../../../../../shared/components/ui/lookup'
import {
  BillingFrequencyEnum,
  ContractDto,
  ContractSourceEnum,
  ContractTypeEnum,
  RenewalTypeEnum
} from '@app/shared/domain'
import { CustomerService } from '../../../../../../core/services/customer.service'
import {
  BILLING_FREQUENCY_LABELS,
  CONTRACT_SOURCE_LABELS,
  CONTRACT_TYPE_LABELS,
  RENEWAL_TYPE_LABELS
} from './contract-labels'

const CONTRACT_TYPE_OPTIONS: AppSelectOption[] = [
  { value: 'cloud', label: 'Cloud' },
  { value: 'onprem', label: 'On-premise' }
]

const SOURCE_OPTIONS: AppSelectOption[] = [
  { value: 'AVVALE_SOLD', label: 'Vendido por Avvale' },
  { value: 'CUSTOMER_OWNED', label: 'Propiedad del cliente' }
]

const BILLING_FREQUENCY_OPTIONS: AppSelectOption[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'yearly', label: 'Anual' }
]

const RENEWAL_TYPE_OPTIONS: AppSelectOption[] = [
  { value: 'auto', label: 'Automática' },
  { value: 'manual', label: 'Manual' },
  { value: 'none', label: 'Sin renovación' }
]

export interface ContractFormValue {
  contractType: ContractTypeEnum
  contractNumber: string
  customerId: string
  isFavorite: boolean
  source: ContractSourceEnum
  startDate: string
  endDate: string | null
  currency: string
  billingFrequency: BillingFrequencyEnum
  renewalType: RenewalTypeEnum
  notes: string
}

const dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate')?.value
  const end = group.get('endDate')?.value
  return start && end && end < start ? { dateRange: true } : null
}

@Component({
  selector: 'app-contract-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect, AppLookup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="contract() ? 'Editar contrato' : 'Nuevo contrato'"
      [description]="contract() ? 'Modifica los datos del contrato' : 'Introduce los datos del nuevo contrato'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos del contrato</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Nº Contrato" for="cnum">
              <input id="cnum" appInput formControlName="contractNumber" />
              @if (form.controls.contractNumber.touched && form.controls.contractNumber.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Tipo" for="ctype">
              <app-select
                formControlName="contractType"
                controlId="ctype"
                placeholder=""
                [options]="contractTypeOptions"
              />
            </app-form-field>
            <app-form-field label="Cliente" for="ccust">
              <app-lookup
                formControlName="customerId"
                controlId="ccust"
                placeholder="Seleccionar cliente"
                [options]="customerIdOptions()"
                [hasMore]="customerIdHasMore()"
                (searchChange)="onCustomerIdSearch($event)"
                (loadMore)="onCustomerIdMore()"
              />
              @if (form.controls.customerId.touched && form.controls.customerId.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Fecha inicio" for="cstart">
              <input id="cstart" type="date" appInput formControlName="startDate" />
              @if (form.controls.startDate.touched && form.controls.startDate.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Fecha fin" for="cend">
              <input id="cend" type="date" appInput formControlName="endDate" />
              <!-- dateRange es un error de grupo: se pinta a mano porque el control
                   endDate está válido y app-form-field solo mira su propio error. -->
              @if (form.errors?.['dateRange']) {
                <span class="text-destructive text-sm">La fecha fin debe ser posterior a la de inicio</span>
              }
            </app-form-field>
            <app-form-field label="Moneda" for="ccurrency">
              <input id="ccurrency" appInput formControlName="currency" />
            </app-form-field>
            <app-form-field label="Facturación" for="cbilling">
              <app-select
                formControlName="billingFrequency"
                controlId="cbilling"
                placeholder=""
                [options]="billingFrequencyOptions"
              />
            </app-form-field>
            <app-form-field label="Renovación" for="crenewal">
              <app-select
                formControlName="renewalType"
                controlId="crenewal"
                placeholder=""
                [options]="renewalTypeOptions"
              />
            </app-form-field>
            <app-form-field label="Origen" for="csource">
              <app-select formControlName="source" controlId="csource" placeholder="" [options]="sourceOptions" />
            </app-form-field>
            <app-form-field label="Marcar como favorito" for="cisFavorite">
              <label class="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" formControlName="isFavorite" />
                Marcar como favorito
              </label>
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
            {{ contract() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class ContractDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _customerService = inject(CustomerService)

  readonly contract = input<ContractDto | null>(null)
  /** Precarga del alta (spec 64): quien abre el diálogo puede fijar campos (p. ej. la fecha del calendario). */
  readonly initialValue = input<Partial<ContractFormValue> | null>(null)
  readonly saved = output<ContractFormValue>()
  readonly close = output<void>()

  readonly customerIdOptions = signal<AppSelectOption[]>([])
  readonly customerIdHasMore = signal(false)
  private _customerIdTerm = ''
  private _customerIdPage = 1
  onCustomerIdSearch(term: string): void {
    this._customerIdTerm = term
    this._customerIdPage = 1
    void this._customerService.lookup(term).then(result => {
      this.customerIdOptions.set(result.items.map(item => ({ value: item.id, label: item.name })))
      this.customerIdHasMore.set(result.hasMore)
    })
  }
  onCustomerIdMore(): void {
    this._customerIdPage += 1
    void this._customerService.lookup(this._customerIdTerm, this._customerIdPage).then(result => {
      this.customerIdOptions.update(options => [
        ...options,
        ...result.items.map(item => ({ value: item.id, label: item.name }))
      ])
      this.customerIdHasMore.set(result.hasMore)
    })
  }

  protected readonly contractTypeOptions = CONTRACT_TYPE_OPTIONS
  protected readonly sourceOptions = SOURCE_OPTIONS
  protected readonly billingFrequencyOptions = BILLING_FREQUENCY_OPTIONS
  protected readonly renewalTypeOptions = RENEWAL_TYPE_OPTIONS

  readonly form = this._fb.nonNullable.group(
    {
      contractType: [ContractTypeEnum.CLOUD],
      contractNumber: ['', Validators.required],
      // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
      customerId: this._fb.control<string | null>(null, Validators.required),
      isFavorite: [false],
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
    this.onCustomerIdSearch('')
    effect(() => {
      const contract = this.contract()
      if (contract) {
        this.form.patchValue({
          contractType: contract.contractType,
          contractNumber: contract.contractNumber ?? '',
          customerId: contract.customerId,
          isFavorite: contract.isFavorite,
          source: contract.source,
          startDate: contract.startDate ?? '',
          endDate: contract.endDate ?? '',
          currency: contract.currency ?? '',
          billingFrequency: contract.billingFrequency,
          renewalType: contract.renewalType,
          notes: contract.notes ?? ''
        })
        // spec 66: la etiqueta del referenciado vigente, aunque no esté entre los 20 buscados
        void this._customerService
          .findOne(contract.customerId)
          .then(item =>
            this.customerIdOptions.update(options =>
              options.some(option => option.value === item.id)
                ? options
                : [{ value: item.id, label: item.name }, ...options]
            )
          )
        return
      }
      const initial = this.initialValue()
      if (initial) {
        this.form.patchValue(initial)
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
      customerId: raw.customerId ?? '',
      endDate: raw.endDate || null
    })
    this.close.emit()
  }
}
