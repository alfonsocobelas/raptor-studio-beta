import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { API_PREFIX, LOGIN_ROUTE } from './api.constants'
import { catchError, throwError } from 'rxjs'

/**
 * Sends the session cookie with every request (withCredentials) and, on a 401 from a
 * protected resource, redirects to /login (session expired mid-use). Auth endpoints handle
 * their own 401s (bad credentials, unauthenticated /me probe) so they are exempt.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router)
  const authReq = req.clone({ withCredentials: true })

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes(`${API_PREFIX}/auth/`)) {
        router.navigate([LOGIN_ROUTE])
      }
      return throwError(() => error)
    })
  )
}
