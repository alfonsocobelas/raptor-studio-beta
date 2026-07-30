import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { ProjectDto, ProjectImplementerEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'
import { CustomerService } from '../../../../../../core/services/customer.service'

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planificación',
  active: 'Activo',
  onhold: 'En pausa',
  closed: 'Cerrado'
}

const IMPLEMENTER_LABELS: Record<string, string> = {
  AVVALE: 'AVVALE',
  THIRD_PARTY: 'Tercero'
}

export interface ProjectFormValue {
  customerId: string
  name: string
  description: string
  startDate: string
  endDate: string | null
  status: ProjectStatusEnum
  implementer: ProjectImplementerEnum
  customerName: string
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
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-content *hlmDialogPortal="let ctx" class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <hlm-dialog-header>
        <h3 hlmDialogTitle>{{ project() ? 'Editar proyecto' : 'Nuevo proyecto' }}</h3>
        <p hlmDialogDescription>
          {{ project() ? 'Modifica los datos del proyecto' : 'Introduce los datos del nuevo proyecto' }}
        </p>
      </hlm-dialog-header>
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
              <hlm-select formControlName="customerId" [itemToString]="customerIdToLabel">
                <hlm-select-trigger buttonId="pcustomer">
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
              <!-- forceShow: dateRange es un error de grupo; sin él, hlm-field-error se oculta porque
                   el control endDate está válido (solo mira los errores de su propio control). -->
              @if (form.errors?.['dateRange']) {
                <hlm-field-error forceShow>La fecha fin debe ser posterior a la de inicio</hlm-field-error>
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

  readonly project = input<ProjectDto | null>(null)
  readonly saved = output<ProjectFormValue>()

  readonly customers = computed(() => this._customerService.customers.value()?.items ?? [])

  protected readonly statusToLabel = (value: unknown): string => STATUS_LABELS[value as ProjectStatusEnum] ?? ''
  protected readonly implementerToLabel = (value: unknown): string =>
    IMPLEMENTER_LABELS[value as ProjectImplementerEnum] ?? ''
  protected readonly customerIdToLabel = (value: unknown): string =>
    this.customers().find(item => item.id === value)?.name ?? ''

  readonly form = this._fb.nonNullable.group(
    {
      // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
      customerId: this._fb.control<string | null>(null, Validators.required),
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
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
        this.form.patchValue({
          customerId: project.customerId,
          name: project.name,
          description: project.description ?? '',
          startDate: project.startDate ?? '',
          endDate: project.endDate ?? '',
          status: project.status,
          implementer: project.implementer
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
