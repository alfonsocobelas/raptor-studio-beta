import { ChangeDetectionStrategy, Component } from '@angular/core'
import { AccessTableComponent } from './access-table.component'

/**
 * El centro del modo Accesos (spec 49): la tabla de permisos del pivote elegido en el
 * raíl. El resumen del rol NO vive aquí: es el panel derecho del estudio (el mismo hueco
 * que Modelo y Flujos usan para el suyo).
 */
@Component({
  selector: 'studio-access-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccessTableComponent],
  template: `<studio-access-table class="block h-full" />`
})
export class AccessViewComponent {}
