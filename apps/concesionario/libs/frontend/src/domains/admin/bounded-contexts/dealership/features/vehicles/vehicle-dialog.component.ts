import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { VehicleDto } from '@app/shared/domain'

const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Gasolina',
  diesel: 'Diésel',
  hybrid: 'Híbrido',
  electric: 'Eléctrico'
}

const STATUS_LABELS: Record<string, string> = {
  stock: 'En stock',
  reserved: 'Reservado',
  sold: 'Vendido',
  workshop: 'En taller'
}

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
        <h3 hlmDialogTitle>{{ vehicle() ? 'Editar vehículo' : 'Nuevo vehículo' }}</h3>
        <p hlmDialogDescription>
          {{ vehicle() ? 'Modifica los datos del vehículo' : 'Introduce los datos del nuevo vehículo' }}
        </p>
      </hlm-dialog-header>
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save(ctx)">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos del vehículo</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field>
              <label hlmFieldLabel for="vvin">Bastidor (VIN)</label>
              <input id="vvin" hlmInput formControlName="vin" />
              @if (form.controls.vin.touched && form.controls.vin.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vbrand">Marca</label>
              <input id="vbrand" hlmInput formControlName="brand" />
              @if (form.controls.brand.touched && form.controls.brand.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vmodel">Modelo</label>
              <input id="vmodel" hlmInput formControlName="model" />
              @if (form.controls.model.touched && form.controls.model.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field class="sm:col-span-2">
              <label hlmFieldLabel for="vversion">Versión / acabado</label>
              <input id="vversion" hlmInput formControlName="version" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vplate">Matrícula</label>
              <input id="vplate" hlmInput formControlName="plate" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vcolor">Color</label>
              <input id="vcolor" hlmInput formControlName="color" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vfuel">Combustible</label>
              <hlm-select formControlName="fuel" [itemToString]="fuelToLabel">
                <hlm-select-trigger buttonId="vfuel">
                  <hlm-select-value placeholder="Seleccionar combustible" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="gasoline">Gasolina</hlm-select-item>
                  <hlm-select-item value="diesel">Diésel</hlm-select-item>
                  <hlm-select-item value="hybrid">Híbrido</hlm-select-item>
                  <hlm-select-item value="electric">Eléctrico</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
              <hlm-field-error>Obligatorio</hlm-field-error>
            </hlm-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos comerciales</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field>
              <label hlmFieldLabel for="vyear">Año</label>
              <input id="vyear" type="number" hlmInput formControlName="year" />
              @if (form.controls.year.touched && form.controls.year.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vmileage">Kilómetros</label>
              <input id="vmileage" type="number" hlmInput formControlName="mileage" />
              @if (form.controls.mileage.touched && form.controls.mileage.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vprice">Precio (€)</label>
              <input id="vprice" type="number" hlmInput formControlName="price" />
              @if (form.controls.price.touched && form.controls.price.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="vstatus">Estado</label>
              <hlm-select formControlName="status" [itemToString]="statusToLabel">
                <hlm-select-trigger buttonId="vstatus">
                  <hlm-select-value placeholder="Seleccionar estado" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="stock">En stock</hlm-select-item>
                  <hlm-select-item value="reserved">Reservado</hlm-select-item>
                  <hlm-select-item value="sold">Vendido</hlm-select-item>
                  <hlm-select-item value="workshop">En taller</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
              <hlm-field-error>Obligatorio</hlm-field-error>
            </hlm-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Notas</h4>
          <hlm-field class="sm:col-span-2">
            <label hlmFieldLabel for="vnotes">Notas internas</label>
            <textarea id="vnotes" class="resize-none" hlmInput formControlName="notes" rows="3"></textarea>
          </hlm-field>
        </div>

        <hlm-dialog-footer>
          <button type="button" hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" hlmBtn>
            {{ vehicle() ? 'Guardar' : 'Crear' }}
          </button>
        </hlm-dialog-footer>
      </form>
    </hlm-dialog-content>
  `
})
export class VehicleDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly vehicle = input<VehicleDto | null>(null)
  readonly saved = output<VehicleFormValue>()

  protected readonly fuelToLabel = (value: unknown): string => FUEL_LABELS[String(value)] ?? ''
  protected readonly statusToLabel = (value: unknown): string => STATUS_LABELS[String(value)] ?? ''

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

  save(ctx: { close: () => void }): void {
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
    ctx.close()
  }
}
