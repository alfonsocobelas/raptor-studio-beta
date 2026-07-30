import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'

/** Confirmación destructiva (piel Material). Misma API que la implementación Spartan. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closed.emit()">
        <div class="bg-card mat-elevation-z8 w-full max-w-md rounded-2xl p-6" (click)="$event.stopPropagation()">
          <h2 class="mat-headline-small mb-2">{{ title() }}</h2>
          <p class="mat-body-medium mb-6">{{ description() }}</p>
          <div class="flex justify-end gap-2">
            <button matButton (click)="closed.emit()">{{ cancelLabel() }}</button>
            <button matButton="filled" class="!bg-destructive !text-destructive-foreground" (click)="confirmed.emit(); closed.emit()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AppConfirmDialog {
  readonly open = input(false)
  readonly title = input('¿Confirmas la acción?')
  readonly description = input('')
  readonly confirmLabel = input('Eliminar')
  readonly cancelLabel = input('Cancelar')
  readonly confirmed = output<void>()
  readonly closed = output<void>()
}
