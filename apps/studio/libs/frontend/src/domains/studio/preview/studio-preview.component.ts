import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core'
import { ACTIVE_APP } from './active-app'
import { PagePreviewComponent } from './page-preview.component'

/**
 * Lienzo del visor (fase B, read-only): nav con las páginas del app-schema activo
 * y render de la página seleccionada. Todo deriva de ACTIVE_APP; el componente
 * solo mantiene qué página está seleccionada.
 */
@Component({
  selector: 'studio-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePreviewComponent],
  template: `
    <div class="flex h-full gap-6">
      <aside class="w-56 shrink-0 border-r pr-4">
        <h2 class="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">Páginas</h2>
        <nav class="flex flex-col gap-1" data-testid="studio-page-nav">
          @for (page of pages(); track $index) {
            <button
              type="button"
              class="rounded-md px-3 py-2 text-left text-sm transition-colors"
              [class.bg-accent]="$index === selectedIndex()"
              [class.font-medium]="$index === selectedIndex()"
              [class.text-muted-foreground]="$index !== selectedIndex()"
              [attr.data-testid]="'studio-page-' + $index"
              (click)="select($index)"
            >
              {{ page.label }}
            </button>
          }
        </nav>
      </aside>
      <main class="min-w-0 flex-1">
        <header class="mb-4">
          <h1 class="text-lg font-semibold">{{ selectedPage().label }}</h1>
          <p class="text-muted-foreground text-sm">Vista previa generada desde el app-schema (solo lectura)</p>
        </header>
        <studio-page-preview [page]="selectedPage()" />
      </main>
    </div>
  `
})
export class StudioPreviewComponent {
  protected readonly pages = signal(ACTIVE_APP.pages).asReadonly()
  protected readonly selectedIndex = signal(0)
  protected readonly selectedPage = computed(() => this.pages()[this.selectedIndex()])

  protected select(index: number): void {
    this.selectedIndex.set(index)
  }
}
