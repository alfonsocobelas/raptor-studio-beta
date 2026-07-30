import { Directive } from '@angular/core'

/**
 * Input (piel Material). Estilo con los tokens del tema en vez de matInput: ese
 * control debe registrarse como hijo de <mat-form-field>, y un contrato que recibe
 * el control por proyección no puede garantizar esa relación.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: {
    '[class]':
      '"w-full rounded border border-[var(--mat-sys-outline,#747775)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--mat-sys-primary,#0b57d0)] focus:ring-1 focus:ring-[var(--mat-sys-primary,#0b57d0)]"'
  }
})
export class AppInput {}
