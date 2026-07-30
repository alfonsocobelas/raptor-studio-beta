import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { ClientDto } from '@app/shared/domain'

const CLIENT_TYPE_LABELS: Record<string, string> = {
  individual: 'Particular',
  company: 'Empresa'
}

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
        <h3 hlmDialogTitle>{{ client() ? 'Editar cliente' : 'Nuevo cliente' }}</h3>
        <p hlmDialogDescription>
          {{ client() ? 'Modifica los datos del cliente' : 'Introduce los datos del nuevo cliente' }}
        </p>
      </hlm-dialog-header>
      <form class="space-y-6 py-4" [formGroup]="form" (ngSubmit)="save(ctx)">
        <div>
          <h4 class="mb-3 text-sm font-semibold">Datos de contacto</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <hlm-field class="sm:col-span-2">
              <label hlmFieldLabel for="cname">Nombre</label>
              <input id="cname" hlmInput formControlName="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <hlm-field-error>Obligatorio</hlm-field-error>
              }
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ctype">Tipo</label>
              <hlm-select formControlName="clientType" [itemToString]="clientTypeToLabel">
                <hlm-select-trigger buttonId="ctype">
                  <hlm-select-value placeholder="Seleccionar tipo" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-item value="individual">Particular</hlm-select-item>
                  <hlm-select-item value="company">Empresa</hlm-select-item>
                </hlm-select-content>
              </hlm-select>
              <hlm-field-error>Obligatorio</hlm-field-error>
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ctaxId">DNI / CIF</label>
              <input id="ctaxId" hlmInput formControlName="taxId" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cemail">Email</label>
              <input id="cemail" hlmInput formControlName="email" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="cphone">Teléfono</label>
              <input id="cphone" hlmInput formControlName="phone" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="ccity">Localidad</label>
              <input id="ccity" hlmInput formControlName="city" />
            </hlm-field>
            <hlm-field class="sm:col-span-2">
              <label hlmFieldLabel for="caddress">Dirección</label>
              <input id="caddress" hlmInput formControlName="address" />
            </hlm-field>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-sm font-semibold">Notas</h4>
          <hlm-field class="sm:col-span-2">
            <label hlmFieldLabel for="cnotes">Notas internas</label>
            <textarea id="cnotes" class="resize-none" hlmInput formControlName="notes" rows="3"></textarea>
          </hlm-field>
        </div>

        <hlm-dialog-footer>
          <button type="button" hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" hlmBtn>
            {{ client() ? 'Guardar' : 'Crear' }}
          </button>
        </hlm-dialog-footer>
      </form>
    </hlm-dialog-content>
  `
})
export class ClientDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly client = input<ClientDto | null>(null)
  readonly saved = output<ClientFormValue>()

  protected readonly clientTypeToLabel = (value: unknown): string => CLIENT_TYPE_LABELS[String(value)] ?? ''

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

  save(ctx: { close: () => void }): void {
    if (this.form.invalid) {
      return
    }
    const raw = this.form.getRawValue()
    this.saved.emit({
      ...raw,
      clientType: raw.clientType as string
    })
    ctx.close()
  }
}
