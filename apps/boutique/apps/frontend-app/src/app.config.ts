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
import { authInterceptor } from '@app/frontend/core/http/auth.interceptor'
import { API_BASE_URL } from '@app/frontend/core/http/api-base-url.token'
import { AuthService } from '@app/frontend/core/services/auth.service'
import { routes } from './app.routes'

// Locale es-ES: fechas dd-MM-yyyy y formato de moneda/número español en toda la app.
registerLocaleData(localeEs)

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiBaseUrlInterceptor, authInterceptor])),
    provideAppInitializer(() => inject(AuthService).loadCurrentUser()),
    { provide: API_BASE_URL, useValue: '' },
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ]
}
