import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'

/**
 * Contenedor modal. Contrato estable del acelerador: las pantallas generadas usan
 * <app-dialog>, nunca el diálogo de la librería. Cambiar de librería = cambiar
 * esta implementación, no las features (ADR-003, nivel 1).
 */
@Component({
  selector: 'app-dialog',
  imports: [HlmDialogImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (closed)="closed.emit()">
      <ng-content />
    </hlm-dialog>
  `
})
export class AppDialog {
  readonly open = input(false)
  readonly closed = output<void>()
}
