import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { PropiedadDto } from '@app/shared/domain'
import { AgenteService } from '../../../../../../core/services/agente.service'

const ESTADO_OPTIONS: AppSelectOption[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'reservada', label: 'Reservada' },
  { value: 'vendida', label: 'Vendida' },
  { value: 'retirada', label: 'Retirada' }
]

export interface PropiedadFormValue {
  titulo: string
  zona: string
  estado: string
  metrosCuadrados: number
  habitaciones: number
  precio: number
  fechaAlta: string
  exclusiva: boolean
  agenteId: string
  agenteName: string
}

@Component({
  selector: 'app-propiedad-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="propiedad() ? 'Editar propiedad' : 'Nueva propiedad'"
      [description]="propiedad() ? 'Modifica los datos de la propiedad' : 'Introduce los datos de la nueva propiedad'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de propiedad</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Título" for="ptitulo">
              <input id="ptitulo" appInput formControlName="titulo" />
              @if (form.controls.titulo.touched && form.controls.titulo.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Zona" for="pzona">
              <input id="pzona" appInput formControlName="zona" />
            </app-form-field>
            <app-form-field label="Estado" for="pestado">
              <app-select formControlName="estado" controlId="pestado" placeholder="" [options]="estadoOptions" />
            </app-form-field>
            <app-form-field label="Metros cuadrados" for="pmetrosCuadrados">
              <input id="pmetrosCuadrados" type="number" appInput formControlName="metrosCuadrados" />
              @if (form.controls.metrosCuadrados.touched && form.controls.metrosCuadrados.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Habitaciones" for="phabitaciones">
              <input id="phabitaciones" type="number" appInput formControlName="habitaciones" />
              @if (form.controls.habitaciones.touched && form.controls.habitaciones.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Precio" for="pprecio">
              <input id="pprecio" type="number" appInput formControlName="precio" />
              @if (form.controls.precio.touched && form.controls.precio.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Fecha de alta" for="pfechaAlta">
              <input id="pfechaAlta" type="date" appInput formControlName="fechaAlta" />
              @if (form.controls.fechaAlta.touched && form.controls.fechaAlta.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="En exclusiva" for="pexclusiva">
              <label class="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" formControlName="exclusiva" />
                En exclusiva
              </label>
            </app-form-field>
            <app-form-field label="Agente" for="pagenteId">
              <app-select
                formControlName="agenteId"
                controlId="pagenteId"
                placeholder="Seleccionar agente"
                [options]="agenteIdOptions()"
              />
              @if (form.controls.agenteId.touched && form.controls.agenteId.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ propiedad() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class PropiedadDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _agenteService = inject(AgenteService)

  readonly propiedad = input<PropiedadDto | null>(null)
  readonly saved = output<PropiedadFormValue>()
  readonly close = output<void>()

  readonly agentes = computed(() => this._agenteService.agentes.value()?.items ?? [])
  protected readonly agenteIdOptions = computed<AppSelectOption[]>(() =>
    this.agentes().map(item => ({ value: item.id, label: item.nombre }))
  )

  protected readonly estadoOptions = ESTADO_OPTIONS

  readonly form = this._fb.nonNullable.group({
    titulo: ['', Validators.required],
    zona: [''],
    estado: ['disponible'],
    metrosCuadrados: this._fb.control<number | null>(null, Validators.required),
    habitaciones: this._fb.control<number | null>(null, Validators.required),
    precio: this._fb.control<number | null>(null, Validators.required),
    fechaAlta: ['', Validators.required],
    exclusiva: [false],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    agenteId: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const propiedad = this.propiedad()
      if (propiedad) {
        this.form.patchValue({
          titulo: propiedad.titulo,
          zona: propiedad.zona ?? '',
          estado: propiedad.estado,
          metrosCuadrados: propiedad.metrosCuadrados,
          habitaciones: propiedad.habitaciones,
          precio: propiedad.precio,
          fechaAlta: propiedad.fechaAlta,
          exclusiva: propiedad.exclusiva,
          agenteId: propiedad.agenteId
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
      metrosCuadrados: raw.metrosCuadrados as number,
      habitaciones: raw.habitaciones as number,
      precio: raw.precio as number,
      agenteId: raw.agenteId ?? '',
      agenteName: this.agentes().find(item => item.id === raw.agenteId)?.nombre ?? ''
    })
    this.close.emit()
  }
}
