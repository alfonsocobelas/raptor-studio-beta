import { HttpClient } from '@angular/common/http'
import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import type { AppDefinition } from '@acc/schema'
import { AppStore } from '../editor/app-store'

export interface ChatEntry {
  role: 'user' | 'assistant'
  text: string
}

interface ChatResponse {
  reply: string
  schema: AppDefinition
  mode: string
}

/**
 * Cliente del chat de diseño: envía la conversación y el app-schema vigente al
 * backend y aplica la propuesta al lienzo SOLO a través del gate del AppStore.
 */
@Injectable({ providedIn: 'root' })
export class StudioChatService {
  private readonly http = inject(HttpClient)
  private readonly store = inject(AppStore)

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
          schema: this.store.definition()
        })
      )
      this.mode.set(response.mode)
      this.history.update(h => [...h, { role: 'assistant', text: response.reply }])
      if (!this.store.applyExternal(response.schema)) {
        this.error.set(`La propuesta no pasó el gate del lienzo: ${this.store.lastError() ?? 'schema inválido'}`)
      }
    } catch (e) {
      const detail =
        typeof e === 'object' && e !== null && 'error' in e
          ? ((e as { error?: { message?: string } }).error?.message ?? 'error de red')
          : String(e)
      this.error.set(detail)
    } finally {
      this.pending.set(false)
    }
  }
}
