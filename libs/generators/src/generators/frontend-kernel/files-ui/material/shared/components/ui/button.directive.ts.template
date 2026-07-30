import { Directive, input } from '@angular/core'

/**
 * Botón (piel Material). Mismas variantes que la implementación Spartan.
 *
 * Aplica estilo con los tokens del tema en vez de delegar en MatButton: MatButton
 * es un componente, y Angular no admite componentes como hostDirectives.
 */
@Directive({
  selector: 'button[appBtn]',
  host: { '[class]': 'classes()' }
})
export class AppButton {
  readonly variant = input<'default' | 'outline' | 'destructive'>('default')

  protected readonly classes = () => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-full px-6 py-2 text-sm font-medium tracking-wide transition-shadow focus-visible:outline-none disabled:pointer-events-none disabled:opacity-38'
    const variants = {
      default: 'bg-[var(--mat-sys-primary,#0b57d0)] text-white hover:shadow-md',
      outline: 'border border-[var(--mat-sys-outline,#747775)] bg-transparent hover:bg-black/5',
      destructive: 'bg-[var(--mat-sys-error,#b3261e)] text-white hover:shadow-md'
    }
    return `${base} ${variants[this.variant()]}`
  }
}
