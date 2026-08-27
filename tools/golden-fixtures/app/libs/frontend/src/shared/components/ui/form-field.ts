import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { HlmFieldImports } from '@spartan-ng/helm/field'

/** Campo de formulario: etiqueta, control proyectado y error. Contrato del acelerador. */
@Component({
  selector: 'app-form-field',
  // bloque a propósito: un host inline se come el margen vertical del space-y-* del formulario
  host: { class: 'block' },
  imports: [HlmFieldImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-field>
      @if (label()) {
        <label class="app-label" hlmFieldLabel [for]="for()">{{ label() }}</label>
      }
      <ng-content />
      @if (error()) {
        <hlm-field-error forceShow>{{ error() }}</hlm-field-error>
      }
    </hlm-field>
  `
})
export class AppFormField {
  readonly label = input('')
  readonly for = input('')
  /** Mensaje a mostrar; vacío = sin error */
  readonly error = input('')
}
