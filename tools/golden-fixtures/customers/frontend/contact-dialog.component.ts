import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { ContactDto } from '@sap-licenses/shared/domain'

export interface ContactFormValue {
  name: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}

@Component({
  selector: 'app-contact-dialog',
  imports: [
    ReactiveFormsModule,
    HlmDialogImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmCheckboxImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-content *hlmDialogPortal="let ctx" class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <hlm-dialog-header>
        <h3 hlmDialogTitle>{{ contact() ? 'Editar contacto' : 'Nuevo contacto' }}</h3>
        <p hlmDialogDescription>
          {{ contact() ? 'Modifica los datos del contacto' : 'Introduce los datos del nuevo contacto' }}
        </p>
      </hlm-dialog-header>
      <form class="space-y-4 py-4" [formGroup]="form" (ngSubmit)="save(ctx)">
        <div class="grid gap-4 sm:grid-cols-2">
          <hlm-field class="sm:col-span-2">
            <label hlmFieldLabel for="ctname"> Nombre </label>
            <input id="ctname" hlmInput formControlName="name" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
              <hlm-field-error>Obligatorio</hlm-field-error>
            }
          </hlm-field>
          <hlm-field>
            <label hlmFieldLabel for="ctrole"> Cargo </label>
            <input id="ctrole" hlmInput formControlName="role" />
          </hlm-field>
          <hlm-field>
            <label hlmFieldLabel for="ctphone"> Teléfono </label>
            <input id="ctphone" hlmInput formControlName="phone" />
          </hlm-field>
          <hlm-field class="sm:col-span-2">
            <label hlmFieldLabel for="ctemail"> Email </label>
            <input id="ctemail" type="email" hlmInput formControlName="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <hlm-field-error>Email no válido</hlm-field-error>
            }
          </hlm-field>
        </div>

        <div class="flex items-center gap-2">
          <hlm-checkbox id="ctprimary" formControlName="isPrimary" />
          <label class="text-sm" for="ctprimary">Contacto principal</label>
        </div>

        <hlm-dialog-footer>
          <button type="button" hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" hlmBtn>
            {{ contact() ? 'Guardar' : 'Crear' }}
          </button>
        </hlm-dialog-footer>
      </form>
    </hlm-dialog-content>
  `
})
export class ContactDialogComponent {
  private readonly _fb = inject(FormBuilder)

  readonly contact = input<ContactDto | null>(null)
  readonly saved = output<ContactFormValue>()

  readonly form = this._fb.nonNullable.group({
    name: ['', Validators.required],
    role: [''],
    // Vacio permitido (email opcional); si viene, valida formato.
    email: ['', Validators.email],
    phone: [''],
    isPrimary: [false]
  })

  constructor() {
    effect(() => {
      const contact = this.contact()
      if (contact) {
        this.form.patchValue({
          name: contact.name,
          role: contact.role ?? '',
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          isPrimary: contact.isPrimary
        })
      }
    })
  }

  save(ctx: { close: () => void }): void {
    if (this.form.valid) {
      this.saved.emit(this.form.getRawValue())
      ctx.close()
    }
  }
}
