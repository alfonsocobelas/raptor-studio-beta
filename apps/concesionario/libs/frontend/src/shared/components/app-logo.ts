import { ChangeDetectionStrategy, Component, input } from '@angular/core'

/**
 * Marca de la aplicacion: cuadrado azul SAP con el wordmark en blanco.
 * El ancho del texto se fija con textLength para que no dependa de la fuente del sistema.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <svg class="size-full" viewBox="0 0 32 32" role="img" [attr.aria-label]="label()">
      <rect width="32" height="32" rx="6" fill="#0a6ed1" />
      <text
        x="16"
        y="17"
        textLength="23"
        lengthAdjust="spacingAndGlyphs"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="13"
        font-weight="700"
        fill="#ffffff"
      >
        SAP
      </text>
    </svg>
  `
})
export class AppLogo {
  readonly label = input('SAP Licenses')
}
