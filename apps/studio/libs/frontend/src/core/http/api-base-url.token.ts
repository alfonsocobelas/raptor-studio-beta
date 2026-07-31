import { InjectionToken } from '@angular/core'

/**
 * Origin of the backend API (e.g. 'http://localhost:3000'). Empty string means the API
 * is served from the same origin, so relative URLs are left untouched.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL')
