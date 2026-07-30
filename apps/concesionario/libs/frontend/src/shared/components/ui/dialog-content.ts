import { ChangeDetectionStrategy, Component, input } from '@angular/core'

/** Cabecera y cuerpo de un modal. Lo envuelve <app-dialog>. */
@Component({
  selector: 'app-dialog-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-h-[80vh] overflow-y-auto">
      <h3 class="text-lg font-semibold">{{ title() }}</h3>
      @if (description()) {
        <p class="text-muted-foreground text-sm mt-1">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `
})
export class AppDialogContent {
  readonly title = input('')
  readonly description = input('')
}
