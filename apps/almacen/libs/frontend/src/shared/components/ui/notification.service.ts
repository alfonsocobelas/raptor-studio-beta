import { inject, Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'

/** Avisos al usuario (piel Material). Misma API que la implementación Spartan. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _snackBar = inject(MatSnackBar)

  success(message: string): void {
    this._snackBar.open(message, 'Cerrar', { duration: 4000 })
  }

  error(message: string): void {
    this._snackBar.open(message, 'Cerrar', { duration: 6000, panelClass: 'app-snackbar-error' })
  }
}
