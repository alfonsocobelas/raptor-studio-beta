import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import type { CatalogCard, CatalogGroup } from './generate-catalog'

const EMPTY_GROUP: CatalogGroup = { slot: '', heading: '', cards: [] }

/**
 * Las tarjetas de «Antes de generar» (maqueta 9A). Presentacionales del todo: no inyectan
 * nada, no saben del manifiesto y no deciden qué está disponible —eso llega ya masticado en
 * `CatalogCard`—. Solo pintan y avisan de la pulsación.
 *
 * Entradas y salidas con DECORADOR y no con `input()`/`output()`, en contra del resto del
 * estudio: el runner de tests compila en JIT (vitest, sin plugin de Angular) y ahí las de
 * señal no se registran —`NG0303`/`NG0315`—, así que un componente con `input()` no se puede
 * montar en un test. Es una restricción de la herramienta, no una preferencia; el día que el
 * runner compile en AOT, esto vuelve a señales.
 *
 * Los `data-testid` se conservan del asistente viejo (`slot-<ranura>-<valor>`,
 * `plugin-<nombre>`) para no romper los smoke tools.
 */
@Component({
  selector: 'studio-choice-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mb-6">
      <h2 class="text-foreground mb-0.5 text-[15px] font-semibold">{{ group.heading }}</h2>
      @if (group.subheading; as sub) {
        <p class="text-muted-foreground studio-ui mb-3">{{ sub }}</p>
      } @else {
        <div class="mb-3"></div>
      }

      <div class="flex flex-wrap gap-3" role="radiogroup" [attr.aria-label]="group.heading">
        @for (card of group.cards; track card.value) {
          <button
            type="button"
            role="radio"
            class="option-card min-w-[11rem] flex-1 text-left"
            [class.option-card-chosen]="card.value === chosen"
            [disabled]="card.disabled"
            [attr.aria-checked]="card.value === chosen"
            [attr.data-testid]="'slot-' + card.slot + '-' + card.value"
            (click)="choose.emit(card.value)"
          >
            <span class="flex items-start justify-between gap-2">
              <span class="text-foreground text-[13px] font-semibold">{{ card.title }}</span>
              <span class="option-mark" aria-hidden="true"></span>
            </span>
            @if (card.hint) {
              <span class="text-muted-foreground mt-1 block text-[11.5px] leading-snug">{{ card.hint }}</span>
            }
            @if (card.reason; as reason) {
              <span class="studio-eyebrow mt-2 block" [attr.data-testid]="'soon-' + card.value">{{ reason }}</span>
            }
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    .option-card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .option-card:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .option-card:not(:disabled):hover {
      border-color: color-mix(in oklab, var(--foreground) 35%, var(--border));
    }
    /* La elegida lleva la tinta del estudio, como en la maqueta: borde marcado y el
       circulito relleno. Sin color de marca: aquí el acento es la decisión, no el producto. */
    .option-card-chosen {
      border-color: var(--foreground);
      box-shadow: 0 1px 3px oklch(0 0 0 / 8%);
    }
    .option-mark {
      display: inline-block;
      flex-shrink: 0;
      width: 14px;
      height: 14px;
      border: 1px solid var(--border);
      border-radius: 50%;
    }
    .option-card-chosen .option-mark {
      border: 4px solid var(--foreground);
    }
  `
})
export class ChoiceCardsComponent {
  @Input() group: CatalogGroup = EMPTY_GROUP
  @Input() chosen = ''
  @Output() readonly choose = new EventEmitter<string>()
}

@Component({
  selector: 'studio-addon-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-3">
      @for (card of cards; track card.value) {
        <button
          type="button"
          role="checkbox"
          class="addon-card text-left"
          [class.addon-card-active]="active.includes(card.value)"
          [disabled]="card.disabled"
          [attr.aria-checked]="active.includes(card.value)"
          [attr.data-testid]="'plugin-' + card.value"
          (click)="toggle.emit(card.value)"
        >
          <span class="flex items-start gap-2.5">
            <span class="addon-mark" aria-hidden="true">
              @if (active.includes(card.value)) {
                <span class="addon-tick">✓</span>
              }
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-baseline justify-between gap-2">
                <span class="text-foreground text-[13px] font-semibold">{{ card.title }}</span>
                @if (card.reason; as reason) {
                  <span class="studio-eyebrow shrink-0" [attr.data-testid]="'soon-' + card.value">{{ reason }}</span>
                }
              </span>
              @if (card.hint) {
                <span class="text-muted-foreground mt-0.5 block text-[11.5px] leading-snug">{{ card.hint }}</span>
              }
            </span>
          </span>
        </button>
      }
    </div>
  `,
  styles: `
    .addon-card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .addon-card:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .addon-card:not(:disabled):hover {
      border-color: color-mix(in oklab, var(--foreground) 35%, var(--border));
    }
    .addon-card-active {
      border-color: var(--foreground);
    }
    .addon-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 15px;
      height: 15px;
      margin-top: 1px;
      border: 1px solid var(--border);
      border-radius: 4px;
    }
    .addon-card-active .addon-mark {
      background-color: var(--foreground);
      border-color: var(--foreground);
    }
    .addon-tick {
      color: var(--background);
      font-size: 10px;
      line-height: 1;
    }
  `
})
export class AddonCardsComponent {
  @Input() cards: readonly CatalogCard[] = []
  @Input() active: readonly string[] = []
  @Output() readonly toggle = new EventEmitter<string>()
}
