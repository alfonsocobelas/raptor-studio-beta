import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { StudioChatService } from './studio-chat.service'

/**
 * Panel de chat del estudio: el usuario describe la app y la IA muta el
 * app-schema (vía gate). Presentacional: todo el estado vive en el servicio.
 */
@Component({
  selector: 'studio-chat-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
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
                <p class="text-muted-foreground mb-0.5 text-right text-[10px] font-medium uppercase tracking-wide">Tú</p>
                <div class="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 text-sm">
                  {{ entry.text }}
                </div>
              </div>
            </div>
          } @else {
            <div class="flex justify-start" [attr.data-testid]="'chat-assistant-' + $index">
              <div class="max-w-[90%]">
                <p class="text-muted-foreground mb-0.5 text-[10px] font-medium uppercase tracking-wide">
                  ✦ Asistente
                </p>
                <div class="bg-muted rounded-2xl rounded-bl-sm border px-3 py-2 text-sm">{{ entry.text }}</div>
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
      <form class="flex gap-2" (ngSubmit)="submit()">
        <input
          class="border-input min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          name="draft"
          placeholder="Describe tu aplicación…"
          [disabled]="chat.pending()"
          [(ngModel)]="draft"
          data-testid="chat-input"
        />
        <button
          type="submit"
          class="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm disabled:opacity-50"
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

  protected submit(): void {
    const text = this.draft()
    this.draft.set('')
    void this.chat.send(text)
  }
}
