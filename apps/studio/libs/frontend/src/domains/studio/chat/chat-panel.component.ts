import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowUp } from '@ng-icons/lucide'
import { autosize, shouldSubmit } from './chat-input'
import { StudioChatService } from './studio-chat.service'

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
    <section class="flex max-h-full flex-col" data-testid="chat-panel">
      <!-- El historial va plegado: el chat es una barra y la conversación se consulta a demanda -->
      @if (showHistory() || chat.pending() || chat.error()) {
        <div class="mb-2 max-h-48 space-y-2 overflow-auto px-1" data-testid="chat-history">
          @for (entry of chat.history(); track $index) {
            @if (entry.role === 'user') {
              <div class="flex justify-end" [attr.data-testid]="'chat-user-' + $index">
                <div class="max-w-[85%] rounded-2xl rounded-br-sm bg-neutral-900 px-3 py-2 text-sm text-neutral-50">
                  {{ entry.text }}
                </div>
              </div>
            } @else {
              <div class="flex justify-start" [attr.data-testid]="'chat-assistant-' + $index">
                <div class="bg-muted max-w-[90%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                  <span class="text-brand mr-1">✦</span>{{ entry.text }}
                </div>
              </div>
            }
          }
          @if (!chat.history().length) {
            <p class="text-muted-foreground text-xs">Todavía no hay conversación</p>
          }
          @if (chat.pending()) {
            <p class="text-muted-foreground text-xs" data-testid="chat-pending">Pensando…</p>
          }
          @if (chat.error(); as error) {
            <p class="text-destructive text-xs" data-testid="chat-error">{{ error }}</p>
          }
        </div>
      }

      <!-- Una sola fila, como la barra de mando del mockup: ✦, la orden, historial y enviar -->
      <form class="flex items-end gap-2" (ngSubmit)="submit(input)">
        <span class="text-brand pb-2 text-base leading-none" aria-hidden="true">✦</span>
        <textarea
          #input
          rows="1"
          class="max-h-32 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-sm outline-none"
          name="draft"
          placeholder="«pon los KPIs en dos columnas y sube la tabla»"
          [disabled]="chat.pending()"
          [(ngModel)]="draft"
          (input)="grow(input)"
          (keydown)="onKeydown($event, input)"
          data-testid="chat-input"
        ></textarea>
        @if (chat.mode() === 'fake') {
          <span class="pb-2 text-xs text-amber-600" data-testid="chat-mode-fake">demo sin IA</span>
        }
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent/60 mb-1 rounded-md border px-3 py-1.5 text-sm"
          [class.bg-accent]="showHistory()"
          data-testid="chat-history-toggle"
          (click)="showHistory.set(!showHistory())"
        >
          Historial
        </button>
        <span class="text-muted-foreground pb-2.5 text-[11px]" aria-hidden="true">⌘↵</span>
        <button
          type="submit"
          class="bg-primary text-primary-foreground mb-1 rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-40"
          [disabled]="chat.pending() || !draft().trim()"
          data-testid="chat-send"
        >
          Enviar
        </button>
      </form>
    </section>
  `
})
export class ChatPanelComponent {
  protected readonly chat = inject(StudioChatService)
  protected readonly draft = signal('')
  /** El historial plegado: la barra manda y la conversación se abre a demanda. */
  protected readonly showHistory = signal(false)

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
