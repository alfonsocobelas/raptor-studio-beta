import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AppButton } from '../../shared/components/ui/button.directive'
import { AppFormField } from '../../shared/components/ui/form-field'
import { AppInput } from '../../shared/components/ui/input.directive'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, AppButton, AppFormField, AppInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <section class="bg-card w-full max-w-md rounded-lg border p-6 shadow-sm">
        <div class="mb-4 text-center">
          <h1 class="text-2xl font-bold tracking-tight">Restablece tu contraseña</h1>
          <p class="text-sm opacity-70">Introduce tu nueva contraseña</p>
        </div>
        <div>
          @if (!token) {
            <p class="text-destructive text-sm">El enlace no es válido. Solicita uno nuevo.</p>
          } @else {
            <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
              <app-form-field label="Nueva contraseña" for="password">
                <input id="password" type="password" appInput formControlName="password" />
              </app-form-field>
              <app-form-field label="Repite la contraseña" for="confirm">
                <input id="confirm" type="password" appInput formControlName="confirm" />
              </app-form-field>
              @if (mismatch()) {
                <p class="text-destructive text-sm">Las contraseñas no coinciden</p>
              }
              @if (tokenError()) {
                <p class="text-destructive text-sm">El enlace no es válido o ha caducado</p>
              }
              <button type="submit" class="w-full" [disabled]="form.invalid || submitting()" appBtn>
                Restablecer contraseña
              </button>
            </form>
          }
        </div>
      </section>
    </div>
  `
})
export class ResetPasswordComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _auth = inject(AuthService)
  private readonly _router = inject(Router)
  private readonly _route = inject(ActivatedRoute)

  readonly token = this._route.snapshot.queryParamMap.get('token') ?? ''
  readonly mismatch = signal(false)
  readonly tokenError = signal(false)
  readonly submitting = signal(false)

  readonly form = this._fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required, Validators.minLength(8)]]
  })

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      return
    }
    const { password, confirm } = this.form.getRawValue()
    if (password !== confirm) {
      this.mismatch.set(true)
      return
    }
    this.mismatch.set(false)
    this.tokenError.set(false)
    this.submitting.set(true)
    try {
      await this._auth.resetPassword({ token: this.token, password })
      await this._router.navigate(['/login'])
    } catch {
      this.tokenError.set(true)
    } finally {
      this.submitting.set(false)
    }
  }
}
