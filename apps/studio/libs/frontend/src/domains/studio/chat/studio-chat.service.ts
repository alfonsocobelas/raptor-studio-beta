import { HttpClient } from '@angular/common/http'
import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { DesignStore, type Design } from '../design/design-store'

export interface ChatEntry {
  role: 'user' | 'assistant'
  text: string
}

interface ChatResponse {
  reply: string
  design: Design
  mode: string
}

/**
 * Cliente del chat de diseño: envía la conversación y el DISEÑO vigente
 * (entidades + páginas) y aplica la propuesta al lienzo vía el gate del store.
 */
@Injectable({ providedIn: 'root' })
export class StudioChatService {
  private readonly http = inject(HttpClient)
  private readonly store = inject(DesignStore)

  readonly history = signal<ChatEntry[]>([])
  readonly pending = signal(false)
  readonly error = signal<string | null>(null)
  readonly mode = signal<string | null>(null)

  async send(text: string): Promise<void> {
    const message = text.trim()
    if (!message || this.pending()) return

    this.history.update(h => [...h, { role: 'user', text: message }])
    this.pending.set(true)
    this.error.set(null)
    try {
      const response = await firstValueFrom(
        this.http.post<ChatResponse>('/api/v1/studio/chat', {
          messages: this.history(),
          design: {
            appName: this.store.appName(),
            resources: this.store.resources(),
            pages: this.store.pages(),
            // la memoria del negocio viaja en cada turno: el siguiente no repregunta (spec 22)
            ...(this.store.brief() ? { brief: this.store.brief() } : {}),
            // y los procesos dibujados también: sin ellos, «conserva los existentes» no tiene qué conservar (spec 28)
            ...(this.store.flows().length ? { flows: this.store.flows() } : {})
          }
        })
      )
      this.mode.set(response.mode)
      this.history.update(h => [...h, { role: 'assistant', text: response.reply }])
      if (!this.store.applyExternal(response.design)) {
        this.error.set(`La propuesta no pasó el gate del lienzo: ${this.store.lastError() ?? 'diseño inválido'}`)
      }
    } catch (e) {
      const detail =
        typeof e === 'object' && e !== null && 'error' in e
          ? ((e as { error?: { message?: string } }).error?.message ??
            'backend local no disponible (npm run studio:api)')
          : String(e)
      this.error.set(detail)
    } finally {
      this.pending.set(false)
    }
  }
}
