import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { MuestraDto } from '@app/shared/domain'
import { PuntoService } from '../../../../../../core/services/punto.service'

const ESTADO_OPTIONS: AppSelectOption[] = [
  { value: 'recibida', label: 'Recibida' },
  { value: 'en_analisis', label: 'En análisis' },
  { value: 'fuera_de_rango', label: 'Fuera de rango' },
  { value: 'validada', label: 'Validada' },
  { value: 'informada', label: 'Informada' },
  { value: 'facturada', label: 'Facturada' }
]

export interface MuestraFormValue {
  codigo: string
  estado: string
  tecnico: string
  recogida: string
  limiteInforme: string
  importe: number
  puntoId: string
  puntoName: string
}

@Component({
  selector: 'app-muestra-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="muestra() ? 'Editar muestra' : 'Nueva muestra'"
      [description]="muestra() ? 'Modifica los datos de la muestra' : 'Introduce los datos de la nueva muestra'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de muestra</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Código" for="mcodigo">
              <input id="mcodigo" appInput formControlName="codigo" />
              @if (form.controls.codigo.touched && form.controls.codigo.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Estado" for="mestado">
              <app-select formControlName="estado" controlId="mestado" placeholder="" [options]="estadoOptions" />
            </app-form-field>
            <app-form-field label="Técnico" for="mtecnico">
              <input id="mtecnico" appInput formControlName="tecnico" />
            </app-form-field>
            <app-form-field label="Recogida" for="mrecogida">
              <input id="mrecogida" type="date" appInput formControlName="recogida" />
              @if (form.controls.recogida.touched && form.controls.recogida.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Límite de informe" for="mlimiteInforme">
              <input id="mlimiteInforme" type="date" appInput formControlName="limiteInforme" />
              @if (form.controls.limiteInforme.touched && form.controls.limiteInforme.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Importe" for="mimporte">
              <input id="mimporte" type="number" appInput formControlName="importe" />
              @if (form.controls.importe.touched && form.controls.importe.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Punto de muestreo" for="mpuntoId">
              <app-select
                formControlName="puntoId"
                controlId="mpuntoId"
                placeholder="Seleccionar punto de muestreo"
                [options]="puntoIdOptions()"
              />
              @if (form.controls.puntoId.touched && form.controls.puntoId.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ muestra() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class MuestraDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _puntoService = inject(PuntoService)

  readonly muestra = input<MuestraDto | null>(null)
  readonly saved = output<MuestraFormValue>()
  readonly close = output<void>()

  readonly puntos = computed(() => this._puntoService.puntos.value()?.items ?? [])
  protected readonly puntoIdOptions = computed<AppSelectOption[]>(() =>
    this.puntos().map(item => ({ value: item.id, label: item.nombre }))
  )

  protected readonly estadoOptions = ESTADO_OPTIONS

  readonly form = this._fb.nonNullable.group({
    codigo: ['', Validators.required],
    estado: ['recibida'],
    tecnico: [''],
    recogida: ['', Validators.required],
    limiteInforme: ['', Validators.required],
    importe: this._fb.control<number | null>(null, Validators.required),
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    puntoId: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const muestra = this.muestra()
      if (muestra) {
        this.form.patchValue({
          codigo: muestra.codigo,
          estado: muestra.estado,
          tecnico: muestra.tecnico ?? '',
          recogida: muestra.recogida,
          limiteInforme: muestra.limiteInforme,
          importe: muestra.importe,
          puntoId: muestra.puntoId
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
      importe: raw.importe as number,
      puntoId: raw.puntoId ?? '',
      puntoName: this.puntos().find(item => item.id === raw.puntoId)?.nombre ?? ''
    })
    this.close.emit()
  }
}
