import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { DesignStore } from './design-store'
import { buildSampleRows } from './mock-data'

/**
 * Arquetipo FICHA: cabecera con estado y acciones, tarjetas de datos por
 * secciones, fila de métricas y (si la entidad los declara) adjuntos.
 * Anatomía tomada de las fichas reales de la referencia.
 */
@Component({
  selector: 'studio-canvas-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <header class="mb-5 flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold">
            {{ v.initials }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold tracking-tight">{{ v.title }}</h1>
              <span class="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">Activo</span>
            </div>
            <p class="text-muted-foreground text-sm">{{ v.subtitle }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <span class="chrome">Editar</span>
          <span class="chrome">Exportar</span>
        </div>
      </header>

      <div class="mb-5 grid grid-cols-3 gap-4">
        @for (metric of v.metrics; track metric.label) {
          <div class="rounded-lg border p-4">
            <p class="text-muted-foreground text-sm">{{ metric.label }}</p>
            <p class="text-2xl font-bold">{{ metric.value }}</p>
          </div>
        }
      </div>

      <div class="grid grid-cols-2 gap-4">
        <section class="rounded-lg border p-4">
          <h2 class="mb-3 text-sm font-semibold">Datos generales</h2>
          <dl class="space-y-2">
            @for (row of v.left; track row.label) {
              <div class="flex justify-between gap-4 border-b pb-2 last:border-0">
                <dt class="text-muted-foreground text-sm">{{ row.label }}</dt>
                <dd class="text-sm font-medium">{{ row.value }}</dd>
              </div>
            }
          </dl>
        </section>
        <section class="rounded-lg border p-4">
          <h2 class="mb-3 text-sm font-semibold">Detalle</h2>
          <dl class="space-y-2">
            @for (row of v.right; track row.label) {
              <div class="flex justify-between gap-4 border-b pb-2 last:border-0">
                <dt class="text-muted-foreground text-sm">{{ row.label }}</dt>
                <dd class="text-sm font-medium">{{ row.value }}</dd>
              </div>
            }
          </dl>
        </section>
      </div>

      <section class="mt-4 rounded-lg border p-4">
        <h2 class="mb-3 text-sm font-semibold">Actividad reciente</h2>
        <ol class="space-y-3">
          @for (item of v.timeline; track item.text) {
            <li class="flex gap-3">
              <span class="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full"></span>
              <div>
                <p class="text-sm">{{ item.text }}</p>
                <p class="text-muted-foreground text-xs">{{ item.date }}</p>
              </div>
            </li>
          }
        </ol>
      </section>
    }
  `,
  styles: `
    .chrome {
      border: 1px solid hsl(var(--border));
      border-radius: 0.375rem;
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      user-select: none;
    }
  `
})
export class CanvasDetailComponent {
  readonly resource = input.required<string>()
  private readonly store = inject(DesignStore)

  protected readonly view = computed(() => {
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!draft) return null
    const [row] = buildSampleRows(draft, 1)
    const rows = draft.fields.map(f => ({ label: f.label, value: String(row[f.name] ?? '—') }))
    const numeric = draft.fields.filter(f => f.type === 'number' || f.type === 'integer')
    const title = String(row[draft.fields.find(f => f.type === 'string')?.name ?? ''] ?? draft.labelSingular)

    return {
      title,
      initials: title.slice(0, 2).toUpperCase(),
      subtitle: `${draft.labelSingular} · ficha completa`,
      metrics: (numeric.length ? numeric : draft.fields.slice(0, 3)).slice(0, 3).map(f => ({
        label: f.label,
        value: String(row[f.name] ?? '—')
      })),
      left: rows.slice(0, Math.ceil(rows.length / 2)),
      right: rows.slice(Math.ceil(rows.length / 2)),
      timeline: [
        { text: `Se actualizó ${draft.labelSingular.toLowerCase()}`, date: 'Hace 2 horas · María López' },
        { text: 'Se adjuntó un documento', date: 'Ayer · Juan Pérez' },
        { text: 'Registro creado', date: '28/07/2026 · Sistema' }
      ]
    }
  })
}
