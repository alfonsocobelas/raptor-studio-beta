import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowUp } from '@ng-icons/lucide'
import { autosize, shouldSubmit } from './chat-input'
import { StudioChatService } from './studio-chat.service'
import { DesignStore } from '../design/design-store'

/**
 * Panel de chat del estudio: el usuario describe la app y la IA muta el
 * app-schema (vía gate). Presentacional: todo el estado vive en el servicio.
 */
@Component({
  selector: 'studio-chat-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgIcon],
  providers: [provideIcons({ lucideArrowUp })],
  template: `
    <section class="flex h-full flex-col" data-testid="chat-panel">
      <h2 class="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
        Chat de diseño
        @if (chat.mode() === 'fake') {
          <span class="text-amber-600" data-testid="chat-mode-fake">· demo sin IA</span>
        }
      </h2>
      <!-- Contexto que no puedes ver ni editar es contexto en el que no puedes confiar (spec 22) -->
      <details class="bg-card mb-2 rounded-lg border" data-testid="brief-panel" [open]="briefOpen()">
        <summary
          class="text-muted-foreground cursor-pointer select-none px-3 py-2 text-xs font-semibold"
          (click)="briefOpen.set(!briefOpen()); $event.preventDefault()"
        >
          Contexto del negocio
          @if (!store.brief()) {
            <span class="font-normal">· aún vacío: la IA lo destila de lo que cuentes</span>
          }
        </summary>
        <div class="space-y-2 px-3 pb-3">
          <textarea
            class="border-input w-full rounded border px-2 py-1 text-xs"
            rows="3"
            placeholder="Qué hace este negocio"
            [ngModel]="store.brief()?.business ?? ''"
            (change)="saveBrief($event)"
            data-testid="brief-business"
          ></textarea>
          <textarea
            class="border-input w-full rounded border px-2 py-1 text-xs"
            rows="3"
            placeholder="Reglas (una por línea)"
            [ngModel]="rulesText()"
            (change)="saveRules($event)"
            data-testid="brief-rules"
          ></textarea>
          @if (store.brief()?.glossary?.length) {
            <ul class="text-muted-foreground space-y-0.5 text-xs" data-testid="brief-glossary">
              @for (entry of store.brief()?.glossary; track entry.term) {
                <li>
                  <span class="text-foreground font-medium">{{ entry.term }}</span
                  >: {{ entry.means }}
                </li>
              }
            </ul>
          }
          @if (store.lastError(); as error) {
            <p class="text-destructive text-xs">{{ error }}</p>
          }
        </div>
      </details>
      <div class="mb-2 flex-1 space-y-2 overflow-auto" data-testid="chat-history">
        @for (entry of chat.history(); track $index) {
          @if (entry.role === 'user') {
            <div class="flex justify-end" [attr.data-testid]="'chat-user-' + $index">
              <div class="max-w-[85%]">
                <p class="text-muted-foreground mb-0.5 text-right text-[10px] font-medium uppercase tracking-wide">
                  Tú
                </p>
                <div class="bg-card rounded-2xl rounded-br-sm border px-3 py-2 text-sm">
                  {{ entry.text }}
                </div>
              </div>
            </div>
          } @else {
            <div class="flex justify-start" [attr.data-testid]="'chat-assistant-' + $index">
              <div class="max-w-[90%]">
                <p class="text-muted-foreground mb-0.5 text-[10px] font-medium uppercase tracking-wide">✦ Asistente</p>
                <div class="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm">{{ entry.text }}</div>
              </div>
            </div>
          }
        }
        @if (chat.pending()) {
          <p class="text-muted-foreground text-xs" data-testid="chat-pending">Pensando…</p>
        }
        @if (chat.error(); as error) {
          <p class="text-destructive text-xs" data-testid="chat-error">{{ error }}</p>
        }
      </div>
      <!-- el botón vive DENTRO de la caja, así acompaña al textarea cuando crece -->
      <form
        class="bg-muted border-input focus-within:border-ring flex flex-col rounded-2xl border px-3 py-2"
        (ngSubmit)="submit(input)"
      >
        <textarea
          #input
          rows="1"
          class="w-full resize-none overflow-y-auto bg-transparent text-sm outline-none"
          name="draft"
          placeholder="Describe tu aplicación…"
          [disabled]="chat.pending()"
          [(ngModel)]="draft"
          (input)="grow(input)"
          (keydown)="onKeydown($event, input)"
          data-testid="chat-input"
        ></textarea>
        <div class="flex items-center justify-end pt-1">
          <button
            type="submit"
            class="bg-brand text-brand-foreground flex size-7 items-center justify-center rounded-full disabled:opacity-40"
            [disabled]="chat.pending() || !draft().trim()"
            aria-label="Enviar"
            data-testid="chat-send"
          >
            <ng-icon name="lucideArrowUp" size="15" />
          </button>
        </div>
      </form>
    </section>
  `
})
export class ChatPanelComponent {
  protected readonly store = inject(DesignStore)
  protected readonly briefOpen = signal(false)

  protected readonly rulesText = computed(() => (this.store.brief()?.rules ?? []).join('\n'))

  /** Editar a mano manda: lo que se guarda aquí es lo que el turno siguiente recibe. */
  protected saveBrief(event: Event): void {
    const business = (event.target as HTMLTextAreaElement).value.trim()
    const current = this.store.brief()
    if (!business) {
      // sin negocio no hay brief; las reglas sueltas no se sostienen sin él
      this.store.setBrief(undefined)
      return
    }
    this.store.setBrief({ ...(current ?? {}), business })
  }

  protected saveRules(event: Event): void {
    const rules = (event.target as HTMLTextAreaElement).value
      .split('\n')
      .map(rule => rule.trim())
      .filter(Boolean)
    const current = this.store.brief()
    if (!current) return
    this.store.setBrief({ ...current, ...(rules.length ? { rules } : { rules: undefined }) })
  }

  protected readonly chat = inject(StudioChatService)
  protected readonly draft = signal('')

  protected submit(input?: HTMLTextAreaElement): void {
    const text = this.draft().trim()
    if (!text || this.chat.pending()) return
    this.draft.set('')
    if (input) {
      input.style.height = ''
    }
    void this.chat.send(text)
  }

  protected grow(input: HTMLTextAreaElement): void {
    autosize(input)
  }

  protected onKeydown(event: KeyboardEvent, input: HTMLTextAreaElement): void {
    if (!shouldSubmit(event)) return
    event.preventDefault()
    this.submit(input)
  }
}
