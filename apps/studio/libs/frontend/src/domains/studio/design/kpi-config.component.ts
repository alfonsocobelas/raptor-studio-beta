import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { KpiCell } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import {
  cellAt,
  conditionFieldsOf,
  dateFieldsOf,
  MEASURE_LABELS,
  measurableFieldsOf,
  measureAllowedOn,
  measuresFor,
  nextMeasureField,
  draftOperatorsFor,
  draftValueControlFor,
  OPERATOR_LABELS,
  WINDOW_PRESET_LABELS,
  WINDOW_PRESETS
} from './kpi-config-options'

/**
 * Panel del bloque KPI (spec 70): Etiqueta, Condición, Ventana, Comparar y Objetivo.
 *
 * Los operadores y el control del valor dependen del TIPO del campo elegido: un enum solo
 * compara por igualdad y su valor se elige de una lista; un número admite mayor/menor y se
 * teclea. Ofrecer `contiene` sobre un enum sería ofrecer un KPI que casa 'active' e 'inactive'.
 *
 * Solo se ofrecen campos que el listado emitido sabe filtrar: condicionar por un campo que la
 * API no filtra devolvería el total entero sin quejarse.
 */
@Component({
  selector: 'studio-kpi-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="kpi-config">
        <h3 class="mb-2 text-sm font-semibold">Componente · KPI</h3>
        <div class="space-y-2 text-xs">
          <label class="flex items-center justify-between gap-2">
            <span>Etiqueta</span>
            <input
              class="app-input w-[124px] shrink-0 rounded-md border px-2 py-1 text-xs"
              [ngModel]="v.block.kpiLabel ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ kpiLabel: $event })"
              [placeholder]="v.labelPlural"
              data-testid="kpi-label"
            />
          </label>

          <label class="flex items-center justify-between gap-2">
            <span>Medida</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.measures"
              [ngModel]="v.measure"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="onMeasure($event)"
              data-testid="kpi-measure"
            />
          </label>

          @if (v.measure !== 'count') {
            <label class="flex items-center justify-between gap-2">
              <span>Campo</span>
              <app-select
                class="w-[124px] shrink-0"
                size="sm"
                [options]="v.measurableFields"
                [ngModel]="v.block.kpiField ?? ''"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="patch({ kpiField: $event })"
                data-testid="kpi-field"
              />
            </label>
          }

          <label class="flex items-center justify-between gap-2">
            <span>Condición</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.conditionFields"
              [ngModel]="v.block.kpiConditionField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="onConditionField($event)"
              data-testid="kpi-condition-field"
            />
          </label>

          @if (v.block.kpiConditionField) {
            <label class="flex items-center justify-between gap-2">
              <span>Compara</span>
              <app-select
                class="w-[124px] shrink-0"
                size="sm"
                [options]="v.operators"
                [ngModel]="v.block.kpiConditionOperator ?? 'eq'"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="patch({ kpiConditionOperator: $event })"
                data-testid="kpi-condition-operator"
              />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Valor</span>
              @if (v.valueControl === 'select' || v.valueControl === 'boolean') {
                <app-select
                  class="w-[124px] shrink-0"
                  size="sm"
                  [options]="v.valueOptions"
                  [ngModel]="v.block.kpiConditionValue ?? ''"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="patch({ kpiConditionValue: $event })"
                  data-testid="kpi-condition-value"
                />
              } @else {
                <input
                  class="app-input w-[124px] shrink-0 rounded-md border px-2 py-1 text-xs"
                  [type]="v.valueControl"
                  [ngModel]="v.block.kpiConditionValue ?? ''"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="patch({ kpiConditionValue: $event })"
                  data-testid="kpi-condition-value"
                />
              }
            </label>
          }

          @if (v.dateFields.length) {
            <label class="flex items-center justify-between gap-2">
              <span>Ventana</span>
              <app-select
                class="w-[124px] shrink-0"
                size="sm"
                [options]="v.presets"
                [ngModel]="v.block.kpiWindowPreset ?? ''"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onWindowPreset($event)"
                data-testid="kpi-window-preset"
              />
            </label>
            @if (v.block.kpiWindowPreset) {
              <label class="flex items-center justify-between gap-2">
                <span>Sobre la fecha</span>
                <app-select
                  class="w-[124px] shrink-0"
                  size="sm"
                  [options]="v.dateOptions"
                  [ngModel]="v.block.kpiWindowField ?? ''"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="patch({ kpiWindowField: $event })"
                  data-testid="kpi-window-field"
                />
              </label>
              @if (v.block.kpiWindowPreset === 'days') {
                <label class="flex items-center justify-between gap-2">
                  <span>Cuántos días</span>
                  <input
                    class="app-input w-[124px] shrink-0 rounded-md border px-2 py-1 text-xs"
                    type="number"
                    min="1"
                    max="3650"
                    [ngModel]="v.block.kpiWindowDays ?? 30"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="patch({ kpiWindowDays: +$event })"
                    data-testid="kpi-window-days"
                  />
                </label>
              }
              <label class="flex items-center justify-between gap-2">
                <span>Mini-serie de 12 meses</span>
                <input
                  type="checkbox"
                  [checked]="v.block.kpiSparkline === true"
                  (change)="patch({ kpiSparkline: v.block.kpiSparkline !== true })"
                  data-testid="kpi-sparkline"
                />
              </label>
              <label class="flex items-center justify-between gap-2">
                <span>Comparar con el periodo anterior</span>
                <input
                  type="checkbox"
                  [checked]="v.block.kpiCompare === true"
                  (change)="patch({ kpiCompare: v.block.kpiCompare !== true })"
                  data-testid="kpi-compare"
                />
              </label>
            }
          }

          @if (v.measure === 'count' && v.block.kpiConditionField) {
            <label class="flex items-center justify-between gap-2">
              <span>Porcentaje sobre el total</span>
              <input
                type="checkbox"
                [checked]="v.block.kpiRatio === true"
                (change)="patch({ kpiRatio: v.block.kpiRatio !== true })"
                data-testid="kpi-ratio"
              />
            </label>
          }

          @if (v.block.kpiRatio !== true) {
            <label class="flex items-center justify-between gap-2">
              <span>Objetivo</span>
              <input
                class="app-input w-[124px] shrink-0 rounded-md border px-2 py-1 text-xs"
                type="number"
                min="1"
                [ngModel]="v.block.kpiTarget ?? ''"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onTarget($event)"
                placeholder="sin objetivo"
                data-testid="kpi-target"
              />
            </label>
          }

          @if (!v.dateFields.length) {
            <p class="text-muted-foreground pt-1 text-[10px]">
              Sin campos fecha en la entidad no hay ventana temporal que ofrecer.
            </p>
          }
        </div>
      </section>
    }
  `
})
export class KpiConfigComponent {
  readonly resource = input<string | null>(null)

  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const pageIndex = this.active.index()
    const blocks = this.store.pages()[pageIndex]?.blocks ?? []
    const found = cellAt(blocks, ['kpi'], this.resource())
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!found || !draft) return null

    const { blockIndex, cellIndex, cell: block } = found
    const option = (value: string, label: string): AppSelectOption => ({ value, label })
    const conditionFields = conditionFieldsOf(draft)
    const dateFields = dateFieldsOf(draft)
    const chosen = conditionFields.find(f => f.name === block.kpiConditionField)

    const measure = block.kpiMeasure ?? 'count'
    const measurable = measurableFieldsOf(draft).filter(entry => measureAllowedOn(measure, entry.kind))

    return {
      pageIndex,
      blockIndex,
      cellIndex,
      block,
      measure,
      measures: measuresFor(draft).map(m => option(m, MEASURE_LABELS[m])),
      measurableFields: measurable.map(entry => option(entry.field.name, entry.field.label)),
      labelPlural: draft.labelPlural,
      dateFields,
      conditionFields: [option('', '— sin condición'), ...conditionFields.map(f => option(f.name, f.label))],
      operators: chosen ? draftOperatorsFor(chosen).map(op => option(op, OPERATOR_LABELS[op])) : [],
      valueControl: chosen ? draftValueControlFor(chosen) : 'text',
      valueOptions: chosen
        ? chosen.type === 'boolean'
          ? [option('true', 'Sí'), option('false', 'No')]
          : (chosen.values ?? []).map(v => option(v.value, v.label))
        : [],
      presets: [option('', '— siempre'), ...WINDOW_PRESETS.map(p => option(p, WINDOW_PRESET_LABELS[p]))],
      dateOptions: dateFields.map(f => option(f.name, f.label))
    }
  })

  /** Cambiar de campo invalida el operador y el valor del anterior: eran de otro tipo. */
  protected onConditionField(field: string): void {
    const v = this.view()
    if (!v) return
    if (!field) {
      this.patch({ kpiConditionField: '' })
      return
    }
    const chosen = v.conditionFields.find(option => option.value === field)
    if (!chosen) return
    const draft = this.store.resources().find(r => r.name === this.resource())
    const definition = draft?.fields.find(f => f.name === field)
    this.patch({
      kpiConditionField: field,
      kpiConditionOperator: definition ? draftOperatorsFor(definition)[0] : 'eq',
      kpiConditionValue: definition?.values?.[0]?.value ?? ''
    })
  }

  /**
   * Cambiar de medida invalida el campo si el nuevo tipo no lo admite (sumar una fecha), y apaga
   * el porcentaje: un tanto por ciento de una suma sobre otra suma es otra pregunta.
   */
  protected onMeasure(measure: string): void {
    const v = this.view()
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!v || !draft) return

    this.patch({
      kpiMeasure: measure,
      kpiField: nextMeasureField(draft, measure, v.block.kpiField),
      ...(measure === 'count' ? {} : { kpiRatio: false })
    })
  }

  /** La primera fecha de la entidad es el defecto razonable al encender la ventana. */
  protected onWindowPreset(preset: string): void {
    const v = this.view()
    if (!v) return
    this.patch({
      kpiWindowPreset: preset,
      ...(preset && !v.block.kpiWindowField ? { kpiWindowField: v.dateFields[0]?.name } : {}),
      ...(preset === 'days' && v.block.kpiWindowDays === undefined ? { kpiWindowDays: 30 } : {})
    })
  }

  protected onTarget(value: string): void {
    const parsed = Number(value)
    this.patch(
      value === '' || !Number.isFinite(parsed) || parsed <= 0 ? { kpiTarget: undefined } : { kpiTarget: parsed }
    )
  }

  protected patch(change: Partial<KpiCell>): void {
    const v = this.view()
    if (v) this.store.setCellConfig(v.pageIndex, v.blockIndex, v.cellIndex, change)
  }
}
