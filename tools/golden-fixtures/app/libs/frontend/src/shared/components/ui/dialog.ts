import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'

/**
 * Contenedor modal. Contrato estable del acelerador: las pantallas generadas usan
 * <app-dialog>, nunca el diálogo de la librería (ADR-003, nivel 1).
 *
 * Overlay propio en vez del portal de la librería o del <dialog> nativo: el portal
 * es una directiva estructural y su <ng-content> no sobrevive a dos niveles de
 * proyección, y el <dialog> nativo se pinta en el top layer, por encima del cual
 * los desplegables basados en overlays del CDK ya no pueden aparecer.
 */
@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'open() && closed.emit()' },
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closed.emit()">
        <div
          class="app-panel bg-background text-foreground rounded-lg border p-6 shadow-lg max-h-[90vh] w-full max-w-2xl overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <ng-content />
        </div>
      </div>
    }
  `
})
export class AppDialog {
  readonly open = input(false)
  readonly closed = output<void>()
}
