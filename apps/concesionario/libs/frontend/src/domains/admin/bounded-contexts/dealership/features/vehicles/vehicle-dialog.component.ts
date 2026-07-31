import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { VehicleDto } from '@app/shared/domain'

const FUEL_OPTIONS: AppSelectOption[] = [
  { value: 'gasoline', label: 'Gasolina' },
  { value: 'diesel', label: 'Diésel' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'electric', label: 'Eléctrico' }
]

const STATUS_OPTIONS: AppSelectOption[] = [
  { value: 'stock', label: 'En stock' },
  { value: 'reserved', label: 'Reservado' },
  { value: 'sold', label: 'Vendido' },
  { value: 'workshop', label: 'En taller' }
]

export interface VehicleFormValue {
  vin: string
  brand: string
  model: string
  version: string
  plate: string
  color: string
  fuel: string
  year: number
  mileage: number
  price: number
  status: string
  notes: string
}

@Component({
  selector: 'app-vehicle-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="vehicle() ? 'Editar vehículo' : 'Nuevo vehículo'"
      [description]="vehicle() ? 'Modifica los datos del vehículo' : 'Introduce los datos del nuevo vehículo'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos del vehículo</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Bastidor (VIN)" for="vvin">
              <input id="vvin" appInput formControlName="vin" />
              @if (form.controls.vin.touched && form.controls.vin.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Marca" for="vbrand">
              <input id="vbrand" appInput formControlName="brand" />
              @if (form.controls.brand.touched && form.controls.brand.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Modelo" for="vmodel">
              <input id="vmodel" appInput formControlName="model" />
              @if (form.controls.model.touched && form.controls.model.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Versión / acabado" for="vversion" class="sm:col-span-2">
              <input id="vversion" appInput formControlName="version" />
            </app-form-field>
            <app-form-field label="Matrícula" for="vplate">
              <input id="vplate" appInput formControlName="plate" />
            </app-form-field>
            <app-form-field label="Color" for="vcolor">
              <input id="vcolor" appInput formControlName="color" />
            </app-form-field>
            <app-form-field label="Combustible" for="vfuel">
              <app-select
                formControlName="fuel"
                controlId="vfuel"
                placeholder="Seleccionar combustible"
                [options]="fuelOptions"
              />
              @if (form.controls.fuel.touched && form.controls.fuel.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos comerciales</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Año" for="vyear">
              <input id="vyear" type="number" appInput formControlName="year" />
              @if (form.controls.year.touched && form.controls.year.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Kilómetros" for="vmileage">
              <input id="vmileage" type="number" appInput formControlName="mileage" />
              @if (form.controls.mileage.touched && form.controls.mileage.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Precio (€)" for="vprice">
              <input id="vprice" type="number" appInput formControlName="price" />
              @if (form.controls.price.touched && form.controls.price.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Estado" for="vstatus">
              <app-select
                formControlName="status"
                controlId="vstatus"
                placeholder="Seleccionar estado"
                [options]="statusOptions"
              />
              @if (form.controls.status.touched && form.controls.status.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Notas</h4>
          <app-form-field label="Notas internas" for="vnotes" class="sm:col-span-2">
            <textarea id="vnotes" class="resize-none" appInput formControlName="notes" rows="3"></textarea>
          </app-form-field>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ vehicle() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class VehicleDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly vehicle = input<VehicleDto | null>(null)
  readonly saved = output<VehicleFormValue>()
  readonly close = output<void>()

  protected readonly fuelOptions = FUEL_OPTIONS
  protected readonly statusOptions = STATUS_OPTIONS

  readonly form = this._fb.nonNullable.group({
    vin: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    version: [''],
    plate: [''],
    color: [''],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    fuel: this._fb.control<string | null>(null, Validators.required),
    year: this._fb.control<number | null>(null, Validators.required),
    mileage: this._fb.control<number | null>(null, Validators.required),
    price: this._fb.control<number | null>(null, Validators.required),
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    status: this._fb.control<string | null>(null, Validators.required),
    notes: ['']
  })

  constructor() {
    effect(() => {
      const vehicle = this.vehicle()
      if (vehicle) {
        this.form.patchValue({
          vin: vehicle.vin,
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.version ?? '',
          plate: vehicle.plate ?? '',
          color: vehicle.color ?? '',
          fuel: vehicle.fuel ?? null,
          year: vehicle.year,
          mileage: vehicle.mileage,
          price: vehicle.price,
          status: vehicle.status ?? null,
          notes: vehicle.notes ?? ''
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
      fuel: raw.fuel as string,
      status: raw.status as string,
      year: raw.year as number,
      mileage: raw.mileage as number,
      price: raw.price as number
    })
    this.close.emit()
  }
}
