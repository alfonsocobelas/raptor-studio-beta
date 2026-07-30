import { DatePipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowLeft, lucideEye } from '@ng-icons/lucide'
import { HlmBadgeImports } from '@spartan-ng/helm/badge'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { HlmSeparatorImports } from '@spartan-ng/helm/separator'
import { ContractDetailService } from '../../../../../../core/services/contract-detail.service'
import { ColumnDef, DataTable } from '../../../../../../shared/components/data-table'
import { BILLING_FREQUENCY_LABELS, RENEWAL_TYPE_LABELS } from './contract-labels'

const CURRENCY_FMT = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
})

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  expiring: 'Por expirar',
  expired: 'Expirado',
  terminated: 'Terminado'
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  expiring: 'outline',
  expired: 'secondary',
  terminated: 'destructive'
}

const TYPE_LABELS: Record<string, string> = {
  cloud: 'Cloud',
  onprem: 'On-premise',
  mixed: 'Mixto',
  maintenance: 'Mantenimiento'
}

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  cloud: 'default',
  onprem: 'secondary',
  mixed: 'outline',
  maintenance: 'outline'
}

@Component({
  selector: 'app-contract-detail',
  imports: [DatePipe, NgIcon, DataTable, HlmBadgeImports, HlmButtonImports, HlmCardImports, HlmSeparatorImports],
  providers: [provideIcons({ lucideArrowLeft, lucideEye })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contract-detail.component.html'
})
export class ContractDetailComponent {
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _service = inject(ContractDetailService)

  // value() lanza si el resource está en error: hasValue() es la única lectura segura.
  readonly contract = computed(() => (this._service.contract.hasValue() ? this._service.contract.value() : undefined))
  readonly loading = this._service.contract.isLoading
  // Un 404 significa "no existe", no "falló la carga": va al estado not-found, no al de error.
  readonly notFound = computed(() => {
    const error = this._service.contract.error()
    return error instanceof HttpErrorResponse && error.status === 404
  })
  readonly loadError = computed(() => this._service.contract.error() !== undefined && !this.notFound())

  readonly licensesLoading = computed(() => this._service.licenses.isLoading())
  readonly licensesError = computed(() => this._service.licenses.error())
  readonly contractLicenses = computed(
    () => (this._service.licenses.value()?.items ?? []) as unknown as Record<string, unknown>[]
  )

  readonly licenseActions = [{ icon: 'lucideEye', label: 'Ver detalle', action: 'view' }]

  // Mismas columnas que el prototipo (Solución, Métrica, Unidades, Precio/ud., Estado).
  readonly licenseColumns: ColumnDef[] = [
    { key: 'solutionName', label: 'Solución', minWidth: 200 },
    { key: 'metric', label: 'Métrica', minWidth: 100 },
    { key: 'licensedUnits', label: 'Unidades', type: 'number', minWidth: 120 },
    { key: 'pricePerUnit', label: 'Precio/ud.', type: 'number', minWidth: 120 },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      minWidth: 110,
      badgeMap: {
        active: { label: 'Activa', variant: 'default' },
        suspended: { label: 'Suspendida', variant: 'outline' },
        expired: { label: 'Expirada', variant: 'secondary' }
      }
    }
  ]

  readonly billingFrequencyLabels = BILLING_FREQUENCY_LABELS
  readonly renewalTypeLabels = RENEWAL_TYPE_LABELS

  constructor() {
    this._service.contractId.set(this._route.snapshot.paramMap.get('id') ?? undefined)
  }

  formatCurrency(value: number): string {
    return CURRENCY_FMT.format(value)
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status
  }

  statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    return STATUS_VARIANTS[status] ?? 'secondary'
  }

  typeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type
  }

  typeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    return TYPE_VARIANTS[type] ?? 'secondary'
  }

  onLicenseAction(event: { action: string; row: Record<string, unknown> }): void {
    if (event.action === 'view') {
      this._router.navigate(['/sap-licensing/licenses', event.row['id']])
    }
  }

  navigateToCustomer(customerId: string): void {
    this._router.navigate(['/sap-licensing/customers', customerId])
  }

  goBack(): void {
    this._router.navigate(['/sap-licensing/contracts'])
  }
}
