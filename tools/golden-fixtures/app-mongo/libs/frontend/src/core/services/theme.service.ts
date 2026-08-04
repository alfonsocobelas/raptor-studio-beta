import { Injectable, signal } from '@angular/core'

export type AppTheme = 'light' | 'dark'

const STORAGE_KEY = 'app-theme'

/**
 * Tema claro/oscuro de la aplicación. Aplica la clase `dark` en <html> (el
 * contrato de los tokens de estilo) y recuerda la elección del usuario.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.initial())

  constructor() {
    this.apply(this.theme())
  }

  toggle(): void {
    const next: AppTheme = this.theme() === 'light' ? 'dark' : 'light'
    this.theme.set(next)
    this.apply(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  private initial(): AppTheme {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  private apply(theme: AppTheme): void {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}
