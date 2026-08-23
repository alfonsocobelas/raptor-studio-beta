import { readFileSync } from 'fs'
import * as path from 'path'
import { provideRouter } from '@angular/router'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { renderSystemPreview } from '../../../../../../../tools/emit-system-preview'
import { LoginComponent } from './login.component'
import { ProfileComponent } from './profile.component'
import { UsersListComponent } from './users-list.component'

/**
 * Spec 57: las vistas de sistema del lienzo son COPIAS sincronizadas de los assets del plugin
 * de auth. Este test es el contrato (mismo patrón que tools/slots.json): si el asset cambia y
 * no se re-ejecuta `npm run system-preview`, el desfase es una suite roja, no una mentira en
 * el lienzo.
 */
describe('system-preview', () => {
  it('está al día respecto a los assets del plugin de auth', () => {
    for (const [name, rendered] of renderSystemPreview()) {
      const committed = readFileSync(path.join(__dirname, name), 'utf-8')

      expect(committed, `${name} desactualizado: ejecuta npm run system-preview`).toBe(rendered)
    }
  })

  it('las tres vistas montan de verdad con los dobles (esto es lo que verá el lienzo)', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] })

    const login = TestBed.createComponent(LoginComponent)
    login.detectChanges()
    expect(login.nativeElement.textContent).toContain('Acceder')

    const profile = TestBed.createComponent(ProfileComponent)
    profile.detectChanges()
    expect(profile.nativeElement.textContent).toContain('Mi cuenta')
    expect(profile.nativeElement.textContent).toContain('admin@app.local')

    const users = TestBed.createComponent(UsersListComponent)
    users.detectChanges()
    await users.whenStable()
    users.detectChanges()
    expect(users.nativeElement.textContent).toContain('user@app.local')
  })

  it('ninguna copia importa los servicios reales del emitido: solo los dobles del preview', () => {
    for (const [name, rendered] of renderSystemPreview()) {
      expect(rendered, name).not.toContain("core/services/auth.service'")
      expect(rendered, name).not.toContain("core/services/user.service'")
    }
  })
})
