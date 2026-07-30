import { Injectable } from '@angular/core'
import { toast } from '@spartan-ng/brain/sonner'

/** Avisos al usuario. Las features no conocen la librería de toasts. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(message: string): void {
    toast.success(message)
  }

  error(message: string): void {
    toast.error(message)
  }
}
