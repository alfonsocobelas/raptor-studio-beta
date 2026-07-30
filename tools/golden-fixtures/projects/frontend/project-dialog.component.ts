import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { HlmBadgeImports } from '@spartan-ng/helm/badge'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { ProjectDto, ProjectImplementerEnum, ProjectOriginEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'
import { CustomerService } from '../../../../../../core/services/customer.service'

export interface ProjectFormValue {
  customerId: string
  customerName: string
  name: string
  description: string
  startDate: string
  endDate: string | null
  status: ProjectStatusEnum
  implementer: ProjectImplementerEnum
}

const PROJECT_STATUS_LABELS: Record<ProjectStatusEnum, string> = {
  [ProjectStatusEnum.PLANNING]: 'Planificación',
  [ProjectStatusEnum.ACTIVE]: 'Activo',
  [ProjectStatusEnum.ONHOLD]: 'En pausa',
  [ProjectStatusEnum.CLOSED]: 'Cerrado'
}

const PROJECT_IMPLEMENTER_LABELS: Record<ProjectImplementerEnum, string> = {
  [ProjectImplementerEnum.AVVALE]: 'AVVALE',
  [ProjectImplementerEnum.THIRD_PARTY]: 'Tercero'
}

const dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate')?.value
  const end = group.get('endDate')?.value
  return start && end && end < start ? { dateRange: true } : null
}

@Component({
  selector: 'app-project-dialog',
  imports: [
    ReactiveFormsModule,
    HlmDialogImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports
  ],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-content *hlmDialogPortal="let ctx" class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <hlm-dialog-header>
        <h3 hlmDialogTitle>
          {{ project() ? 'Editar proyecto' : 'Nuevo proyecto' }}
          @if (isMeSap()) {
            <span class="ml-2 align-middle" variant="outline" hlmBadge>SAP</span>
          }
        </h3>
        <p hlmDialogDescription>
          {{ project() ? 'Modifica los datos del proyecto' : 'Introduce los datos del nuevo proyecto' }}
        </p>
      </hlm-dialog-header>
      @if (isMeSap()) {
        <div class="bg-muted/50 rounded-md p-4" data-testid="sap-info">
          <h4 class="mb-3 text-sm font-semibold">Datos SAP</h4>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            @for (item of sapInfo(); track item.label) {
              <div>
                <dt class="text-muted-foreground">{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            }
          </dl>
        </div>
      }
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save(ctx)">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos generales</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field class="sm:col-span-2">
              <label hlmFieldLabel for="pname">Nombre</label>
              <input id="pname" hlmInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field class="sm:col-span-2">
              <label hlmFieldLabel for="pdesc">Descripción</label>
              <textarea id="pdesc" class="resize-none" hlmInput formControlName="description" rows="3"></textarea>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="pcustomer">Cliente</label>
              <hlm-select formControlName="customerId" [itemToString]="customerToLabel">
                <hlm-select-trigger buttonId="pcustomer">
                  <hlm-select-value placeholder="Seleccionar cliente" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal showScroll>
                  @for (c of customers(); track c.id) {
                    <hlm-select-item [value]="c.id">{{ c.name }}</hlm-select-item>
                  }
                </hlm-select-content>
              </hlm-select>
              @if (form.controls.customerId.touched && form.controls.customerId.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="pstatus">Estado</label>
              <hlm-select formControlName="status" [itemToString]="statusToLabel">
                <hlm-select-trigger buttonId="pstatus">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="planning">Planificación</hlm-select-item>
                  <hlm-select-item value="active">Activo</hlm-select-item>
                  <hlm-select-item value="onhold">En pausa</hlm-select-item>
                  <hlm-select-item value="closed">Cerrado</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="pstart">Fecha inicio</label>
              <input id="pstart" type="date" hlmInput formControlName="startDate" />
              @if (form.controls.startDate.touched && form.controls.startDate.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="pend">Fecha fin</label>
              <input id="pend" type="date" hlmInput formControlName="endDate" />
              @if (form.errors?.['dateRange']) {
                <hlm-field-error>La fecha fin debe ser posterior a la de inicio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="pimpl">Implementador</label>
              <hlm-select formControlName="implementer" [itemToString]="implementerToLabel">
                <hlm-select-trigger buttonId="pimpl">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="AVVALE">AVVALE</hlm-select-item>
                  <hlm-select-item value="THIRD_PARTY">Tercero</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>
          </div>
        </div>

        <hlm-dialog-footer>
          <button type="button" hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" hlmBtn>
            {{ project() ? 'Guardar' : 'Crear' }}
          </button>
        </hlm-dialog-footer>
      </form>
    </hlm-dialog-content>
  `
})
export class ProjectDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _customerService = inject(CustomerService)
  private readonly _datePipe = inject(DatePipe)

  readonly project = input<ProjectDto | null>(null)
  readonly saved = output<ProjectFormValue>()

  readonly customers = computed(() => this._customerService.customers.value()?.items ?? [])

  // itemToString: con el popover cerrado los items no están instanciados y el trigger
  // mostraría el valor crudo del control en vez de su etiqueta de presentación.
  protected readonly statusToLabel = (value: unknown): string => PROJECT_STATUS_LABELS[value as ProjectStatusEnum] ?? ''
  protected readonly implementerToLabel = (value: unknown): string =>
    PROJECT_IMPLEMENTER_LABELS[value as ProjectImplementerEnum] ?? ''
  protected readonly customerToLabel = (value: unknown): string =>
    this.customers().find(c => c.id === value)?.name ?? ''

  readonly isMeSap = computed(() => this.project()?.origin === ProjectOriginEnum.ME_SAP)

  // Datos SAP de solo lectura (spec 46): crudos del feed, con guion para lo nunca observado.
  readonly sapInfo = computed(() => {
    const project = this.project()
    if (!project) {
      return []
    }
    const dash = (value: string | number | null): string => (value === null ? '—' : String(value))
    return [
      {
        label: 'Go-live planificado',
        value: project.planToGoLive ? (this._datePipe.transform(project.planToGoLive, 'dd-MM-yyyy') ?? '—') : '—'
      },
      { label: 'Nº de waves', value: dash(project.nbrOfWaves) },
      { label: 'Fase de la wave', value: dash(project.waveStage) },
      { label: 'Estado de la wave', value: dash(project.waveStatus) },
      { label: 'En riesgo', value: dash(project.atRisk) },
      { label: 'En escalación', value: dash(project.inEscalation) }
    ]
  })

  readonly form = this._fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
      customerId: this._fb.control<string | null>(null, Validators.required),
      startDate: ['', Validators.required],
      endDate: [''],
      status: [ProjectStatusEnum.PLANNING],
      implementer: [ProjectImplementerEnum.AVVALE]
    },
    { validators: dateRangeValidator }
  )

  constructor() {
    effect(() => {
      const project = this.project()
      if (project) {
        this.patchFromProject(project)
      }
      if (this.isMeSap()) {
        this.disableSyncGovernedControls()
      }
    })
  }

  // Campos sync-gobernados (spec 46): solo el sync los escribe en un ME_SAP — el backend los
  // rechaza con 422, así que el formulario ni los ofrece. description/implementer siguen libres.
  private disableSyncGovernedControls(): void {
    for (const control of [
      this.form.controls.name,
      this.form.controls.customerId,
      this.form.controls.status,
      this.form.controls.startDate,
      this.form.controls.endDate
    ]) {
      control.disable()
    }
  }

  patchFromProject(project: ProjectDto): void {
    this.form.patchValue({
      name: project.name,
      description: project.description,
      customerId: project.customerId,
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      status: project.status,
      implementer: project.implementer
    })
  }

  save(ctx: { close: () => void }): void {
    if (this.form.invalid) {
      return
    }
    const raw = this.form.getRawValue()
    const customerName = this.customers().find(c => c.id === raw.customerId)?.name ?? ''
    this.saved.emit({
      ...raw,
      customerId: raw.customerId ?? '',
      customerName,
      startDate: raw.startDate,
      endDate: raw.endDate || null
    })
    ctx.close()
  }
}
