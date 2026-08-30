import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideZap, lucideZapOff } from '@ng-icons/lucide'
import type { BusinessFlow, FlowNode, FlowNodeKind } from '@raptor/schema'
import {
  FLOW_DECISION,
  FLOW_GRID,
  FLOW_GROUP,
  FLOW_KIND_LABELS,
  FLOW_KIND_STARTERS,
  canvasExtent,
  flowAlternateEdges,
  flowBranchLabel,
  flowCondensed,
  flowEdgeCurve,
  flowGroupBox,
  flowGroups,
  flowLayout,
  flowLoosePosition,
  flowNodeBox,
  flowNodeSize,
  nodeAt,
  type FlowEdgeCurve,
  type FlowGroup,
  type NodeBox,
  type NodePosition
} from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { CanvasControlsComponent } from './canvas-controls.component'
import { CanvasViewportService } from './canvas-viewport.service'
import { FlowOrientationService } from './flow-orientation.service'
import { DesignStore } from './design-store'

interface FlowDiagramNode {
  node: FlowNode
  box: NodeBox
}

interface FlowDiagramEdge {
  from: string
  to: string
  label?: string
  /** Salida secundaria de una decisión: se dibuja discontinua */
  alternate: boolean
  line: FlowEdgeCurve
}

/** Nombre de partida de una acción recién creada: mientras lo conserve, es un borrador. */
const NEW_ACTION_TEXT = 'Nueva acción'

/** Valor de «— sin entidad —»: la cadena vacía la lee el desplegable como «nada elegido». */
const NONE = '__sin_entidad__'

/** Lienzo sin medida (jsdom, primer render): un tamaño nominal mantiene el aterrizaje. */
export const FLOW_CANVAS_FALLBACK = { width: 1280, height: 720 } as const

/** Margen de gracia al soltar una flecha: cerca del bloque cuenta como dentro. */
const FLOW_LINK_SNAP = 16

/** Lo elegible en el lienzo: un nodo o una arista (identidad completa). */
type FlowSelection = { kind: 'node'; id: string } | { kind: 'edge'; from: string; to: string; label?: string }

/**
 * La vista de FLUJOS (spec 28): los procesos de negocio del diseño, dibujados
 * y EDITABLES (TASK-05). Otra proyección del DesignStore — cada gesto llama a
 * una mutación del store; el dibujo nunca guarda nada propio salvo el layout,
 * que es cosmético y vive en memoria de la sesión.
 */
@Component({
  selector: 'studio-flow-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect, CanvasControlsComponent, NgIcon],
  providers: [provideIcons({ lucideZap, lucideZapOff })],
  host: { '(document:keydown.delete)': 'onDeleteKey($event)', '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (!store.flows().length) {
      <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-flows">
        <p class="text-muted-foreground mb-2 text-lg">Sin procesos todavía</p>
        <p class="text-muted-foreground max-w-md text-sm">
          Cuéntale al chat cómo trabaja el negocio («cuando llega un pedido…») o crea uno con
          <strong>Nuevo flujo</strong> en el panel de la izquierda: los pasos se conectan arrastrando desde su asa.
        </p>
      </div>
    }

    @if (activeFlow(); as flow) {
      <!-- Lienzo infinito: el viewport recorta y el MUNDO se mueve con la cámara. -->
      <div
        #viewportEl
        class="flow-grid absolute inset-0 overflow-hidden"
        [style.background-position]="gridOffset()"
        [style.background-size]="gridSize()"
        [class.cursor-grabbing]="panning()"
        data-testid="flow-viewport"
        (pointerdown)="startPan($event)"
        (click)="onCanvasClick($event)"
        (wheel)="onWheel($event)"
      >
        <div class="absolute right-4 top-4 z-30 flex items-center gap-2">
          <button
            type="button"
            class="bg-card canvas-card studio-ui hover:bg-accent/60 rounded-[9px] border px-2.5 py-1.5 transition-colors"
            [attr.title]="
              orientation.value() === 'horizontal' ? 'Leer el proceso en columna' : 'Leer el proceso en fila'
            "
            data-testid="flow-orientation"
            (click)="toggleOrientation()"
          >
            {{ orientation.value() === 'horizontal' ? '→' : '↓' }}
          </button>
          <studio-canvas-controls (fit)="fitToView()" />
        </div>

        <!-- conexión a medias: se dice qué falta, porque el lienzo por sí solo no lo cuenta -->
        @if (linkFrom()) {
          <div
            class="bg-foreground text-background absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs shadow"
            data-testid="flow-link-hint"
          >
            Pulsa el bloque con el que conectar · <kbd>Esc</kbd> para dejarlo
          </div>
        }
        <div
          class="absolute left-0 top-0 origin-top-left"
          [style.transform]="worldTransform()"
          data-testid="flow-surface"
        >
          <svg
            class="pointer-events-none absolute left-0 top-0 overflow-visible"
            [attr.width]="surface().width"
            [attr.height]="surface().height"
            data-testid="flow-edges"
          >
            <defs>
              <marker
                id="flow-arrow"
                markerWidth="13"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 2 1.5 L 9.5 6 L 2 10.5" fill="none" class="stroke-foreground" stroke-width="1.8" />
              </marker>
              <!-- la salida alternativa de una decisión va apagada, como la RAMA NO de 12A -->
              <marker
                id="flow-arrow-alt"
                markerWidth="13"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 2 1.5 L 9.5 6 L 2 10.5" fill="none" class="stroke-muted-foreground" stroke-width="1.8" />
              </marker>
            </defs>
            @for (item of edges(); track item.from + '→' + item.to + (item.label ?? '')) {
              <g
                class="group/edge pointer-events-auto cursor-pointer"
                [attr.data-testid]="'flow-edge-' + item.from + '-' + item.to"
                (click)="selectEdge($event, item)"
              >
                <!-- zona de clic ancha e invisible: el trazo fino es imposible de acertar -->
                <path [attr.d]="item.line.d" fill="none" stroke="transparent" stroke-width="14" />
                <path
                  [attr.d]="item.line.d"
                  fill="none"
                  [class]="
                    isEdgeSelected(item)
                      ? 'stroke-primary'
                      : item.alternate
                        ? 'stroke-muted-foreground'
                        : 'stroke-foreground'
                  "
                  [attr.stroke-width]="isEdgeSelected(item) ? 2.5 : 1.5"
                  [attr.stroke-dasharray]="item.alternate ? edgeDash() : null"
                  [attr.marker-end]="item.alternate ? 'url(#flow-arrow-alt)' : 'url(#flow-arrow)'"
                />
              </g>
            }
            <!-- las etiquetas van en su PROPIA capa, después de todas las líneas: en SVG
                 manda el orden del documento, y dentro del <g> de su arista la pastilla
                 quedaba tapada por las flechas que se pintaban después -->
            @for (item of edges(); track item.from + '→' + item.to + (item.label ?? '')) {
              @if (item.label) {
                <g class="pointer-events-auto cursor-pointer" (click)="selectEdge($event, item)">
                  <!-- la etiqueta de una salida de decisión va en pastilla: se lee sobre la rejilla -->
                  <rect
                    [attr.x]="item.line.labelX - 22"
                    [attr.y]="item.line.labelY - 10"
                    width="44"
                    height="20"
                    rx="6"
                    class="fill-card flow-edge-label"
                    stroke-width="1"
                  />
                  <text
                    [attr.x]="item.line.labelX"
                    [attr.y]="item.line.labelY + 4"
                    text-anchor="middle"
                    [class]="
                      'text-[10px] font-medium ' + (isEdgeSelected(item) ? 'fill-primary' : 'fill-muted-foreground')
                    "
                  >
                    {{ item.label }}
                  </text>
                </g>
              }
            }
            @if (linking(); as ghost) {
              <line
                [attr.x1]="ghost.x1"
                [attr.y1]="ghost.y1"
                [attr.x2]="ghost.x2"
                [attr.y2]="ghost.y2"
                class="stroke-primary"
                stroke-width="1.5"
                [attr.stroke-dasharray]="edgeDash()"
                marker-end="url(#flow-arrow)"
                data-testid="flow-ghost-edge"
              />
            }
          </svg>

          <!-- borrar lo seleccionado (también tecla Supr) -->
          @if (deleteButtonAt(); as at) {
            <button
              type="button"
              class="bg-destructive text-destructive-foreground hover:bg-destructive/85 absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs leading-none shadow transition-colors"
              [style.left.px]="at.x"
              [style.top.px]="at.y"
              data-testid="flow-delete-selected"
              title="Eliminar (Supr)"
              (click)="$event.stopPropagation(); deleteSelected()"
            >
              ×
            </button>
          }

          <!-- insertar EN el tramo seleccionado: partirlo por un paso o por una condición
             (encadenar decisiones sin cirugía de borrar la rama y enlazar dos veces) -->
          @if (insertButtonsAt(); as at) {
            <div class="absolute z-20 flex -translate-x-1/2 gap-1" [style.left.px]="at.x" [style.top.px]="at.y">
              <button
                type="button"
                class="studio-ui bg-card hover:border-foreground/45 rounded-full border px-2 py-0.5 text-[10px] shadow"
                data-testid="flow-insert-step"
                title="Insertar un paso en el tramo"
                (click)="$event.stopPropagation(); insertOnSelected('step')"
              >
                + paso
              </button>
              <button
                type="button"
                class="studio-ui bg-card hover:border-foreground/45 rounded-full border px-2 py-0.5 text-[10px] shadow"
                data-testid="flow-insert-decision"
                title="Insertar una condición en el tramo"
                (click)="$event.stopPropagation(); insertOnSelected('decision')"
              >
                + condición
              </button>
            </div>
          }

          <!-- TARJETAS DE ACCIONES: las acciones seguidas de una rama se leen juntas,
             con sus filas numeradas y su «+ Acción», como la RAMA SÍ de la referencia -->
          @for (card of cards(); track card.group.id) {
            <div
              class="group/card studio-ui absolute"
              [style.left.px]="card.box.x"
              [style.top.px]="card.box.y"
              [style.width.px]="card.box.width"
              [attr.data-testid]="'flow-card-' + card.group.id"
              (pointerenter)="hoverBlock(card.group.id)"
              (pointerleave)="hoverBlock(null)"
              (click)="selectNode($event, card.group.id)"
            >
              <div
                class="bg-card flow-card flow-card-steps overflow-hidden rounded-[12px] border transition-colors"
                [class.ring-2]="isNodeSelected(card.group.id)"
                [class.is-target]="isLinkTarget(card.group.id)"
              >
                <!-- cabecera: qué es y cuántas acciones lleva; y es el asa de arrastre. La rama
                     NO se repite aquí: ya la dice la pastilla de la flecha que entra (2026-08-13) -->
                <div
                  class="flex cursor-move items-center gap-2 px-2.5"
                  [style.height.px]="groupMetrics.headerHeight"
                  (pointerdown)="startDrag($event, card.group.id, card.box)"
                  (click)="selectNode($event, card.group.id)"
                >
                  <span
                    class="flow-branch-chip rounded-[5px] border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em]"
                    [attr.data-testid]="'flow-card-branch-' + card.group.id"
                  >
                    acciones
                  </span>
                  <span class="text-muted-foreground text-[10px]">{{ card.group.steps.length }}</span>
                </div>

                @for (step of card.group.steps; track step.id; let i = $index) {
                  <div
                    class="group/row hover:bg-accent/40 relative flex items-center gap-2 border-t px-2.5 transition-colors"
                    [class.bg-accent]="isNodeSelected(step.id)"
                    [class.opacity-50]="rowDrag()?.stepId === step.id"
                    [style.height.px]="groupMetrics.rowHeight"
                    [attr.data-testid]="'flow-step-' + step.id"
                    (click)="selectNode($event, step.id)"
                    (dblclick)="startEdit(step)"
                  >
                    <!-- la guía de dónde va a caer la fila que se arrastra: se pinta ENCIMA de
                         la fila que ocupará el puesto, y en la última, debajo -->
                    @if (dropGuideAt(card.group, i); as borde) {
                      <span
                        class="bg-primary pointer-events-none absolute inset-x-0 z-20 h-0.5"
                        [class.top-0]="borde === 'arriba'"
                        [class.bottom-0]="borde === 'abajo'"
                        data-testid="flow-step-drop-guide"
                      ></span>
                    }
                    <!-- asa de la FILA: única zona que la arrastra, para no pelearse con el
                         clic de seleccionar, el doble clic de editar ni el arrastre de la tarjeta -->
                    <span
                      class="text-muted-foreground hover:text-foreground -ml-1.5 shrink-0 cursor-grab select-none text-[11px] leading-none opacity-0 transition-opacity group-hover/row:opacity-100"
                      [attr.data-testid]="'flow-step-grip-' + step.id"
                      title="Arrástrame para cambiar el orden de las acciones"
                      (pointerdown)="startRowDrag($event, card.group, step.id, i)"
                      (click)="$event.stopPropagation()"
                      (dblclick)="$event.stopPropagation()"
                      >⠿</span
                    >
                    <span
                      class="flow-step-number flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold"
                      [attr.data-testid]="'flow-step-number-' + step.id"
                    >
                      {{ i + 1 }}
                    </span>
                    @if (editing() === step.id) {
                      <div class="flex min-w-0 flex-1 flex-col gap-1" (click)="$event.stopPropagation()">
                        <input
                          class="border-input rounded border px-1.5 py-0.5 text-xs"
                          name="stepText"
                          [ngModel]="step.text"
                          (ngModelChange)="store.updateFlowNode(activeName()!, step.id, { text: $event })"
                          (keydown.enter)="confirmEdit()"
                          data-testid="flow-node-text-input"
                        />
                        <app-select
                          class="block"
                          size="sm"
                          [options]="entityOptions()"
                          [ngModel]="step.entity ?? NONE"
                          [ngModelOptions]="{ standalone: true }"
                          (ngModelChange)="setEntity(step.id, $event)"
                          data-testid="flow-node-entity-select"
                        />
                      </div>
                    } @else {
                      <!-- lo que se recorta se lee entero acercando el cursor: las acciones son
                           los textos largos del lienzo («…subestado Enviada_Operaciones») -->
                      <span class="min-w-0 flex-1">
                        <span
                          class="block truncate text-[13px] font-semibold leading-tight"
                          [attr.title]="step.text"
                          [attr.data-testid]="'flow-step-text-' + step.id"
                          >{{ step.text }}</span
                        >
                        @if (step.entity) {
                          <span
                            class="text-muted-foreground block truncate text-[11px]"
                            [attr.title]="step.entity"
                            [attr.data-testid]="'flow-step-entity-' + step.id"
                            >{{ step.entity }}
                            @if (step.transition) {
                              <!-- convergido (spec 44): este paso ejecuta un verbo de la máquina —
                                   sale generado con cuerpo real y endpoint, sin hueco @ai -->
                              <span
                                class="rounded-sm px-1 font-medium"
                                style="color: #f15539; background: rgba(241, 85, 57, 0.1)"
                                [attr.title]="'Ejecuta la transición «' + step.transition + '» de ' + step.entity"
                                [attr.data-testid]="'flow-step-transition-' + step.id"
                                >⚡ {{ step.transition }}</span
                              >
                            } @else if (statusWithoutMachine(step)) {
                              <!-- el eslabón invisible (spec 74): el paso habla de un estado
                                   que nadie modela — sin máquina no converge nunca -->
                              <span
                                class="text-muted-foreground rounded-sm border border-dashed px-1 opacity-70"
                                [attr.title]="noStateTitle(step)"
                                [attr.data-testid]="'flow-nostate-' + step.id"
                                >estado sin máquina</span
                              >
                            }
                          </span>
                        }
                      </span>
                      <button
                        type="button"
                        class="text-muted-foreground hover:text-destructive shrink-0 text-xs opacity-0 transition-opacity group-hover/row:opacity-100"
                        [attr.data-testid]="'flow-step-remove-' + step.id"
                        title="Quitar la acción"
                        (click)="$event.stopPropagation(); removeStep(step.id)"
                      >
                        ×
                      </button>
                    }
                  </div>
                }

                <!-- el «+ Acción» de la referencia: aquí se mete un paso, no en la flecha -->
                <button
                  type="button"
                  class="text-muted-foreground hover:bg-accent/40 hover:text-foreground flex w-full items-center gap-1.5 border-t px-2.5 text-left text-[11px] transition-colors"
                  [style.height.px]="groupMetrics.footerHeight"
                  [attr.data-testid]="'flow-card-add-' + card.group.id"
                  (click)="$event.stopPropagation(); addAction(card.group)"
                >
                  <span class="text-[13px] leading-none">+</span> Acción
                </button>
              </div>

              <!-- puerto de ENTRADA: el círculo BLANCO del prototipo. Cuando la flecha va a
                   caer aquí no se rellena: engorda el borde y crece un poco. -->
              <span
                class="border-border bg-card pointer-events-none absolute -left-1.5 top-1/2 z-20 size-3 -translate-y-1/2 rounded-full border transition-all"
                [style.opacity]="portsOn() ? 1 : 0"
                [class.border-foreground]="isLinkTarget(card.group.id)"
                [class.border-2]="isLinkTarget(card.group.id)"
                [class.scale-125]="isLinkTarget(card.group.id)"
                [attr.data-testid]="'flow-port-' + card.group.id"
              ></span>

              <!-- asa de conexión: se ve al pasar por encima y se arrastra hasta otro bloque -->
              <button
                type="button"
                class="bg-primary ring-background absolute -right-2 top-1/2 z-20 size-3.5 -translate-y-1/2 cursor-crosshair rounded-full opacity-0 ring-2 transition-opacity group-hover/card:opacity-100"
                [class.opacity-100]="linkFrom() === card.group.id"
                [attr.data-testid]="'flow-link-handle-' + card.group.id"
                title="Púlsame y luego pulsa el bloque con el que conectar (o arrástrame hasta él)"
                (pointerdown)="startLink($event, card.group.id, card.box)"
              ></button>
            </div>
          }

          @for (item of pills(); track item.node.id) {
            <div
              class="group studio-ui absolute flex cursor-move items-center px-2"
              [class.text-background]="item.node.kind === 'start' || item.node.kind === 'end'"
              [style.left.px]="item.box.x"
              [style.top.px]="item.box.y"
              [style.width.px]="item.box.width"
              [style.height.px]="item.box.height"
              [attr.data-testid]="'flow-node-' + item.node.id"
              [attr.data-kind]="item.node.kind"
              (pointerdown)="startDrag($event, item.node.id, item.box)"
              (pointerenter)="hoverBlock(item.node.id)"
              (pointerleave)="hoverBlock(null)"
              (click)="selectNode($event, item.node.id)"
              (dblclick)="startEdit(item.node)"
            >
              @if (item.node.kind === 'decision') {
                <!-- el rombo va en SVG: con clip-path el recorte se come el borde, y el borde
                   negro es justo lo que dice «aquí se decide» en la referencia -->
                <svg
                  class="absolute inset-0 overflow-visible"
                  [attr.viewBox]="'0 0 ' + item.box.width + ' ' + item.box.height"
                  [attr.width]="item.box.width"
                  [attr.height]="item.box.height"
                >
                  <!-- un cuadrado con las esquinas redondeadas, girado 45°: así el rombo
                       tiene las puntas romas del prototipo (un polygon las deja en pico) -->
                  <rect
                    [attr.x]="diamondInset(item.box)"
                    [attr.y]="diamondInset(item.box)"
                    [attr.width]="diamondSide(item.box)"
                    [attr.height]="diamondSide(item.box)"
                    [attr.rx]="decisionMetrics.corner"
                    [attr.transform]="'rotate(45 ' + item.box.width / 2 + ' ' + item.box.height / 2 + ')'"
                    class="flow-diamond"
                    [class.stroke-primary]="isNodeSelected(item.node.id)"
                    [attr.stroke-width]="isNodeSelected(item.node.id) ? 3 : isLinkTarget(item.node.id) ? 2.5 : 1.5"
                  />
                </svg>
              } @else {
                <div
                  class="bg-card flow-card absolute inset-0 rounded-[10px] border"
                  [class.ring-2]="isNodeSelected(item.node.id)"
                  [class.border-foreground]="isLinkTarget(item.node.id)"
                  [class.flow-card-start]="item.node.kind === 'start'"
                  [class.flow-card-end]="item.node.kind === 'end'"
                ></div>
              }

              <!-- puerto de ENTRADA: el círculo del prototipo. Se enciende cuando la flecha
                   que se está arrastrando va a caer aquí, para saber a qué se va a unir. -->
              <span
                class="border-border bg-card pointer-events-none absolute -left-1.5 top-1/2 z-20 size-3 -translate-y-1/2 rounded-full border transition-all"
                [style.opacity]="portsOn() ? 1 : 0"
                [class.border-foreground]="isLinkTarget(item.node.id)"
                [class.border-2]="isLinkTarget(item.node.id)"
                [class.scale-125]="isLinkTarget(item.node.id)"
                [attr.data-testid]="'flow-port-' + item.node.id"
              ></span>

              <!-- asa de conexión: se ve al pasar por encima y se arrastra hasta otro bloque -->
              <button
                type="button"
                class="bg-primary ring-background absolute -right-2 top-1/2 z-20 size-3.5 -translate-y-1/2 cursor-crosshair rounded-full opacity-0 ring-2 transition-opacity group-hover:opacity-100"
                [class.opacity-100]="linkFrom() === item.node.id"
                [attr.data-testid]="'flow-link-handle-' + item.node.id"
                title="Púlsame y luego pulsa el bloque con el que conectar (o arrástrame hasta él)"
                (pointerdown)="startLink($event, item.node.id, item.box)"
              ></button>

              @if (editing() === item.node.id) {
                <div class="z-10 flex flex-col items-stretch gap-1" (click)="$event.stopPropagation()">
                  <input
                    class="border-input rounded border px-1.5 py-0.5 text-xs"
                    name="nodeText"
                    [ngModel]="item.node.text"
                    (ngModelChange)="store.updateFlowNode(activeName()!, item.node.id, { text: $event })"
                    (keydown.enter)="confirmEdit()"
                    data-testid="flow-node-text-input"
                  />
                  <app-select
                    class="block"
                    size="sm"
                    [options]="entityOptions()"
                    [ngModel]="item.node.entity ?? NONE"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="setEntity(item.node.id, $event)"
                    data-testid="flow-node-entity-select"
                  />
                </div>
              } @else {
                <!-- como en la referencia: etiqueta de tipo arriba, el texto debajo, y el
                   número de orden en los pasos para leer el proceso «1, 2, 3» -->
                <span
                  class="z-10 flex min-w-0 items-center gap-2 px-1"
                  [class.justify-center]="item.node.kind === 'decision'"
                  [class.w-full]="item.node.kind === 'decision'"
                  [class.text-center]="item.node.kind === 'decision'"
                  [class.px-5]="item.node.kind === 'decision'"
                >
                  <span class="min-w-0">
                    <!-- el rombo llevaba un «si» encima que se leía como el «sí» de las
                         ramas: ahora dice su tipo, CONDICIÓN, igual que el disparador y el fin -->
                    @if (item.node.kind !== 'step') {
                      <span
                        class="block text-[9px] font-semibold uppercase tracking-[0.12em] opacity-60"
                        [attr.data-testid]="'flow-node-kind-' + item.node.id"
                      >
                        {{ kindLabel(item.node.kind) }}
                      </span>
                    }
                    <!-- dentro del rombo el ancho útil es poco: el texto se parte en líneas
                       en vez de cortarse, como el «stock < 10» de la referencia. Las palabras
                       que no caben parten también (medido en el navegador: la caja del texto
                       está dentro del rombo, pero un «PLAZO_AVISO_PRORROGA» se pintaba fuera
                       de su propia caja), y de las cuatro líneas en adelante se recorta con
                       puntos suspensivos: el título lleva el texto entero. -->
                    <span
                      [class]="
                        item.node.kind === 'decision'
                          ? 'line-clamp-4 break-words text-[11px] font-semibold leading-tight'
                          : 'block truncate font-semibold leading-tight'
                      "
                      [attr.title]="item.node.text"
                      [attr.data-testid]="'flow-node-text-' + item.node.id"
                      >{{ item.node.text }}</span
                    >
                    @if (item.node.entity) {
                      <span
                        class="block truncate text-[11px] font-normal opacity-60"
                        [attr.title]="item.node.entity"
                        [attr.data-testid]="'flow-node-entity-' + item.node.id"
                        >{{ item.node.entity }}</span
                      >
                    }
                    @if (statusWithoutMachine(item.node)) {
                      <span
                        class="text-muted-foreground block truncate rounded-sm border border-dashed px-1 text-[10px] opacity-70"
                        [attr.title]="noStateTitle(item.node)"
                        [attr.data-testid]="'flow-nostate-' + item.node.id"
                        >estado sin máquina</span
                      >
                    }
                  </span>
                  <!-- convergencia visible (spec 74): el paso que ejecuta un verbo ES un botón
                       de la ficha; si la transición está oculta, hay endpoint pero no botón -->
                  @if (item.node.transition; as verb) {
                    <ng-icon
                      class="shrink-0"
                      [class.opacity-40]="transitionHidden(item.node)"
                      [name]="transitionHidden(item.node) ? 'lucideZapOff' : 'lucideZap'"
                      size="12"
                      [attr.title]="convergenceTitle(item.node)"
                      [attr.data-testid]="'flow-node-button-' + item.node.id"
                    />
                  }
                </span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    /* El naranja de la casa (--flow-accent, global en styles.css) lo usan la rejilla
       y el cierre del proceso. */
    :host {
      /* El morado de la bifurcación: el complementario del naranja de la casa, así la
         condición se distingue de las acciones sin salirse de la paleta. Sobre el papel
         claro va el violeta macizo; el lavanda de la captura se pierde en el crema. */
      --flow-decision: #7c3aed;
      /* El fondo es un tinte del mismo morado sobre el papel: sube el rombo del fondo sin
         tapar su texto. En oscuro NO se calcula: es el valor que fijó Alfonso. */
      --flow-decision-fill: color-mix(in oklab, var(--flow-decision) 10%, var(--card));
    }
    /* En oscuro el violeta macizo se enfanga contra el papel negro: ahí mandan el LAVANDA y
       el fondo que fijó Alfonso sobre la captura (2026-08-13). */
    :host-context(.dark) {
      --flow-decision: #a88cf6;
      --flow-decision-fill: #241c32;
    }
    /* Misma rejilla de PUNTOS que los lienzos de Modelo y Vistas (decisión de Alfonso,
       2026-08-11): los tres son el mismo papel, así que se dibujan igual — celda de 24px
       y punto en el naranja de la casa al 35%. */
    .flow-grid {
      background-image: radial-gradient(
        circle,
        color-mix(in oklab, var(--flow-accent) 35%, transparent) 1.4px,
        transparent 1.4px
      );
      background-size: 24px 24px;
    }
    /* La pastilla del sí/no se lee como un bloque más: borde algo más intenso que el
       token --border (que sobre las flechas se perdía) y la misma sombra que las cajas. */
    .flow-edge-label {
      stroke: color-mix(in oklab, var(--foreground) 35%, var(--border));
      filter: drop-shadow(0 1px 2px oklch(0 0 0 / 8%)) drop-shadow(0 6px 14px oklch(0 0 0 / 10%));
    }
    /* La condición va en MORADO: es el único punto del flujo donde el proceso se bifurca,
       y con el borde negro se leía igual que una acción más. El relleno lleva la dosis
       mínima del mismo color para que el rombo se vea teñido sin tapar su texto.
       La sombra es la misma que las píldoras: flota sobre el papel igual que ellas. */
    .flow-diamond {
      fill: var(--flow-decision-fill);
      stroke: var(--flow-decision);
      filter: drop-shadow(0 1px 2px oklch(0 0 0 / 8%)) drop-shadow(0 6px 14px oklch(0 0 0 / 10%));
    }
    /* Seleccionado manda el color de selección; dos clases para ganarle a la utilidad. */
    .flow-diamond.stroke-primary {
      stroke: var(--primary);
    }
    /* Los nodos flotan sobre la rejilla, como las cajas del modelo. */
    .flow-card {
      box-shadow:
        0 1px 2px oklch(0 0 0 / 8%),
        0 6px 14px -6px oklch(0 0 0 / 14%),
        0 16px 32px -20px oklch(0 0 0 / 22%);
    }
    /* El arranque del proceso va en tinta: se ve de un vistazo por dónde empieza. */
    .flow-card-start {
      background-color: var(--foreground);
      border-color: transparent;
    }
    /* Las tarjetas de acciones llevan el naranja en dos dosis: un filo cálido al 45 %, que
       las emparenta con los puntos del papel (que van al 35 %), y un canto macizo a la
       IZQUIERDA, que es por donde entra la flecha —el mismo lado donde vive el puerto—. */
    .flow-card-steps {
      border-color: color-mix(in oklab, var(--flow-accent) 45%, transparent);
      border-left: 3px solid var(--flow-accent);
    }
    /* Y las marcas de la tarjeta —la rama y el número de la fila— también llevan el color:
       es la dosis más pequeña de las tres y la que más se parece al prototipo de 12A, que
       tiñe la etiqueta de la rama y deja el texto de la acción en negro. */
    .flow-branch-chip {
      color: var(--flow-accent);
      border-color: color-mix(in oklab, var(--flow-accent) 40%, transparent);
    }
    .flow-step-number {
      background-color: color-mix(in oklab, var(--flow-accent) 15%, transparent);
      color: var(--flow-accent);
    }
    /* Destino de la flecha: manda el negro, y por eso va DESPUÉS (misma especificidad). */
    .flow-card-steps.is-target {
      border-color: var(--foreground);
    }
    /* Y el final va en el naranja de la casa, macizo: inicio y fin se distinguen sin
       leerlos, y sin que el fin parezca un aviso —con el tinte claro y el borde de color
       se leía como un error, no como el cierre del proceso—. */
    .flow-card-end {
      background-color: var(--flow-accent);
      border-color: transparent;
    }
  `
})
export class FlowViewComponent {
  protected readonly store = inject(DesignStore)
  protected readonly active = inject(ActiveViewService)
  private readonly viewport = inject(CanvasViewportService)
  protected readonly orientation = inject(FlowOrientationService)

  constructor() {
    // Un bloque NUEVO de la paleta aterriza donde el ojo mira. El layout manda lo
    // suelto a la capa de los huérfanos (tras la capa más profunda), y con un flujo
    // de varias capas eso cae fuera del viewport: «pulso Condición y no pasa nada».
    effect(() => {
      const flow = this.activeFlow()
      if (!flow) return
      const conectados = new Set(flow.edges.flatMap(edge => [edge.from, edge.to]))
      const sueltos = flow.nodes.filter(node => !conectados.has(node.id))
      if (sueltos.length) untracked(() => this.placeLoose(flow.name, sueltos))
    })
  }

  /** Coloca los bloques sueltos que aún no tienen sitio, centrados en la cámara. */
  private placeLoose(flowName: string, sueltos: FlowNode[]): void {
    const sinSitio = sueltos.filter(node => !this.manual()[`${flowName}:${node.id}`])
    if (!sinSitio.length) return
    this.freezePositions()

    const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
    const size = caja?.width ? { width: caja.width, height: caja.height } : FLOW_CANVAS_FALLBACK
    const camara = this.viewport.of('flows')()
    const pendientes = new Set(sinSitio.map(node => node.id))
    // lo ya dibujado cuenta como ocupado, MENOS los que van a recolocarse ahora
    const ocupadas = [...this.boxes()].filter(([id]) => !pendientes.has(id)).map(([, box]) => box)

    this.manual.update(manual => {
      const colocadas = { ...manual }
      for (const node of sinSitio) {
        // el tamaño real ya está dibujado (un paso suelto es una tarjeta, no una píldora)
        const propio = this.boxes().get(node.id)
        const nodeSize = propio ? { width: propio.width, height: propio.height } : flowNodeSize(node.kind)
        const position = flowLoosePosition(camara, size, ocupadas, nodeSize)
        colocadas[`${flowName}:${node.id}`] = position
        ocupadas.push({ ...position, ...nodeSize })
      }
      return colocadas
    })
  }

  /** Posiciones arrastradas por flujo:nodo — SOLO memoria de sesión (layout cosmético). */
  private readonly manual = signal<Record<string, NodePosition>>({})

  protected readonly selected = signal<FlowSelection | null>(null)
  protected readonly editing = signal<string | null>(null)

  /** «Sin entidad» es una elección de la lista, no un hueco: necesita su propio valor. */
  protected readonly NONE = NONE
  protected readonly entityOptions = computed<AppSelectOption[]>(() => [
    { value: NONE, label: '— sin entidad —' },
    ...this.store.resources().map(resource => ({ value: resource.name, label: resource.labelSingular }))
  ])
  /** Acción recién creada y aún sin nombre: se descarta si se pulsa fuera sin tocarla. */
  private readonly draft = signal<string | null>(null)
  protected readonly linking = signal<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  /** Bloque bajo el cursor mientras se arrastra una flecha: se resalta para saber dónde cae. */
  protected readonly linkTarget = signal<string | null>(null)
  /**
   * Origen ARMADO: pulsar el asa sin arrastrar deja la conexión a medias y el siguiente
   * clic en un bloque la cierra. Arrastrar con precisión hasta el puerto era el gesto
   * difícil; con dos clics no hay puntería que valga.
   */
  protected readonly linkFrom = signal<string | null>(null)
  /** Fila en el aire: su tarjeta, qué acción es, de qué puesto sale y a cuál va a caer. */
  protected readonly rowDrag = signal<{ groupId: string; stepId: string; from: number; to: number } | null>(null)

  /** El flujo dibujado lo elige el raíl; aquí solo se lee. */
  protected readonly activeName = this.active.flow

  protected readonly activeFlow = computed<BusinessFlow | null>(
    () => this.store.flows().find(f => f.name === this.activeName()) ?? null
  )

  protected kindLabel(kind: FlowNodeKind): string {
    return FLOW_KIND_LABELS[kind]
  }

  /** La transición que ejecuta el paso, buscada en la máquina de su entidad (spec 74). */
  private machineTransition(node: FlowNode) {
    const machine = this.store.resources().find(r => r.name === node.entity)?.state
    return machine?.transitions.find(t => t.name === node.transition)
  }

  protected transitionHidden(node: FlowNode): boolean {
    return this.machineTransition(node)?.hidden === true
  }

  /** El paso anota un estado pero su entidad no tiene máquina: no convergerá nunca (spec 74). */
  protected statusWithoutMachine(node: Pick<FlowNode, 'entity' | 'status'>): boolean {
    if (!node.status || !node.entity) return false
    return !this.store.resources().find(r => r.name === node.entity)?.state
  }

  protected noStateTitle(node: Pick<FlowNode, 'entity' | 'status'>): string {
    return (
      `El paso deja ${node.entity} en «${node.status}», pero ${node.entity} no tiene máquina de estados: ` +
      `sin ella este paso no puede converger (ni botón ni endpoint). Promuévela en Modelo.`
    )
  }

  protected convergenceTitle(node: FlowNode): string {
    const transition = this.machineTransition(node)
    const label = transition?.label ?? node.transition
    return transition?.hidden
      ? `Ejecuta «${label}» (endpoint emitido, sin botón: la transición está oculta en la ficha)`
      : `Botón «${label}» en la ficha de ${node.entity}`
  }

  /** Las medidas de la tarjeta las manda el dominio: la geometría y el CSS no pueden discrepar. */
  protected readonly groupMetrics = FLOW_GROUP

  /**
   * Lo que se dibuja NO es el flujo tal cual: las acciones consecutivas se agrupan en
   * una tarjeta y el grafo se condensa (cada tarjeta cuenta como un vértice). Así el
   * lienzo tiene muchas menos flechas y las que quedan son las que importan.
   */
  private readonly diagram = computed(() => {
    const flow = this.activeFlow()
    if (!flow) return null
    const groups = flowGroups(flow)
    const condensed = flowCondensed(flow, groups)
    const rows = new Map(groups.map(group => [group.id, group.steps.length]))
    const positions = flowLayout(condensed, this.orientation.value(), this.frozenOf(flow.name), id => {
      const filas = rows.get(id)
      return filas === undefined ? undefined : flowGroupBox({ x: 0, y: 0 }, filas)
    })
    // sin start el layout viene vacío (el gate ya lo rechaza): que el lienzo no se caiga
    const at = (id: string) => positions[id] ?? { x: FLOW_GRID.margin, y: FLOW_GRID.margin }

    const cards = groups.map(group => ({ group, box: flowGroupBox(at(group.id), group.steps.length) }))
    const pills = condensed.nodes
      .filter(node => !rows.has(node.id))
      .map(node => ({ node, box: flowNodeBox(at(node.id), node.kind) }))

    return { condensed, cards, pills }
  })

  protected readonly cards = computed(() => this.diagram()?.cards ?? [])
  protected readonly pills = computed<FlowDiagramNode[]>(() => this.diagram()?.pills ?? [])

  /** Todas las cajas dibujadas, por el id que las representa en el grafo condensado. */
  private readonly boxes = computed<Map<string, NodeBox>>(() => {
    const diagram = this.diagram()
    return new Map([
      ...(diagram?.cards ?? []).map(card => [card.group.id, card.box] as const),
      ...(diagram?.pills ?? []).map(pill => [pill.node.id, pill.box] as const)
    ])
  })

  protected readonly decisionMetrics = FLOW_DECISION

  /**
   * El rombo es un CUADRADO girado 45°: su lado es la diagonal partida por √2, y así las
   * esquinas redondeadas del `rx` salen romas como en el prototipo. Con un polygon las
   * puntas quedaban en pico y no había forma de redondearlas.
   */
  protected diamondSide(box: NodeBox): number {
    return box.width / Math.SQRT2
  }

  protected diamondInset(box: NodeBox): number {
    return (box.width - this.diamondSide(box)) / 2
  }

  /** El bloque al que va a caer la flecha que se está arrastrando. */
  protected isLinkTarget(id: string): boolean {
    return this.linkTarget() === id
  }

  /** Posiciones ya colocadas de un flujo, sin el prefijo del nombre. */
  private frozenOf(flowName: string): Record<string, NodePosition> {
    return Object.fromEntries(
      Object.entries(this.manual())
        .filter(([key]) => key.startsWith(`${flowName}:`))
        .map(([key, pos]) => [key.slice(flowName.length + 1), pos])
    )
  }

  /**
   * Congela lo dibujado ANTES de tocar la topología. El layout por capas deduce la
   * posición de la distancia al inicio, así que borrar o insertar un paso movía de
   * columna a todo lo que venía detrás. Congelando primero, la edición solo coloca
   * lo nuevo y lo que ya estaba se queda donde el ojo lo tenía.
   */
  private freezePositions(): void {
    const flow = this.activeName()
    if (!flow) return
    const actuales = Object.fromEntries([...this.boxes()].map(([id, box]) => [`${flow}:${id}`, { x: box.x, y: box.y }]))
    this.manual.update(manual => ({ ...actuales, ...manual }))
  }

  protected readonly edges = computed<FlowDiagramEdge[]>(() => {
    const boxes = this.boxes()
    const dibujado = this.diagram()?.condensed
    const alternates = dibujado ? flowAlternateEdges(dibujado) : new Set<string>()
    const trazadas = new Set((dibujado?.edges ?? []).map(edge => `${edge.from}→${edge.to}`))
    return (dibujado?.edges ?? []).flatMap(edge => {
      const from = boxes.get(edge.from)
      const to = boxes.get(edge.to)
      return from && to
        ? [
            {
              from: edge.from,
              to: edge.to,
              ...(edge.label ? { label: edge.label } : {}),
              alternate: alternates.has(`${edge.from}→${edge.to}`),
              // con arista de vuelta, cada trazo se arquea hacia su lado: calcados no se leen
              line: flowEdgeCurve(from, to, this.orientation.value(), trazadas.has(`${edge.to}→${edge.from}`))
            }
          ]
        : []
    })
  })

  /** Tamaño del SVG de aristas: cubre el contenido, ya no dimensiona el lienzo. */
  protected readonly surface = computed(() => canvasExtent([...this.boxes().values()]))

  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewportEl')
  protected readonly camera = this.viewport.of('flows')
  protected readonly panning = signal(false)

  protected readonly worldTransform = computed(() => {
    const { pan, zoom } = this.camera()
    return `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
  })

  /**
   * El patrón de la rama alternativa, en unidades del mundo: el lienzo se escala
   * entero con el zoom, así que un «5 4» fijo se aprieta al alejarse hasta leerse
   * como trazo continuo (al 38% de encuadrar un flujo grande ya no se ve la raya).
   * Compensando la escala, en pantalla mide siempre 5/4.
   */
  protected readonly edgeDash = computed(() => {
    const zoom = this.camera().zoom
    return `${5 / zoom} ${4 / zoom}`
  })

  protected readonly gridOffset = computed(() => {
    const { pan } = this.camera()
    return `${pan.x}px ${pan.y}px`
  })
  protected readonly gridSize = computed(() => {
    const celda = 24 * this.camera().zoom
    return `${celda}px ${celda}px`
  })

  /** Arrastrar el PAPEL mueve la cámara; sobre un nodo o un control, no. */
  protected startPan(down: PointerEvent): void {
    if (down.button !== 0) return
    const target = down.target as HTMLElement
    // ni los bloques, ni los controles, ni las aristas: capturar el puntero aquí se comía su clic
    const interactivo =
      '[data-testid^="flow-node-"], [data-testid^="flow-card-"], [data-testid^="flow-edge-"], button, input, select, [data-testid="canvas-controls"]'
    if (target.closest(interactivo)) return

    const element = down.currentTarget as HTMLElement
    element.setPointerCapture(down.pointerId)
    this.panning.set(true)
    let last = { x: down.clientX, y: down.clientY }

    const onMove = (move: PointerEvent) => {
      this.viewport.panBy('flows', { x: move.clientX - last.x, y: move.clientY - last.y })
      last = { x: move.clientX, y: move.clientY }
    }
    const onUp = () => {
      this.panning.set(false)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
    }
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onUp)
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
      const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
      const punto = { x: event.clientX - (caja?.left ?? 0), y: event.clientY - (caja?.top ?? 0) }
      this.viewport.zoomBy('flows', event.deltaY < 0 ? 1.08 : 1 / 1.08, punto)
      return
    }
    this.viewport.panBy('flows', { x: -event.deltaX, y: -event.deltaY })
  }

  protected fitToView(): void {
    const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
    if (!caja) return
    this.viewport.fit('flows', [...this.boxes().values()], { width: caja.width, height: caja.height })
  }

  /**
   * «+ Acción»: la acción nueva se cuelga del último paso de la tarjeta y queda elegida
   * y en edición, para escribirle el nombre sin buscar dónde pulsar.
   */
  protected addAction(group: FlowGroup): void {
    const flow = this.activeName()
    if (!flow) return
    this.freezePositions()
    const tail = group.steps[group.steps.length - 1]
    if (!this.store.appendFlowStep(flow, tail.id, NEW_ACTION_TEXT)) return
    const creado = this.store
      .flows()
      .find(f => f.name === flow)
      ?.nodes.at(-1)
    if (!creado) return
    this.active.selectFlowNode(creado.id)
    this.selected.set({ kind: 'node', id: creado.id })
    this.editing.set(creado.id)
    // queda en BORRADOR: si nadie la nombra y se pulsa fuera, se descarta
    this.draft.set(creado.id)
  }

  /** Quitar una fila de la tarjeta: es el mismo borrado con recosido de siempre. */
  protected removeStep(id: string): void {
    const flow = this.activeName()
    if (!flow) return
    this.freezePositions()
    this.inheritCardPosition(flow, id)
    if (this.store.removeFlowNode(flow, id)) this.forgetPosition(flow, id)
    if (this.selected()?.kind === 'node') this.selected.set(null)
  }

  /**
   * La tarjeta la representa su primer paso: si es ese el que se va, el siguiente hereda
   * su sitio. Sin esto, borrar la primera fila haría saltar la tarjeta a otra columna.
   */
  private inheritCardPosition(flowName: string, id: string): void {
    const card = this.cards().find(item => item.group.id === id)
    const heredero = card?.group.steps[1]
    if (!heredero) return
    this.manual.update(manual => ({ ...manual, [`${flowName}:${heredero.id}`]: { x: card.box.x, y: card.box.y } }))
  }

  protected selectNode(event: MouseEvent, id: string): void {
    event.stopPropagation()
    // con una conexión armada, el clic no elige: cierra la flecha
    const armado = this.linkFrom()
    if (armado) {
      this.connect(armado, this.blockOf(id))
      this.cancelLink()
      return
    }
    this.selected.set({ kind: 'node', id })
    // el inspector de la derecha edita lo elegido aquí
    this.active.selectFlowNode(id)
  }

  /** El bloque que representa a un id en el lienzo: una fila responde por su tarjeta. */
  private blockOf(id: string): string {
    if (this.boxes().has(id)) return id
    return this.cards().find(card => card.group.steps.some(step => step.id === id))?.group.id ?? id
  }

  /**
   * Cambiar de eje es lo CONTRARIO de congelar: se pide recolocar el proceso para leerlo
   * en columna, así que las posiciones congeladas se sueltan y el layout vuelve a mandar.
   * Sin esto, el botón no movía nada en cuanto habías editado el flujo una vez.
   */
  protected toggleOrientation(): void {
    this.manual.set({})
    this.orientation.toggle()
  }

  /** Con una conexión a medias, pasar por encima de un bloque lo marca como destino. */
  protected hoverBlock(id: string | null): void {
    if (this.linkFrom()) this.linkTarget.set(id === this.linkFrom() ? null : id)
  }

  /**
   * ¿Se ven los puertos? Solo mientras hay una flecha en el aire, que es para lo que
   * sirven: RECIBIRLA. Pasar por encima de un bloque enseña su asa negra —la de sacar
   * la flecha— y nada más; el puerto ahí no dice nada.
   */
  protected portsOn(): boolean {
    return !!this.linking() || !!this.linkFrom()
  }

  /** Esc suelta lo que haya a medias: la flecha en el aire y la edición abierta. */
  protected onEscape(): void {
    this.cancelLink()
    this.stopEditing()
  }

  /** Enter da por bueno el nombre, incluso el de partida: lo escrito manda. */
  protected confirmEdit(): void {
    this.draft.set(null)
    this.editing.set(null)
  }

  protected cancelLink(): void {
    this.linkFrom.set(null)
    this.linkTarget.set(null)
  }

  /**
   * Clic en el PAPEL: suelta lo elegido, en el lienzo y en el inspector. Se escucha en el
   * viewport y no en el mundo porque el mundo mide 0×0 —sus hijos van en absoluto—, así
   * que un clic en el vacío nunca lo tocaba y la selección se quedaba pegada. Los bloques
   * paran la propagación, así que este manejador solo ve el papel y los controles.
   */
  protected onCanvasClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('button, input, select')) return
    this.stopEditing()
    this.selected.set(null)
    this.active.selectFlowNode(null)
    this.cancelLink()
  }

  /**
   * Cierra la edición. Si lo que se estaba editando era una acción recién creada con el
   * «+ Acción» y nadie le cambió el nombre, se descarta: pulsar «+ Acción» y luego fuera
   * no puede dejar una fila «Nueva acción» sembrada en el proceso.
   */
  protected stopEditing(): void {
    const borrador = this.draft()
    this.draft.set(null)
    this.editing.set(null)
    if (!borrador) return
    const nodo = this.activeFlow()?.nodes.find(node => node.id === borrador)
    if (nodo?.text === NEW_ACTION_TEXT) this.removeStep(borrador)
  }

  protected selectEdge(event: MouseEvent, edge: FlowDiagramEdge): void {
    event.stopPropagation()
    this.selected.set({ kind: 'edge', from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}) })
    // una arista no se edita en el inspector: suelta el nodo para no mentir sobre qué hay elegido
    this.active.selectFlowNode(null)
  }

  protected isNodeSelected(id: string): boolean {
    const sel = this.selected()
    return sel?.kind === 'node' && sel.id === id
  }

  protected isEdgeSelected(edge: FlowDiagramEdge): boolean {
    const sel = this.selected()
    return sel?.kind === 'edge' && sel.from === edge.from && sel.to === edge.to && sel.label === edge.label
  }

  /**
   * Dónde pintar el botón de borrar: esquina del bloque o punto medio de la arista. Una
   * FILA de una tarjeta no tiene caja propia — se borra con la × de su fila, así que
   * aquí devuelve null y el botón flotante no aparece.
   */
  protected readonly deleteButtonAt = computed<NodePosition | null>(() => {
    const sel = this.selected()
    if (!sel) return null
    if (sel.kind === 'node') {
      const box = this.boxes().get(sel.id)
      return box ? { x: box.x + box.width, y: box.y } : null
    }
    const edge = this.edges().find(e => e.from === sel.from && e.to === sel.to && e.label === sel.label)
    return edge ? { x: (edge.line.x1 + edge.line.x2) / 2, y: (edge.line.y1 + edge.line.y2) / 2 + 12 } : null
  })

  /** Los botones de insertar viven bajo la × del tramo elegido. */
  protected readonly insertButtonsAt = computed<NodePosition | null>(() => {
    const sel = this.selected()
    if (sel?.kind !== 'edge') return null
    const edge = this.edges().find(e => e.from === sel.from && e.to === sel.to && e.label === sel.label)
    return edge ? { x: (edge.line.x1 + edge.line.x2) / 2, y: (edge.line.y1 + edge.line.y2) / 2 + 36 } : null
  })

  /**
   * Parte el tramo elegido por un bloque nuevo, que queda elegido y en edición (como
   * «+ Acción»). Insertar una condición es ENCADENAR decisiones: el camino que ya
   * existía sigue por el «sí» y la rama «no» queda pendiente de dibujar.
   */
  protected insertOnSelected(kind: 'step' | 'decision'): void {
    const sel = this.selected()
    const name = this.activeName()
    if (sel?.kind !== 'edge' || !name) return
    this.freezePositions()
    const texto = kind === 'decision' ? FLOW_KIND_STARTERS.decision : NEW_ACTION_TEXT
    if (!this.store.insertFlowNode(name, sel.from, sel.to, kind, texto, sel.label)) return
    const creado = this.store
      .flows()
      .find(f => f.name === name)
      ?.nodes.at(-1)
    if (!creado) return
    this.selected.set({ kind: 'node', id: creado.id })
    this.active.selectFlowNode(creado.id)
    this.editing.set(creado.id)
    this.draft.set(creado.id)
  }

  protected deleteSelected(): void {
    const sel = this.selected()
    const name = this.activeName()
    if (!sel || !name) return
    if (sel.kind === 'node') return this.removeStep(sel.id)
    this.freezePositions()
    this.store.removeFlowEdge(name, sel.from, sel.to, sel.label)
    this.selected.set(null)
  }

  /** El hueco del nodo borrado no se reserva: un nodo futuro con su id no hereda su sitio. */
  private forgetPosition(flowName: string, id: string): void {
    this.manual.update(manual => {
      const { [`${flowName}:${id}`]: _, ...resto } = manual
      return resto
    })
  }

  protected onDeleteKey(event: Event): void {
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    this.deleteSelected()
  }

  protected startEdit(node: FlowNode): void {
    this.editing.set(node.id)
  }

  protected setEntity(id: string, entity: string): void {
    const name = this.activeName()
    if (!name) return
    // «sin entidad» quita la alusión: el patch debe DEJAR el campo fuera, no mandar un valor
    this.store.updateFlowNode(name, id, entity === NONE ? { entity: undefined } : { entity })
  }

  /** Arrastre de bloques: igual que las cajas del modelo, posiciones en memoria. */
  protected startDrag(down: PointerEvent, id: string, box: NodeBox): void {
    if ((down.target as HTMLElement).closest('button, input, select')) return
    const flow = this.activeName()
    if (!flow) return
    down.preventDefault()
    const handle = down.currentTarget as HTMLElement
    handle.setPointerCapture(down.pointerId)
    const origin = { x: box.x, y: box.y }
    const key = `${flow}:${id}`

    const onMove = (move: PointerEvent) =>
      this.manual.update(manual => ({
        ...manual,
        [key]: {
          x: origin.x + (move.clientX - down.clientX) / this.camera().zoom,
          y: origin.y + (move.clientY - down.clientY) / this.camera().zoom
        }
      }))
    // en la VENTANA y no en el bloque: si el puntero se cancela o el bloque se redibuja
    // a mitad del arrastre, el listener del bloque moría y la caja se quedaba pegada al cursor
    const cerrar = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', cerrar)
      window.removeEventListener('pointercancel', cerrar)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', cerrar)
    window.addEventListener('pointercancel', cerrar)
  }

  /**
   * Arrastre de una FILA dentro de su tarjeta (spec 40): el orden de las acciones es del
   * diseño, no del layout, así que esto no toca `manual` —toca el flujo—. El puesto destino
   * se calcula por altura de fila; el recableado lo hace el store al soltar, una sola vez,
   * para no dejar el diseño con veinte versiones intermedias mientras se arrastra.
   */
  protected startRowDrag(down: PointerEvent, group: FlowGroup, stepId: string, fromIndex: number): void {
    const flow = this.activeName()
    if (!flow || group.steps.length < 2) return
    down.preventDefault()
    down.stopPropagation()
    const handle = down.currentTarget as HTMLElement
    handle.setPointerCapture?.(down.pointerId)
    this.rowDrag.set({ groupId: group.id, stepId, from: fromIndex, to: fromIndex })

    const tope = group.steps.length - 1
    const onMove = (move: PointerEvent) => {
      const filas = Math.round((move.clientY - down.clientY) / this.camera().zoom / this.groupMetrics.rowHeight)
      const to = Math.min(Math.max(fromIndex + filas, 0), tope)
      this.rowDrag.update(drag => (drag && drag.to !== to ? { ...drag, to } : drag))
    }
    // en la ventana, como el arrastre de bloques: la fila se redibuja al reordenar y un
    // listener colgado de ella se quedaría a medias
    const cerrar = (soltar: boolean) => () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      const drag = this.rowDrag()
      this.rowDrag.set(null)
      if (!soltar || !drag || drag.to === drag.from) return

      // La tarjeta se llama por el id de su PRIMERA acción, así que reordenar puede cambiarle
      // la identidad al bloque: para el layout sería uno nuevo, y todo el lienzo se recolocaría
      // —lo que se ve es la fila «saltando» a otra tarjeta—. Se congela lo dibujado, como los
      // demás gestos que tocan la topología, y el sitio de la tarjeta viaja a su nueva cabeza.
      const sitio = this.boxes().get(group.id)
      this.freezePositions()
      if (!this.store.reorderFlowStep(flow, drag.stepId, drag.to)) return
      const recolocada = this.groupOf(drag.stepId)
      if (recolocada && sitio) {
        this.manual.update(manual => ({ ...manual, [`${flow}:${recolocada.id}`]: { x: sitio.x, y: sitio.y } }))
      }
    }
    const onUp = cerrar(true)
    const onCancel = cerrar(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
  }

  /** Tarjeta a la que pertenece una acción, ya recableada: su id es el de su primera fila. */
  private groupOf(stepId: string): FlowGroup | undefined {
    const flow = this.activeFlow()
    return flow ? flowGroups(flow).find(group => group.steps.some(step => step.id === stepId)) : undefined
  }

  /**
   * Borde de la fila `index` donde pintar la guía, si la fila que se arrastra va a caer ahí.
   * La guía va ARRIBA de la fila que ocupará el puesto, salvo al bajar al último, que va
   * debajo: es lo que se lee como «esta acción pasa a ser la última».
   */
  protected dropGuideAt(group: FlowGroup, index: number): 'arriba' | 'abajo' | null {
    const drag = this.rowDrag()
    if (!drag || drag.groupId !== group.id || drag.to === drag.from) return null
    if (drag.to !== index) return null
    return drag.to > drag.from ? 'abajo' : 'arriba'
  }

  /**
   * Conectar arrastrando: asa → flecha fantasma → soltar sobre otro bloque. Si el origen
   * es una decisión, la salida nace ya etiquetada ('sí' la primera, 'no' la segunda) y se
   * corrige después: defineApp exige la etiqueta en la frontera, pero pedirla con un
   * formulario en medio del gesto rompía el arrastre.
   */
  protected startLink(down: PointerEvent, id: string, box: NodeBox): void {
    down.preventDefault()
    down.stopPropagation()
    const handle = down.currentTarget as HTMLElement
    const surface = handle.closest('[data-testid="flow-surface"]') as HTMLElement | null
    if (!surface) return
    handle.setPointerCapture(down.pointerId)

    const originX = box.x + box.width
    const originY = box.y + box.height / 2
    // el MUNDO va escalado: el rect del `surface` ya viene multiplicado por el zoom, así
    // que sin dividir, el fantasma y el impacto se iban del cursor en cuanto había zoom
    const toWorld = (e: PointerEvent) => {
      const rect = surface.getBoundingClientRect()
      const zoom = this.camera().zoom
      return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
    }
    const onMove = (move: PointerEvent) => {
      const point = toWorld(move)
      this.linking.set({ x1: originX, y1: originY, x2: point.x, y2: point.y })
      // el destino se enciende mientras se arrastra: acertar a ciegas era lo difícil
      const candidato = this.blockNear(point)
      this.linkTarget.set(candidato === id ? null : candidato)
    }
    /**
     * El fantasma se borra SIEMPRE al acabar el gesto, termine como termine. Estaba
     * colgado del `pointerup` del asa, así que si el puntero se cancelaba —o el asa
     * se redibujaba— la flecha se quedaba dibujada en el lienzo para siempre.
     */
    const cerrar = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', cerrar)
      this.linking.set(null)
      this.linkTarget.set(null)
    }
    const onUp = (up: PointerEvent) => {
      // soltar sin moverse NO es un arrastre fallido: es un clic, y deja el origen
      // ARMADO para unir con un segundo clic en el bloque destino
      const apenasSeMovio = Math.hypot(up.clientX - down.clientX, up.clientY - down.clientY) < 5
      const destino = apenasSeMovio ? null : this.blockNear(toWorld(up))
      cerrar()
      if (apenasSeMovio) this.linkFrom.set(id)
      else this.connect(id, destino)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', cerrar)
  }

  /**
   * Une dos bloques. Único sitio donde nace una arista desde el lienzo, así que aquí
   * viven las dos reglas: congelar antes de tocar la topología y repartir la rama.
   */
  private connect(from: string, to: string | null): void {
    const flow = this.activeName()
    if (!to || to === from || !flow) return
    this.freezePositions()
    this.store.addFlowEdge(flow, from, to, this.branchLabelFor(from))
  }

  /**
   * Bloque bajo un punto, con un margen de gracia alrededor: soltar la flecha justo
   * dentro del borde era pedir puntería, sobre todo con el rombo, que solo ocupa de
   * verdad la mitad de su caja.
   */
  private blockNear(point: NodePosition): string | null {
    const holgura = FLOW_LINK_SNAP
    const crecidas = Object.fromEntries(
      [...this.boxes()].map(([id, box]) => [
        id,
        {
          x: box.x - holgura,
          y: box.y - holgura,
          width: box.width + holgura * 2,
          height: box.height + holgura * 2
        }
      ])
    )
    return nodeAt(point, crecidas)
  }

  /** La etiqueta de una salida nueva la reparte el dominio (la primera rama libre). */
  private branchLabelFor(from: string): string | undefined {
    const flow = this.activeFlow()
    return flow ? flowBranchLabel(flow, from) : undefined
  }
}
