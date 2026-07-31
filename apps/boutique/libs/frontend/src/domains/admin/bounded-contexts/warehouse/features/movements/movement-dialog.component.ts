import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { MovementDto } from '@app/shared/domain'

const MOVEMENT_TYPE_OPTIONS: AppSelectOption[] = [
  { value: 'in', label: 'Entrada' },
  { value: 'out', label: 'Salida' }
]

const REASON_OPTIONS: AppSelectOption[] = [
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venta' },
  { value: 'return', label: 'Devolución' },
  { value: 'adjustment', label: 'Ajuste de inventario' }
]

export interface MovementFormValue {
  reference: string
  movementDate: string
  movementType: string
  garmentLabel: string
  quantity: number
  counterparty: string
  reason: string
}

@Component({
  selector: 'app-movement-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="movement() ? 'Editar movimiento' : 'Nuevo movimiento'"
      [description]="movement() ? 'Modifica los datos del movimiento' : 'Introduce los datos del nuevo movimiento'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos del movimiento</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Referencia" for="mreference">
              <input id="mreference" appInput formControlName="reference" />
              @if (form.controls.reference.touched && form.controls.reference.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Fecha" for="mmovementDate">
              <input id="mmovementDate" type="date" appInput formControlName="movementDate" />
              @if (form.controls.movementDate.touched && form.controls.movementDate.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Tipo" for="mtype">
              <app-select
                formControlName="movementType"
                controlId="mtype"
                placeholder="Seleccionar tipo"
                [options]="movementTypeOptions"
              />
              @if (form.controls.movementType.touched && form.controls.movementType.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Prenda" for="mgarmentLabel" class="sm:col-span-2">
              <input id="mgarmentLabel" appInput formControlName="garmentLabel" />
              @if (form.controls.garmentLabel.touched && form.controls.garmentLabel.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Unidades" for="mquantity">
              <input id="mquantity" type="number" appInput formControlName="quantity" />
              @if (form.controls.quantity.touched && form.controls.quantity.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Origen / destino" for="mcounterparty" class="sm:col-span-2">
              <input id="mcounterparty" appInput formControlName="counterparty" />
            </app-form-field>
            <app-form-field label="Motivo" for="mreason">
              <app-select
                formControlName="reason"
                controlId="mreason"
                placeholder="Seleccionar motivo"
                [options]="reasonOptions"
              />
              @if (form.controls.reason.touched && form.controls.reason.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ movement() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class MovementDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly movement = input<MovementDto | null>(null)
  readonly saved = output<MovementFormValue>()
  readonly close = output<void>()

  protected readonly movementTypeOptions = MOVEMENT_TYPE_OPTIONS
  protected readonly reasonOptions = REASON_OPTIONS

  readonly form = this._fb.nonNullable.group({
    reference: ['', Validators.required],
    movementDate: ['', Validators.required],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    movementType: this._fb.control<string | null>(null, Validators.required),
    garmentLabel: ['', Validators.required],
    quantity: this._fb.control<number | null>(null, Validators.required),
    counterparty: [''],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    reason: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const movement = this.movement()
      if (movement) {
        this.form.patchValue({
          reference: movement.reference,
          movementDate: movement.movementDate,
          movementType: movement.movementType ?? null,
          garmentLabel: movement.garmentLabel,
          quantity: movement.quantity,
          counterparty: movement.counterparty ?? '',
          reason: movement.reason ?? null
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
      movementType: raw.movementType as string,
      reason: raw.reason as string,
      quantity: raw.quantity as number
    })
    this.close.emit()
  }
}
