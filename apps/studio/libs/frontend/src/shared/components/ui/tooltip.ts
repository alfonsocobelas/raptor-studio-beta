import { Directive } from '@angular/core'
import { BrnTooltip, type BrnTooltipPosition, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip'
import {
  DEFAULT_TOOLTIP_CONTENT_CLASSES,
  DEFAULT_TOOLTIP_SVG_CLASS,
  tooltipPositionVariants
} from '@spartan-ng/helm/tooltip'
import { hlm } from '@spartan-ng/helm/utils'

/**
 * Tooltip del acelerador. Contrato sobre el de la librería (ADR-003): el lienzo necesita dar
 * el texto completo de una celda cortada (spec 54) y las pantallas no importan `@spartan-ng`.
 *
 * No envuelve a `HlmTooltip` porque no se puede: su input `hlmTooltip` no lo declara él, lo
 * reexpone hacia `BrnTooltip`, y Angular no deja re-exponer en cadena (NG0311). Así que hace
 * lo mismo que él —montar `BrnTooltip` con la piel de helm—, reutilizando SUS constantes de
 * clases para no duplicar ni un string de estilo.
 */
@Directive({
  selector: '[appTooltip]',
  providers: [
    provideBrnTooltipDefaultOptions({
      svgClasses: DEFAULT_TOOLTIP_SVG_CLASS,
      tooltipContentClasses: DEFAULT_TOOLTIP_CONTENT_CLASSES,
      arrowClasses: (position: BrnTooltipPosition) => hlm(tooltipPositionVariants({ position }))
    })
  ],
  hostDirectives: [{ directive: BrnTooltip, inputs: ['brnTooltip: appTooltip', 'tooltipDisabled'] }]
})
export class AppTooltip {}
