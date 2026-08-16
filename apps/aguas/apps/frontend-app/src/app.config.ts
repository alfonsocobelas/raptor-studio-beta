import { registerLocaleData } from '@angular/common'
import localeEs from '@angular/common/locales/es'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { apiBaseUrlInterceptor } from '@app/frontend/core/http/api-base-url.interceptor'
import { API_BASE_URL } from '@app/frontend/core/http/api-base-url.token'
import { AuthService } from '@app/frontend/core/services/auth.service'
import { routes } from './app.routes'
import { devAuthProvider } from './dev-auth'

// Locale es-ES: fechas dd/MM/yyyy y formato de moneda/número español en toda la app.
registerLocaleData(localeEs)

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    // Sin authInterceptor: el proyecto generado no trae módulo de auth todavía.
    provideHttpClient(withInterceptors([apiBaseUrlInterceptor])),
    provideAppInitializer(() => inject(AuthService).loadCurrentUser()),
    devAuthProvider,
    { provide: API_BASE_URL, useValue: '' },
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ]
}
