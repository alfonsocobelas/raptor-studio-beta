import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { AppButton } from '../../shared/components/ui/button.directive'
import { AppFormField } from '../../shared/components/ui/form-field'
import { AppInput } from '../../shared/components/ui/input.directive'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, AppButton, AppFormField, AppInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <section class="bg-card w-full max-w-md rounded-lg border p-6 shadow-sm">
        <div class="mb-4 text-center">
          <h1 class="text-2xl font-bold tracking-tight">Recuperar contraseña</h1>
          <p class="text-sm opacity-70">Te enviaremos un enlace para restablecerla</p>
        </div>
        <div>
          @if (submitted()) {
            <p class="text-sm">Si el email existe, te hemos enviado un enlace para restablecer la contraseña.</p>
          } @else {
            <form class="space-y-6" [formGroup]="form" (ngSubmit)="submit()">
              <app-form-field label="Email" for="email">
                <input id="email" type="email" appInput formControlName="email" placeholder="tu@empresa.com" />
              </app-form-field>
              <button type="submit" class="w-full" [disabled]="form.invalid || submitting()" appBtn>
                Enviar enlace
              </button>
            </form>
          }
        </div>
        <div class="mt-4 text-center">
          <a class="text-muted-foreground text-xs" routerLink="/login">Volver al acceso</a>
        </div>
      </section>
    </div>
  `
})
export class ForgotPasswordComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _auth = inject(AuthService)

  readonly submitted = signal(false)
  readonly submitting = signal(false)

  readonly form = this._fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  })

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      return
    }
    this.submitting.set(true)
    try {
      await this._auth.requestReset({ email: this.form.getRawValue().email })
    } catch {
      // Uniform response regardless of outcome (anti-enumeration).
    } finally {
      this.submitting.set(false)
      this.submitted.set(true)
    }
  }
}
