import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { AppLookup } from '../../../../../../shared/components/ui/lookup'
import { NotificationService } from '../../../../../../shared/components/ui/notification.service'
import { AuthService } from '../../../../../../core/services/auth.service'
import { generateId } from '../../../../../../shared/utils/uuid'
import { ProjectImplementerEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'
import { ProjectService } from '../../../../../../core/services/project.service'
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

const dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate')?.value
  const end = group.get('endDate')?.value
  return start && end && end < start ? { dateRange: true } : null
}

/**
 * Página-formulario de Proyectos (spec 48): el mismo formulario del diálogo,
 * como página con ruta propia. Convive con el diálogo del listado; al guardar
 * navega al listado. Con :id en la ruta carga el registro y funciona como edición.
 */
@Component({
  selector: 'app-project-form-page',
  imports: [ReactiveFormsModule, AppButton, AppFormField, AppInput, AppSelect, AppLookup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-2xl">
      <h1 class="text-2xl font-bold">{{ editingId() ? 'Editar proyecto' : 'Nuevo proyecto' }}</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        {{ editingId() ? 'Modifica los datos del proyecto' : 'Introduce los datos del nuevo proyecto' }}
      </p>

      @if (loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando proyectos…</p>
      } @else if (notFound()) {
        <p class="text-muted-foreground py-12 text-center text-sm">No se encontró el registro solicitado.</p>
      } @else if (canWrite()) {
        <form class="space-y-6 py-6" [formGroup]="form" (ngSubmit)="save()">
          <div>
            <h4 class="app-panel-head mb-3 text-sm font-semibold">Datos generales</h4>
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
                <app-lookup
                  formControlName="customerId"
                  controlId="pcustomer"
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

          <div class="app-toolbar flex justify-end gap-2 pt-2">
            <button type="button" appBtn variant="outline" (click)="cancel()">Cancelar</button>
            <button type="submit" [disabled]="form.invalid" appBtn>{{ editingId() ? 'Guardar' : 'Crear' }}</button>
          </div>
        </form>
      } @else {
        <p class="text-muted-foreground mt-6 rounded-md border p-4 text-sm">Tu rol no permite crear registros aquí.</p>
      }
    </section>
  `
})
export class ProjectFormPageComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _service = inject(ProjectService)
  private readonly _router = inject(Router)
  private readonly _notify = inject(NotificationService)
  protected readonly canWrite = inject(AuthService).canWrite
  private readonly _customerService = inject(CustomerService)

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

  private readonly _route = inject(ActivatedRoute)
  protected readonly editingId = signal<string | null>(null)
  // spec 78: versión leída del registro en edición; viaja con el update
  protected readonly editingVersion = signal<number>(1)
  protected readonly loading = signal(false)
  protected readonly notFound = signal(false)

  constructor() {
    this.onCustomerIdSearch('')
    const id = this._route.snapshot.paramMap.get('id')
    if (id) {
      this.editingId.set(id)
      void this.load(id)
    }
  }

  async load(id: string): Promise<void> {
    this.loading.set(true)
    try {
      const project = await this._service.findOne(id)
      this.editingVersion.set(project.version)
      this.form.patchValue({
        customerId: project.customerId,
        name: project.name,
        description: project.description ?? '',
        startDate: project.startDate ?? '',
        endDate: project.endDate ?? '',
        status: project.status,
        implementer: project.implementer
      })
      // spec 66: la etiqueta del referenciado vigente, aunque no esté entre los 20 buscados
      void this._customerService
        .findOne(project.customerId)
        .then(item =>
          this.customerIdOptions.update(options =>
            options.some(option => option.value === item.id)
              ? options
              : [{ value: item.id, label: item.name }, ...options]
          )
        )
    } catch {
      this.notFound.set(true)
    } finally {
      this.loading.set(false)
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      return
    }
    const raw = this.form.getRawValue()
    const value = {
      ...raw,
      customerId: raw.customerId ?? '',
      endDate: raw.endDate || null
    }
    const id = this.editingId()
    try {
      if (id) {
        await this._service.update(id, { ...value, version: this.editingVersion() })
        this._notify.success('Proyecto actualizado correctamente')
      } else {
        await this._service.create({ id: generateId(), ...value })
        this._notify.success('Proyecto creado correctamente')
      }
      void this._router.navigate(['/sap-licensing/projects'])
    } catch {
      this._notify.error(id ? 'No se pudo actualizar el proyecto' : 'No se pudo crear el proyecto')
    }
  }

  cancel(): void {
    void this._router.navigate(['/sap-licensing/projects'])
  }
}
