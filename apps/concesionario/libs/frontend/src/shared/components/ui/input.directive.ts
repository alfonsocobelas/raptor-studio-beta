import { Directive } from '@angular/core'

/**
 * Estilo de input del acelerador. Es una directiva sin lógica: al cambiar de librería
 * cambia el hostDirective/clase, no las pantallas.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: {
    '[class]':
      '"border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"'
  }
})
export class AppInput {}
