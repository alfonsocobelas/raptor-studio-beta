import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { KpiCell } from '@app/shared/domain'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { DesignStore } from './design-store'
import { MEASURE_LABELS, WINDOW_PRESET_LABELS } from './kpi-config-options'
import { mockTotal } from './mock-data'

interface KpiPreview {
  title: string
  value: number
  subtitle?: string
  delta?: { direction: 'up' | 'down' | 'flat'; percent?: number; absolute: number }
  percent?: number
  progress?: number
  target?: number
  spark?: number[]
}

/**
 * Bloque KPI (spec 70): la tarjeta de un número, con sus modificadores. Es un mockup
 * determinista —el valor sale de `mockTotal`, no de datos— pero con la MISMA tarjeta que emite
 * la app, para que lo que se ve aquí sea lo que se va a generar.
 */
@Component({
  selector: 'studio-canvas-kpi',
  imports: [KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (preview(); as p) {
      <app-kpi-card
        [title]="p.title"
        [value]="p.value"
        [subtitle]="p.subtitle"
        [delta]="p.delta"
        [percent]="p.percent"
        [progress]="p.progress"
        [target]="p.target"
        [spark]="p.spark"
        testId="canvas-kpi"
      />
    }
  `
})
export class CanvasKpiComponent {
  readonly cell = input.required<KpiCell>()

  private readonly _store = inject(DesignStore)

  protected readonly preview = computed<KpiPreview | null>(() => {
    const block = this.cell()
    const draft = this._store.resources().find(r => r.name === block.resource)
    if (!draft) return null

    const value = mockTotal(draft.fields.length)
    const conditionLabel = this._conditionLabel()
    const windowLabel = block.kpiWindowPreset ? WINDOW_PRESET_LABELS[block.kpiWindowPreset] : undefined
    // la medida se VE en el preview: elegir «Media de importe» tiene que cambiar la tarjeta
    // dibujada, o el lienzo miente sobre lo que se va a generar (cuarta deriva, revisión 70-72)
    const measure = block.kpiMeasure ?? 'count'
    const measuredField = draft.fields.find(f => f.name === block.kpiField)
    const measureLabel =
      measure !== 'count' && measuredField
        ? `${MEASURE_LABELS[measure]} de ${measuredField.label.toLowerCase()}`
        : undefined

    return {
      title: block.kpiLabel?.trim() || draft.labelPlural,
      value,
      subtitle: [measureLabel, conditionLabel, windowLabel].filter(Boolean).join(' · ') || undefined,
      // valores de mockup deterministas: la tarjeta debe VERSE como la emitida
      ...(block.kpiCompare ? { delta: { direction: 'up' as const, percent: 12.5, absolute: 14 } } : {}),
      ...(block.kpiRatio ? { percent: 42.8 } : {}),
      ...(block.kpiTarget
        ? { progress: Math.min(100, Math.round((value / block.kpiTarget) * 100)), target: block.kpiTarget }
        : {}),
      // mini-serie de mockup determinista, la misma forma que emitirá la tarjeta
      ...(block.kpiSparkline && block.kpiWindowPreset
        ? { spark: Array.from({ length: 12 }, (_, i) => mockTotal(i) % 60) }
        : {})
    }
  })

  /** «Estado es Pendiente», con las etiquetas humanas del modelo. */
  private _conditionLabel(): string | undefined {
    const block = this.cell()
    if (!block.kpiConditionField) return undefined

    const draft = this._store.resources().find(r => r.name === block.resource)
    const field = draft?.fields.find(f => f.name === block.kpiConditionField)
    const value = field?.values?.find(v => v.value === block.kpiConditionValue)?.label ?? block.kpiConditionValue ?? ''

    return `${field?.label ?? block.kpiConditionField} ${OPERATOR_TEXT[block.kpiConditionOperator ?? 'eq']} ${value}`
  }
}

const OPERATOR_TEXT: Record<string, string> = {
  eq: 'es',
  neq: 'no es',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  contains: 'contiene',
  starts_with: 'empieza por',
  ends_with: 'acaba en'
}
