import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppButton } from '../../../../../../shared/components/ui/button.directive'
import { AppDialogContent } from '../../../../../../shared/components/ui/dialog-content'
import { AppFormField } from '../../../../../../shared/components/ui/form-field'
import { AppInput } from '../../../../../../shared/components/ui/input.directive'
import { AppSelect, AppSelectOption } from '../../../../../../shared/components/ui/select'
import { ClientDto } from '@app/shared/domain'

const CLIENT_TYPE_OPTIONS: AppSelectOption[] = [
  { value: 'individual', label: 'Particular' },
  { value: 'company', label: 'Empresa' }
]

export interface ClientFormValue {
  name: string
  clientType: string
  taxId: string
  email: string
  phone: string
  city: string
  address: string
  notes: string
}

@Component({
  selector: 'app-client-dialog',
  imports: [ReactiveFormsModule, AppDialogContent, AppButton, AppFormField, AppInput, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-content
      [title]="client() ? 'Editar cliente' : 'Nuevo cliente'"
      [description]="client() ? 'Modifica los datos del cliente' : 'Introduce los datos del nuevo cliente'"
    >
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save()">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de contacto</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Nombre" for="cname" class="sm:col-span-2">
              <input id="cname" appInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="Tipo" for="ctype">
              <app-select
                formControlName="clientType"
                controlId="ctype"
                placeholder="Seleccionar tipo"
                [options]="clientTypeOptions"
              />
              @if (form.controls.clientType.touched && form.controls.clientType.invalid) {
                <span class="text-destructive text-sm">Obligatorio</span>
              }
            </app-form-field>
            <app-form-field label="DNI / CIF" for="ctaxId">
              <input id="ctaxId" appInput formControlName="taxId" />
            </app-form-field>
            <app-form-field label="Email" for="cemail">
              <input id="cemail" appInput formControlName="email" />
            </app-form-field>
            <app-form-field label="Teléfono" for="cphone">
              <input id="cphone" appInput formControlName="phone" />
            </app-form-field>
            <app-form-field label="Localidad" for="ccity">
              <input id="ccity" appInput formControlName="city" />
            </app-form-field>
            <app-form-field label="Dirección" for="caddress" class="sm:col-span-2">
              <input id="caddress" appInput formControlName="address" />
            </app-form-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Notas</h4>
          <app-form-field label="Notas internas" for="cnotes" class="sm:col-span-2">
            <textarea id="cnotes" class="resize-none" appInput formControlName="notes" rows="3"></textarea>
          </app-form-field>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" appBtn variant="outline" (click)="close.emit()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" appBtn>
            {{ client() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-dialog-content>
  `
})
export class ClientDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly client = input<ClientDto | null>(null)
  readonly saved = output<ClientFormValue>()
  readonly close = output<void>()

  protected readonly clientTypeOptions = CLIENT_TYPE_OPTIONS

  readonly form = this._fb.nonNullable.group({
    name: ['', Validators.required],
    // null (no ''): hlm-select solo muestra el placeholder cuando el valor es null.
    clientType: this._fb.control<string | null>(null, Validators.required),
    taxId: [''],
    email: [''],
    phone: [''],
    city: [''],
    address: [''],
    notes: ['']
  })

  constructor() {
    effect(() => {
      const client = this.client()
      if (client) {
        this.form.patchValue({
          name: client.name,
          clientType: client.clientType ?? null,
          taxId: client.taxId ?? '',
          email: client.email ?? '',
          phone: client.phone ?? '',
          city: client.city ?? '',
          address: client.address ?? '',
          notes: client.notes ?? ''
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
      clientType: raw.clientType as string
    })
    this.close.emit()
  }
}
