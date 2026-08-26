import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AppButton } from '../../shared/components/ui/button.directive'
import { AppFormField } from '../../shared/components/ui/form-field'
import { AppInput } from '../../shared/components/ui/input.directive'
import { AuthService } from '../../core/services/auth.service'
import { AppLogo } from '../../shared/components/app-logo'

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AppButton, AppFormField, AppInput, AppLogo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <section class="bg-card w-full max-w-md rounded-lg border p-6 shadow-sm">
        <!-- lockup horizontal como la referencia: logo junto al nombre del producto -->
        <div class="mb-6 flex items-center justify-center gap-3">
          <app-logo class="size-12 shrink-0" />
          <div class="text-left">
            <h1 class="text-2xl font-bold tracking-tight">App Golden</h1>
            <p class="text-muted-foreground text-sm">Accede con tu cuenta</p>
          </div>
        </div>
        <div>
          <form class="space-y-6" [formGroup]="form" (ngSubmit)="login()">
            <app-form-field label="Email" for="email">
              <input id="email" type="email" appInput formControlName="email" placeholder="tu@empresa.com" />
            </app-form-field>
            <app-form-field label="Contraseña" for="password">
              <input id="password" type="password" appInput formControlName="password" />
              <a class="text-muted-foreground hover:text-foreground text-sm underline" routerLink="/forgot-password">
                ¿Has olvidado tu contraseña?
              </a>
            </app-form-field>
            @if (error()) {
              <p class="text-destructive text-sm">Credenciales incorrectas</p>
            }
            <button type="submit" class="w-full" [disabled]="form.invalid || submitting()" appBtn>Acceder</button>
          </form>
        </div>
      </section>
    </div>
  `
})
export class LoginComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _auth = inject(AuthService)
  private readonly _router = inject(Router)

  readonly error = signal(false)
  readonly submitting = signal(false)

  readonly form = this._fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  })

  async login(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      return
    }
    this.error.set(false)
    this.submitting.set(true)
    try {
      const { email, password } = this.form.getRawValue()
      await this._auth.login({ email, password })
      await this._router.navigate(['/'])
    } catch {
      this.error.set(true)
    } finally {
      this.submitting.set(false)
    }
  }
}
