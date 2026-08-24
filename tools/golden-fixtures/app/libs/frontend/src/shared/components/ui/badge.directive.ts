import { Directive, input } from '@angular/core'

/** Badge del acelerador. Variantes estables, espejo de las de la tabla (iam-labels). */
@Directive({
  selector: 'span[appBadge]',
  host: { '[class]': 'classes()' }
})
export class AppBadge {
  readonly variant = input<'default' | 'secondary' | 'destructive' | 'outline'>('default')

  protected readonly classes = () => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold'
    const variants = {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'text-foreground border'
    }
    return `${base} ${variants[this.variant()]}`
  }
}
