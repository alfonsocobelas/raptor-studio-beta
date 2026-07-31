import { computed, signal, Injectable } from '@angular/core'
import type { AppDefinition } from '@acc/schema'
import { composeApp } from '@acc/generators/src/generators/app/composition'
import { APPS } from '@acc/generators/src/generators/app/apps/registry'
import { MODELS } from '@acc/generators/src/generators/resource/models/registry'

/**
 * Única fuente de verdad del lienzo: la AppDefinition viva. La composición
 * (lo que se pinta y lo que consumiría el generador) es SIEMPRE un derivado.
 * Las mutaciones llegan como funciones puras (app-mutations) y solo se aplican
 * si validan — el lienzo no puede quedar en un estado no generable.
 */
@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly _definition = signal<AppDefinition>(APPS['boutique'])
  private readonly _lastError = signal<string | null>(null)

  readonly definition = this._definition.asReadonly()
  readonly lastError = this._lastError.asReadonly()
  readonly composition = computed(() => composeApp(this._definition(), MODELS))
  readonly schemaJson = computed(() => JSON.stringify(this._definition(), null, 2))

  /** Aplica una mutación pura; devuelve false (y conserva el estado) si no valida. */
  apply(mutation: (def: AppDefinition) => AppDefinition): boolean {
    try {
      this._definition.set(mutation(this._definition()))
      this._lastError.set(null)
      return true
    } catch (e) {
      this._lastError.set(e instanceof Error ? e.message : String(e))
      return false
    }
  }
}
