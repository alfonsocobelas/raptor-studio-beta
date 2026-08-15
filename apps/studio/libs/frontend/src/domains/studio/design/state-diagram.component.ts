import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { STATE_NODE, stateDiagram } from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/**
 * El ciclo de vida de la entidad elegida (spec 43): los valores del enum promovido como
 * cajas y cada transición como flecha con su verbo. Solo lectura en esta fase — es cómo
 * el diseñador VALIDA lo que el chat propuso: la flecha ausente también es una regla.
 *
 * Deriva todo del store (sin inputs): así se monta en el runner JIT y sobrevive a
 * cualquier reordenación de la vista del modelo.
 */
@Component({
  selector: 'studio-state-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="bg-card rounded-lg border p-4 shadow-sm" data-testid="state-diagram">
        <p class="studio-eyebrow mb-1">Ciclo de vida · {{ v.fieldLabel }}</p>
        <p class="text-muted-foreground mb-3 text-xs">
          Cada registro nace en el valor con anillo; solo los saltos dibujados están permitidos.
        </p>
        <svg [attr.width]="v.width + 16" [attr.height]="v.height" class="overflow-visible">
          <defs>
            <marker
              id="state-arrow"
              markerWidth="13"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M3,2 L10,6 L3,10" fill="none" stroke="currentColor" stroke-width="1.6" />
            </marker>
          </defs>
          @for (edge of v.edges; track edge.key) {
            <g class="text-muted-foreground" [attr.data-testid]="'state-edge-' + edge.key">
              <path [attr.d]="edge.path" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#state-arrow)" />
              <text
                [attr.x]="edge.labelX"
                [attr.y]="edge.labelY"
                text-anchor="middle"
                class="fill-current text-[10px] font-medium"
              >
                {{ edge.label }}
              </text>
            </g>
          }
          @for (node of v.nodes; track node.value) {
            <g [attr.data-testid]="'state-node-' + node.value" [attr.data-unreachable]="node.unreachable || null">
              @if (node.initial) {
                <!-- el anillo del estado inicial: donde nace todo registro -->
                <rect
                  [attr.x]="node.x - 4"
                  [attr.y]="node.y - 4"
                  [attr.width]="nodeWidth + 8"
                  [attr.height]="nodeHeight + 8"
                  rx="12"
                  fill="none"
                  stroke="#f15539"
                  stroke-width="1.4"
                  data-testid="state-initial"
                />
              }
              <rect
                [attr.x]="node.x"
                [attr.y]="node.y"
                [attr.width]="nodeWidth"
                [attr.height]="nodeHeight"
                rx="9"
                class="fill-background stroke-border"
                [attr.stroke-dasharray]="node.unreachable ? '4 3' : null"
                stroke-width="1.2"
              />
              <text
                [attr.x]="node.x + nodeWidth / 2"
                [attr.y]="node.y + nodeHeight / 2 + 4"
                text-anchor="middle"
                class="fill-foreground text-xs font-semibold"
              >
                {{ node.label }}
              </text>
            </g>
          }
        </svg>
        @if (v.loose.length) {
          <p class="mt-2 text-xs text-amber-600" data-testid="state-warning">
            Ninguna flecha llega a: {{ v.loose.join(', ') }}. Se puede generar igual; dibuja cómo se alcanza o
            elimínalo del enum.
          </p>
        }
      </div>
    }
  `
})
export class StateDiagramComponent {
  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly nodeWidth = STATE_NODE.width
  protected readonly nodeHeight = STATE_NODE.height

  protected readonly view = computed(() => {
    const resource = this.store.resources().find(r => r.name === this.active.resource())
    const machine = resource?.state
    const field = resource?.fields.find(f => f.name === machine?.field)
    if (!resource || !machine || !field?.values?.length) return null

    const layout = stateDiagram(machine, field.values)
    return {
      ...layout,
      fieldLabel: field.label,
      loose: layout.nodes.filter(node => node.unreachable).map(node => node.label)
    }
  })
}
