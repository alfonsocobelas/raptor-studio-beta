import { ChangeDetectionStrategy, Component } from '@angular/core'
import { AccessTableComponent } from './access-table.component'

/**
 * El centro del modo Accesos (spec 49): la tabla de permisos del pivote elegido en el
 * raíl. Accesos no tiene panel derecho —la tabla se lee sola y gana ese ancho—, así que
 * este es todo el contenido del modo.
 */
@Component({
  selector: 'studio-access-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccessTableComponent],
  template: `<studio-access-table class="block h-full" />`
})
export class AccessViewComponent {}
