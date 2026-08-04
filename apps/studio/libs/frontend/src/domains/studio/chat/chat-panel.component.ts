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
    <section class="flex h-full flex-col" data-testid="chat-panel">
      <h2 class="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
        Chat de diseño
        @if (chat.mode() === 'fake') {
          <span class="text-amber-600" data-testid="chat-mode-fake">· demo sin IA</span>
        }
      </h2>
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
