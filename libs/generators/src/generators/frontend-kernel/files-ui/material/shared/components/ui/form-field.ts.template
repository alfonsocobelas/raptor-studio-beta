import { ChangeDetectionStrategy, Component, input } from '@angular/core'

/** Campo de formulario (piel Material). Misma API que la implementación Spartan. */
@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      @if (label()) {
        <label class="mat-body-small opacity-70" [attr.for]="for()">{{ label() }}</label>
      }
      <ng-content />
      @if (error()) {
        <span class="text-destructive text-sm">{{ error() }}</span>
      }
    </div>
  `
})
export class AppFormField {
  readonly label = input('')
  readonly for = input('')
  readonly error = input('')
}
