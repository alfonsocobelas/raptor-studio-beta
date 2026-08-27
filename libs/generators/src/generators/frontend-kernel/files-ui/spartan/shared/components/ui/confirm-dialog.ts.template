import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog'

/** Confirmación destructiva. Todo el bloque de la librería queda encapsulado aquí. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [HlmAlertDialogImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-alert-dialog [state]="open() ? 'open' : 'closed'" (closed)="closed.emit()">
      <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
        <hlm-alert-dialog-header class="app-panel-head">
          <h2 hlmAlertDialogTitle>{{ title() }}</h2>
          <p hlmAlertDialogDescription>{{ description() }}</p>
        </hlm-alert-dialog-header>
        <hlm-alert-dialog-footer class="app-toolbar">
          <button hlmAlertDialogCancel (click)="ctx.close()">{{ cancelLabel() }}</button>
          <button hlmAlertDialogAction (click)="confirmed.emit(); ctx.close()">{{ confirmLabel() }}</button>
        </hlm-alert-dialog-footer>
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
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
