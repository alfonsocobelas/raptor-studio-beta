import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { ProjectDto, ProjectImplementerEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'
import { CustomerService } from '../../../../../../core/services/customer.service'

const STATUS_OPTIONS: AppSelectOption[] = [
  { value: 'planning', label: 'Planificación' },
  { value: 'active', label: 'Activo' },
  { value: 'onhold', label: 'En pausa' },
  { value: 'closed', label: 'Cerrado' }
]

const IMPLEMENTER_OPTIONS: AppSelectOption[] = [
  { value: 'AVVALE', label: 'AVVALE' },
  { value: 'THIRD_PARTY', label: 'Tercero' }
]

export interface ProjectFormValue {
  customerId: string
  name: string
  description: string
  startDate: string
  endDate: string | null
  status: ProjectStatusEnum
  implementer: ProjectImplementerEnum
}

const dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate')?.value
  const end = group.get('endDate')?.value
  return start && end && end < start ? { dateRange: true } : null
}

@Component({
  selector: 'app-project-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="project() ? 'Editar proyecto' : 'Nuevo proyecto'"
      [description]="project() ? 'Modifica los datos del proyecto' : 'Introduce los datos del nuevo proyecto'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos generales</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Nombre" for="pname" class="sm:col-span-2">
              <input id="pname" appInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Descripción" for="pdesc" class="sm:col-span-2">
              <textarea id="pdesc" class="resize-none" appInput formControlName="description" rows="3"></textarea>
            </app-form-field>
            <app-form-field label="Cliente" for="pcustomer">
              <app-select
                formControlName="customerId"
                controlId="pcustomer"
                placeholder="Seleccionar cliente"
                [options]="customerIdOptions()"
              />
              @if (form.controls.customerId.touched && form.controls.customerId.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Estado" for="pstatus">
              <app-select formControlName="status" controlId="pstatus" placeholder="" [options]="statusOptions" />
            </app-form-field>
            <app-form-field label="Fecha inicio" for="pstart">
              <input id="pstart" type="date" appInput formControlName="startDate" />
              @if (form.controls.startDate.touched && form.controls.startDate.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Fecha fin" for="pend">
              <input id="pend" type="date" appInput formControlName="endDate" />
              <!-- dateRange es un error de grupo: se pinta a mano porque el control
                   endDate está válido y app-form-field solo mira su propio error. -->
              @if (form.errors?.['dateRange']) {
                <span class="text-destructive text-sm">La fecha fin debe ser posterior a la de inicio</span>
              }
            </app-form-field>
            <app-form-field label="Implementador" for="pimpl">
              <app-select
                formControlName="implementer"
                controlId="pimpl"
                placeholder=""
                [options]="implementerOptions"
              />
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ project() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class ProjectDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _customerService = inject(CustomerService)

  readonly project = input<ProjectDto | null>(null)
  readonly saved = output<ProjectFormValue>()
  readonly close = output<void>()

  readonly customers = computed(() => this._customerService.customers.value()?.items ?? [])
  protected readonly customerIdOptions = computed<AppSelectOption[]>(() =>
    this.customers().map(item => ({ value: item.id, label: item.name }))
  )

  protected readonly statusOptions = STATUS_OPTIONS
  protected readonly implementerOptions = IMPLEMENTER_OPTIONS

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
