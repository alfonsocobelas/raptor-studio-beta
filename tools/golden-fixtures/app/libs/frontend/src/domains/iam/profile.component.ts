import { HttpErrorResponse } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { UserRoleEnum } from '@app/shared/domain'
import { AppBadge } from '../../shared/components/ui/badge.directive'
import { AppButton } from '../../shared/components/ui/button.directive'
import { AppFormField } from '../../shared/components/ui/form-field'
import { AppInput } from '../../shared/components/ui/input.directive'
import { AuthService } from '../../core/services/auth.service'
import { BadgeVariant, USER_ROLE_LABELS, USER_ROLE_VARIANTS } from './iam-labels'

const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

const passwordsMatch = (group: AbstractControl): ValidationErrors | null =>
  group.value.newPassword === group.value.confirm ? null : { mismatch: true }

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, AppBadge, AppButton, AppFormField, AppInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-6">
      <h1 class="text-2xl font-semibold">Mi cuenta</h1>

      <section class="bg-card rounded-lg border p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold">Datos</h2>
        @if (user(); as u) {
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Nombre</dt>
              <dd class="truncate">{{ u.name }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Email</dt>
              <dd class="truncate">{{ u.email }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Rol</dt>
              <dd>
                <span appBadge [variant]="roleVariant(u.role)">{{ roleLabel(u.role) }}</span>
              </dd>
            </div>
          </dl>
        }
      </section>

      <section class="bg-card rounded-lg border p-6 shadow-sm">
        <h2 class="text-lg font-semibold">Cambiar contraseña</h2>
        <p class="text-muted-foreground mb-4 text-sm">
          Al guardar se cerrarán tus sesiones en el resto de dispositivos
        </p>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <app-form-field label="Contraseña actual" for="currentPassword">
            <input id="currentPassword" type="password" appInput formControlName="currentPassword" />
            @if (wrongCurrent()) {
              <p class="text-destructive text-sm">La contraseña actual no es correcta</p>
            }
          </app-form-field>
          <app-form-field label="Nueva contraseña" for="newPassword">
            <input id="newPassword" type="password" appInput formControlName="newPassword" />
          </app-form-field>
          <app-form-field label="Repite la nueva contraseña" for="confirm">
            <input id="confirm" type="password" appInput formControlName="confirm" />
            @if (mismatch()) {
              <p class="text-destructive text-sm">Las contraseñas no coinciden</p>
            }
          </app-form-field>
          @if (genericError()) {
            <p class="text-destructive text-sm">No se pudo cambiar la contraseña. Inténtalo de nuevo.</p>
          }
          @if (success()) {
            <p class="text-sm text-green-600 dark:text-green-500">Contraseña actualizada</p>
          }
          <button type="submit" [disabled]="form.invalid || submitting()" appBtn>Guardar</button>
        </form>
      </section>
    </div>
  `
})
export class ProfileComponent {
  private readonly _fb = inject(FormBuilder)
  private readonly _auth = inject(AuthService)

  readonly user = this._auth.currentUser

  readonly submitting = signal(false)
  readonly wrongCurrent = signal(false)
  readonly genericError = signal(false)
  readonly success = signal(false)

  readonly form = this._fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(PASSWORD_MIN), Validators.maxLength(PASSWORD_MAX)]],
      confirm: ['', Validators.required]
    },
    { validators: passwordsMatch }
  )

  mismatch(): boolean {
    return this.form.hasError('mismatch') && this.form.controls.confirm.dirty
  }

  roleLabel(role: UserRoleEnum): string {
    return USER_ROLE_LABELS[role] ?? role
  }

  roleVariant(role: UserRoleEnum): BadgeVariant {
    return USER_ROLE_VARIANTS[role] ?? 'secondary'
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      return
    }
    this.wrongCurrent.set(false)
    this.genericError.set(false)
    this.success.set(false)
    this.submitting.set(true)
    try {
      const { currentPassword, newPassword } = this.form.getRawValue()
      await this._auth.changePassword({ currentPassword, newPassword })
      this.success.set(true)
      this.form.reset()
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.wrongCurrent.set(true)
      } else {
        this.genericError.set(true)
      }
    } finally {
      this.submitting.set(false)
    }
  }
}
