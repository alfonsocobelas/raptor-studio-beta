import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { PropiedadDto } from '@app/shared/domain'
import { PropiedadService, OffsetPaginatedOutput } from '../../../../../../core/services/propiedad.service'
import { formatValue } from '../../../../../../shared/utils/format-value'

/**
 * Galería de Propiedades: la MISMA lectura del listado pintada como tarjetas.
 * Comparte servicio, búsqueda y paginación — no hay endpoint ni estado propios.
 */
@Component({
  selector: 'app-propiedades-gallery',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Propiedades</h1>
        <p class="text-muted-foreground">Cartera viva de la agencia · pulsa una propiedad para ver sus visitas</p>
      </div>

      <input
        class="border-input w-full max-w-sm rounded-md border px-3 py-2 text-sm"
        type="search"
        placeholder="Buscar…"
        [ngModel]="search()"
        (ngModelChange)="onSearch($event)"
        aria-label="Buscar"
      />

      @if (isLoading() && !hasData()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando propiedades…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar las propiedades</p>
      } @else if (!items().length) {
        <p class="text-muted-foreground py-12 text-center text-sm">No hay propiedades registradas</p>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (item of items(); track item.id) {
            <article
              class="bg-card flex flex-col gap-2 rounded-lg border p-4 transition-shadow hover:shadow-md"
              role="button"
              tabindex="0"
              (click)="open(item)"
              (keydown.enter)="open(item)"
            >
              <h2 class="truncate text-base font-semibold">{{ text(item, cardTitle) }}</h2>
              <p class="text-muted-foreground truncate text-sm">{{ text(item, cardSubtitle) }}</p>
              <div class="flex flex-wrap gap-1">
                @for (chip of chips; track chip.key) {
                  <span class="bg-muted rounded-full px-2 py-0.5 text-xs">
                    <span class="text-muted-foreground">{{ chip.label }}:</span> {{ text(item, chip.key) }}
                  </span>
                }
              </div>
              <p class="mt-auto pt-2 text-xl font-bold">
                {{ text(item, cardMetric) }}
                <span class="text-muted-foreground text-xs font-normal">Precio</span>
              </p>
            </article>
          }
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ total() }} en total</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="border-input rounded-md border px-3 py-1 disabled:opacity-50"
              [disabled]="currentPage() === 1"
              (click)="onPage(currentPage() - 1)"
            >
              Anterior
            </button>
            <button
              type="button"
              class="border-input rounded-md border px-3 py-1 disabled:opacity-50"
              [disabled]="currentPage() * pageSize() >= total()"
              (click)="onPage(currentPage() + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class PropiedadesGalleryComponent {
  private readonly _service = inject(PropiedadService)
  private readonly _router = inject(Router)

  /** Campos que pinta la tarjeta: los decide el generador desde el modelo. */
  readonly cardTitle = 'titulo'
  readonly cardSubtitle = 'zona'
  readonly cardMetric = 'precio'
  readonly chips: { key: string; label: string }[] = [
    { key: 'estado', label: 'Estado' },
    { key: 'metrosCuadrados', label: 'Metros cuadrados' }
  ]

  readonly isLoading = this._service.propiedades.isLoading
  readonly error = this._service.propiedades.error

  // Igual que el listado: al recargar, resource() vacía value(); conservar la última
  // página evita que la rejilla parpadee en cada búsqueda.
  private readonly _loaded = linkedSignal<
    OffsetPaginatedOutput<PropiedadDto> | undefined,
    OffsetPaginatedOutput<PropiedadDto> | undefined
  >({
    source: () => this._service.propiedades.value(),
    computation: (value, previous) => value ?? previous?.value
  })

  readonly items = computed(() => this._loaded()?.items ?? [])
  readonly total = computed(() => this._loaded()?.total ?? 0)
  readonly hasData = computed(() => this._loaded() !== undefined)
  readonly currentPage = computed(() => this._service.request().page)
  readonly pageSize = computed(() => this._service.request().pageSize)
  readonly search = computed(() => this._service.request().search ?? '')

  text(item: PropiedadDto, key: string): string {
    return formatValue((item as unknown as Record<string, unknown>)[key])
  }

  onSearch(search: string): void {
    this._service.request.update(r => ({ ...r, search: search || undefined, page: 1 }))
  }

  onPage(page: number): void {
    this._service.request.update(r => ({ ...r, page }))
  }

  open(item: PropiedadDto): void {
    void this._router.navigate(['/fincaraiz/propiedades', item.id])
  }

  // @ai:begin gallery-extra — filtros o adornos propios de esta galería
  // @ai:end
}
