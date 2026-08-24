import type { Type } from '@angular/core'
import { LoginComponent } from './login.component'
import { ProfileComponent } from './profile.component'
import { UsersListComponent } from './users-list.component'

/**
 * Las vistas que regala la autenticación (spec 57): no son diseño — toda app generada las
 * lleva (auth de fábrica desde la spec 58) — así que el raíl las lista en su propio grupo y
 * el lienzo las enseña en solo lectura con los componentes REALES del emitido.
 */
export interface SystemView {
  id: string
  title: string
  component: Type<unknown>
  /** Se puede usar en el lienzo: los dobles son inertes, así que probar es seguro.
   * El login queda en solo lectura: su submit navega con el Router y sacaría al
   * usuario del estudio. */
  interactive: boolean
}

export const SYSTEM_VIEWS: SystemView[] = [
  { id: 'login', title: 'Login', component: LoginComponent, interactive: false },
  { id: 'users', title: 'Usuarios', component: UsersListComponent, interactive: true },
  { id: 'account', title: 'Mi cuenta', component: ProfileComponent, interactive: true }
]
