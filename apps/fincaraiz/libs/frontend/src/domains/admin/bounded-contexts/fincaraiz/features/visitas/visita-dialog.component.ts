import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { VisitaDto } from '@app/shared/domain'
import { PropiedadService } from '../../../../../../core/services/propiedad.service'

export interface VisitaFormValue {
  referencia: string
  fecha: string
  interesado: string
  observaciones: string
  confirmada: boolean
  propiedadId: string
  propiedadName: string
}

@Component({
  selector: 'app-visita-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="visita() ? 'Editar visita' : 'Nueva visita'"
      [description]="visita() ? 'Modifica los datos de la visita' : 'Introduce los datos de la nueva visita'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de visita</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Referencia" for="vreferencia">
              <input id="vreferencia" appInput formControlName="referencia" />
              @if (form.controls.referencia.touched && form.controls.referencia.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Fecha" for="vfecha">
              <input id="vfecha" type="date" appInput formControlName="fecha" />
              @if (form.controls.fecha.touched && form.controls.fecha.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Interesado" for="vinteresado">
              <input id="vinteresado" appInput formControlName="interesado" />
            </app-form-field>
            <app-form-field label="Observaciones" for="vobservaciones" class="sm:col-span-2">
              <textarea
                id="vobservaciones"
                class="resize-none"
                appInput
                formControlName="observaciones"
                rows="3"
              ></textarea>
            </app-form-field>
            <app-form-field label="Confirmada" for="vconfirmada">
              <label class="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" formControlName="confirmada" />
                Confirmada
              </label>
            </app-form-field>
            <app-form-field label="Propiedad" for="vpropiedadId">
              <app-select
                formControlName="propiedadId"
                controlId="vpropiedadId"
                placeholder="Seleccionar propiedad"
                [options]="propiedadIdOptions()"
              />
              @if (form.controls.propiedadId.touched && form.controls.propiedadId.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ visita() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class VisitaDialogComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _propiedadService = inject(PropiedadService)

  readonly visita = input<VisitaDto | null>(null)
  readonly saved = output<VisitaFormValue>()
  readonly close = output<void>()

  readonly propiedades = computed(() => this._propiedadService.propiedades.value()?.items ?? [])
  protected readonly propiedadIdOptions = computed<AppSelectOption[]>(() =>
    this.propiedades().map(item => ({ value: item.id, label: item.titulo }))
  )

  readonly form = this._fb.nonNullable.group({
    referencia: ['', Validators.required],
    fecha: ['', Validators.required],
    interesado: [''],
    observaciones: [''],
    confirmada: [false],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    propiedadId: this._fb.control<string | null>(null, Validators.required)
  })

  constructor() {
    effect(() => {
      const visita = this.visita()
      if (visita) {
        this.form.patchValue({
          referencia: visita.referencia,
          fecha: visita.fecha,
          interesado: visita.interesado ?? '',
          observaciones: visita.observaciones ?? '',
          confirmada: visita.confirmada,
          propiedadId: visita.propiedadId
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
      propiedadId: raw.propiedadId ?? '',
      propiedadName: this.propiedades().find(item => item.id === raw.propiedadId)?.titulo ?? ''
    })
    this.close.emit()
  }
}
