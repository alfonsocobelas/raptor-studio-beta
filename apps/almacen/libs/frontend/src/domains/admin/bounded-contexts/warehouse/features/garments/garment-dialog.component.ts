import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { GarmentDto } from '@app/shared/domain'

const CATEGORY_OPTIONS: AppSelectOption[] = [
  { value: 'tshirt', label: 'Camisetas' },
  { value: 'trousers', label: 'Pantalones' },
  { value: 'dress', label: 'Vestidos' },
  { value: 'jacket', label: 'Abrigos' },
  { value: 'accessory', label: 'Accesorios' }
]

const SIZE_OPTIONS: AppSelectOption[] = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'unique', label: 'Única' }
]

const STATUS_OPTIONS: AppSelectOption[] = [
  { value: 'active', label: 'Activa' },
  { value: 'discontinued', label: 'Descatalogada' }
]

export interface GarmentFormValue {
  sku: string
  name: string
  category: string
  size: string
  brand: string
  color: string
  price: number
  stock: number
  status: string
}

@Component({
  selector: 'app-garment-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="garment() ? 'Editar prenda' : 'Nueva prenda'"
      [description]="garment() ? 'Modifica los datos de la prenda' : 'Introduce los datos de la nueva prenda'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de la prenda</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="SKU" for="gsku">
              <input id="gsku" appInput formControlName="sku" />
              @if (form.controls.sku.touched && form.controls.sku.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Nombre" for="gname" class="sm:col-span-2">
              <input id="gname" appInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Categoría" for="gcategory">
              <app-select
                formControlName="category"
                controlId="gcategory"
                placeholder="Seleccionar categoría"
                [options]="categoryOptions"
              />
              @if (form.controls.category.touched && form.controls.category.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Talla" for="gsize">
              <app-select
                formControlName="size"
                controlId="gsize"
                placeholder="Seleccionar talla"
                [options]="sizeOptions"
              />
              @if (form.controls.size.touched && form.controls.size.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Marca" for="gbrand">
              <input id="gbrand" appInput formControlName="brand" />
            </app-form-field>
            <app-form-field label="Color" for="gcolor">
              <input id="gcolor" appInput formControlName="color" />
            </app-form-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Stock y precio</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Precio (€)" for="gprice">
              <input id="gprice" type="number" appInput formControlName="price" />
              @if (form.controls.price.touched && form.controls.price.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Unidades en stock" for="gstock">
              <input id="gstock" type="number" appInput formControlName="stock" />
              @if (form.controls.stock.touched && form.controls.stock.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Estado" for="gstatus">
              <app-select
                formControlName="status"
                controlId="gstatus"
                placeholder="Seleccionar estado"
                [options]="statusOptions"
              />
              @if (form.controls.status.touched && form.controls.status.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ garment() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class GarmentDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly garment = input<GarmentDto | null>(null)
  readonly saved = output<GarmentFormValue>()
  readonly close = output<void>()

  protected readonly categoryOptions = CATEGORY_OPTIONS
  protected readonly sizeOptions = SIZE_OPTIONS
  protected readonly statusOptions = STATUS_OPTIONS

  readonly form = this._fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    category: this._fb.control<string | null>(null, Validators.required),
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    size: this._fb.control<string | null>(null, Validators.required),
    brand: [''],
    color: [''],
    price: this._fb.control<number | null>(null, Validators.required),
    stock: this._fb.control<number | null>(null, Validators.required),
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    status: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const garment = this.garment()
      if (garment) {
        this.form.patchValue({
          sku: garment.sku,
          name: garment.name,
          category: garment.category ?? null,
          size: garment.size ?? null,
          brand: garment.brand ?? '',
          color: garment.color ?? '',
          price: garment.price,
          stock: garment.stock,
          status: garment.status ?? null
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
      category: raw.category as string,
      size: raw.size as string,
      status: raw.status as string,
      price: raw.price as number,
      stock: raw.stock as number
    })
    this.close.emit()
  }
}
