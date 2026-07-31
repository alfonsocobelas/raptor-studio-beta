import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { API_BASE_URL } from './api-base-url.token'

/**
 * Prepends the configured backend origin to relative API URLs. Services emit raw paths
 * already including the version prefix (e.g. '/api/v1/customers'); this interceptor only
 * resolves the host so absolute URLs and non-API assets pass through untouched.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL)
  if (baseUrl && req.url.startsWith('/api')) {
    return next(req.clone({ url: `${baseUrl}${req.url}` }))
  }
  return next(req)
}
