import { DatePipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { lucidePencil, lucidePlus, lucideTrash2 } from '@ng-icons/lucide'
import { NgIcon } from '@ng-icons/core'
import { toast } from '@spartan-ng/brain/sonner'
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog'
import { HlmBadgeImports } from '@spartan-ng/helm/badge'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmSeparatorImports } from '@spartan-ng/helm/separator'
import { HlmTabsImports } from '@spartan-ng/helm/tabs'
import {
  ContactDto,
  ContractSourceEnum,
  ContractStatusEnum,
  CustomerSummaryDto,
  HealthStatusEnum,
  ProjectImplementerEnum,
  ProjectStatusEnum
} from '@sap-licenses/shared/domain'
import { KpiCardComponent } from '../../../../../../shared/components/kpi-card'
import { generateId } from '../../../../../../shared/utils/uuid'
import { AuthService } from '../../../../../../core/services/auth.service'
import { CustomerService } from '../../../../../../core/services/customer.service'
import { CustomerDetailService } from '../../../../../../core/services/customer-detail.service'
import { CustomerDialogComponent, CustomerFormValue } from './customer-dialog.component'
import { ContactDialogComponent, ContactFormValue } from './contact-dialog.component'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const MAX_CONTACTS = 20 // Disable add contact button when this limit is reached.

const CURRENCY_FMT = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
})

const CONTRACT_STATUS_BADGES: Record<string, { label: string; variant: BadgeVariant }> = {
  [ContractStatusEnum.ACTIVE]: { label: 'Activo', variant: 'default' },
  [ContractStatusEnum.EXPIRING]: { label: 'Por expirar', variant: 'outline' },
  [ContractStatusEnum.EXPIRED]: { label: 'Expirado', variant: 'secondary' },
  [ContractStatusEnum.TERMINATED]: { label: 'Terminado', variant: 'destructive' }
}

const CUSTOMER_TYPE_BADGES: Record<string, { label: string; variant: BadgeVariant }> = {
  cloud: { label: 'Cloud', variant: 'default' },
  onprem: { label: 'On-prem', variant: 'secondary' },
  hybrid: { label: 'Hybrid', variant: 'outline' }
}

const CONTRACT_SOURCE_BADGES: Record<string, { label: string; variant: BadgeVariant }> = {
  [ContractSourceEnum.AVVALE_SOLD]: { label: 'Avvale', variant: 'default' },
  [ContractSourceEnum.CUSTOMER_OWNED]: { label: 'Cliente', variant: 'secondary' }
}

const LICENSE_HEALTH_BADGES: Record<string, { label: string; variant: BadgeVariant }> = {
  [HealthStatusEnum.HEALTHY]: { label: 'Saludable', variant: 'default' },
  [HealthStatusEnum.UNDERUSED]: { label: 'Infrautilizada', variant: 'outline' },
  [HealthStatusEnum.OVERUSED]: { label: 'Sobreuso', variant: 'secondary' },
  [HealthStatusEnum.CONTRACTUAL_BREACH]: { label: 'Infracción', variant: 'destructive' }
}

// no tiene variante ghost).
const PROJECT_STATUS_BADGES: Record<string, { label: string; variant: BadgeVariant }> = {
  [ProjectStatusEnum.PLANNING]: { label: 'Planificación', variant: 'outline' },
  [ProjectStatusEnum.ACTIVE]: { label: 'Activo', variant: 'default' },
  [ProjectStatusEnum.ONHOLD]: { label: 'En pausa', variant: 'secondary' },
  [ProjectStatusEnum.CLOSED]: { label: 'Cerrado', variant: 'secondary' }
}

const PROJECT_IMPLEMENTER_BADGES: Record<string, { label: string; variant: BadgeVariant }> = {
  [ProjectImplementerEnum.AVVALE]: { label: 'AVVALE', variant: 'default' },
  [ProjectImplementerEnum.THIRD_PARTY]: { label: 'Tercero', variant: 'secondary' }
}

// Origen sync (spec 46): mismos labels/variantes que la tabla de proyectos.
const PROJECT_ORIGIN_BADGES: Record<string, { label: string; variant: BadgeVariant }> = {
  MANUAL: { label: 'Manual', variant: 'secondary' },
  ME_SAP: { label: 'SAP', variant: 'outline' }
}

function consumptionColor(pct: number): string {
  if (pct >= 100) {
    return 'text-destructive'
  }
  if (pct > 95) {
    return 'text-orange-600'
  }
  if (pct < 40) {
    return 'text-yellow-600'
  }
  return 'text-green-600'
}

@Component({
  selector: 'app-customer-detail',
  imports: [
    NgIcon,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmDialogImports,
    HlmAlertDialogImports,
    HlmSeparatorImports,
    HlmTabsImports,
    KpiCardComponent,
    CustomerDialogComponent,
    ContactDialogComponent,
    DatePipe
  ],
  providers: [provideIcons({ lucidePencil, lucidePlus, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-detail.component.html'
})
export class CustomerDetailComponent {
  private readonly _route = inject(ActivatedRoute)
  // El backend ya devuelve 403 a un viewer que escriba; ocultar evita ofrecer acciones imposibles.
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _router = inject(Router)
  private readonly _service = inject(CustomerDetailService)
  private readonly _customers = inject(CustomerService)

  // value() lanza si el resource está en error: hasValue() es la única lectura segura.
  readonly customer = computed(() => (this._service.customer.hasValue() ? this._service.customer.value() : undefined))
  readonly customerLoading = this._service.customer.isLoading
  // Un 404 significa "no existe", no "falló la carga": va al estado not-found, no al de error.
  readonly customerNotFound = computed(() => {
    const error = this._service.customer.error()
    return error instanceof HttpErrorResponse && error.status === 404
  })
  readonly customerLoadError = computed(() => this._service.customer.error() !== undefined && !this.customerNotFound())
  readonly customerTypeBadge = computed(() => {
    const customerType = this.customer()?.customerType
    return customerType ? CUSTOMER_TYPE_BADGES[customerType] : undefined
  })
  readonly contacts = computed(() => this.customer()?.contacts ?? [])
  readonly primaryContacts = computed(() => this.contacts().filter(contact => contact.isPrimary))
  readonly maxContactsReached = computed(() => this.contacts().length >= MAX_CONTACTS)

  // KPIs del summary del backend: '…' mientras carga, '—' si la API falla.
  readonly activeContractsCount = this.kpiValue(summary => summary.activeContracts)
  readonly licensesCount = this.kpiValue(summary => summary.licenses)
  readonly activeProjectsCount = this.kpiValue(summary => summary.activeProjects)
  // Sin módulo de alertas en v1: el KPI se queda a 0 hasta que exista.
  readonly activeAlertsCount = signal(0)

  readonly contractsLoading = computed(() => this._service.contracts.isLoading())
  readonly contractsError = computed(() => this._service.contracts.error())
  readonly customerContracts = computed(() => this._service.contracts.value()?.items ?? [])

  readonly licensesLoading = computed(() => this._service.licenses.isLoading())
  readonly licensesError = computed(() => this._service.licenses.error())
  readonly customerLicenses = computed(() => this._service.licenses.value()?.items ?? [])

  readonly projectsLoading = computed(() => this._service.projects.isLoading())
  readonly projectsError = computed(() => this._service.projects.error())
  readonly customerProjects = computed(() => this._service.projects.value()?.items ?? [])

  readonly dialogOpen = signal(false)

  // Gestion de contactos: alta/edicion comparten el mismo diálogo (editingContact null = alta);
  // el borrado se confirma con un alert-dialog (pendingDelete = contacto a eliminar).
  readonly contactDialogOpen = signal(false)
  readonly editingContact = signal<ContactDto | null>(null)
  readonly pendingDelete = signal<ContactDto | null>(null)

  constructor() {
    this._service.customerId.set(this._route.snapshot.paramMap.get('id') ?? undefined)
  }

  openEdit(): void {
    this.dialogOpen.set(true)
  }

  openAddContact(): void {
    this.editingContact.set(null)
    this.contactDialogOpen.set(true)
  }

  openEditContact(contact: ContactDto): void {
    this.editingContact.set(contact)
    this.contactDialogOpen.set(true)
  }

  async onContactSaved(value: ContactFormValue): Promise<void> {
    const customer = this.customer()
    const editing = this.editingContact()
    this.contactDialogOpen.set(false)
    if (!customer) {
      return
    }
    try {
      if (editing) {
        await this._service.updateContact(customer.id, editing.id, value)
      } else {
        // Id UUIDv7 acuñado en cliente (patron RegisterCustomerDto).
        await this._service.addContact(customer.id, { id: generateId(), ...value })
      }
      toast.success('Contacto guardado correctamente')
    } catch {
      toast.error('No se pudo guardar el contacto')
    }
  }

  requestDeleteContact(contact: ContactDto): void {
    this.pendingDelete.set(contact)
  }

  cancelDeleteContact(): void {
    this.pendingDelete.set(null)
  }

  async confirmDeleteContact(): Promise<void> {
    const customer = this.customer()
    const contact = this.pendingDelete()
    this.pendingDelete.set(null)
    if (!customer || !contact) {
      return
    }
    try {
      await this._service.removeContact(customer.id, contact.id)
      toast.success('Contacto eliminado correctamente')
    } catch {
      toast.error('No se pudo eliminar el contacto')
    }
  }

  private kpiValue(pick: (summary: CustomerSummaryDto) => number) {
    return computed<number | string>(() => {
      if (this._service.summary.isLoading()) {
        return '…'
      }
      const summary = this._service.summary.value()
      if (this._service.summary.error() || !summary) {
        return '—'
      }
      return pick(summary)
    })
  }

  async onSave(value: CustomerFormValue): Promise<void> {
    const current = this.customer()
    this.dialogOpen.set(false)
    if (!current) {
      return
    }
    try {
      await this._customers.update(current.id, value)
      toast.success('Cliente actualizado correctamente')
    } catch {
      toast.error('No se pudo actualizar el cliente')
    }
  }

  goToList(): void {
    this._router.navigate(['/sap-licensing/customers'])
  }

  openContract(id: string): void {
    this._router.navigate(['/sap-licensing/contracts', id])
  }

  formatCurrency(value: number): string {
    return CURRENCY_FMT.format(value)
  }

  contractStatusBadge(status: string): { label: string; variant: BadgeVariant } {
    return CONTRACT_STATUS_BADGES[status] ?? { label: status, variant: 'outline' }
  }

  contractSourceBadge(source: string): { label: string; variant: BadgeVariant } {
    return CONTRACT_SOURCE_BADGES[source] ?? { label: source, variant: 'outline' }
  }

  openLicense(id: string): void {
    this._router.navigate(['/sap-licensing/licenses', id])
  }

  licenseHealthBadge(health: string): { label: string; variant: BadgeVariant } {
    return LICENSE_HEALTH_BADGES[health] ?? { label: health, variant: 'outline' }
  }

  consumptionColor(pct: number): string {
    return consumptionColor(pct)
  }

  projectStatusBadge(status: string): { label: string; variant: BadgeVariant } {
    return PROJECT_STATUS_BADGES[status] ?? { label: status, variant: 'outline' }
  }

  projectImplementerBadge(implementer: string): { label: string; variant: BadgeVariant } {
    return PROJECT_IMPLEMENTER_BADGES[implementer] ?? { label: implementer, variant: 'outline' }
  }

  projectOriginBadge(origin: string): { label: string; variant: BadgeVariant } {
    return PROJECT_ORIGIN_BADGES[origin] ?? { label: origin, variant: 'outline' }
  }
}
