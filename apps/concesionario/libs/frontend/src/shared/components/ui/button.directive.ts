import { Directive, input } from '@angular/core'

/** Botón del acelerador. Variantes estables: default | outline | destructive. */
@Directive({
  selector: 'button[appBtn]',
  host: { '[class]': 'classes()' }
})
export class AppButton {
  readonly variant = input<'default' | 'outline' | 'destructive'>('default')

  protected readonly classes = () => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border-input bg-background hover:bg-accent border',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    }
    return `${base} ${variants[this.variant()]}`
  }
}
