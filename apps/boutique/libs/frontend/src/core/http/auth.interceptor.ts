import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
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
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/api/v1/auth/')) {
        router.navigate(['/login'])
      }
      return throwError(() => error)
    })
  )
}
