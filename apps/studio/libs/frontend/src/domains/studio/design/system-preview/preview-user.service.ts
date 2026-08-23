import { Injectable, resource, signal } from '@angular/core'
import { InviteUserDto, UserDto, UserRoleEnum, UserStatusEnum } from '@app/shared/domain'

/** Misma forma que la del emitido: la vista pagina y filtra contra estos datos de muestra. */
export interface OffsetPaginatedOutput<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface UserRequest {
  page: number
  pageSize: number
  role?: UserRoleEnum
  status?: UserStatusEnum
  text?: string
}

const defaultRequest = (): UserRequest => ({ page: 1, pageSize: 20 })

// Los tres usuarios del seed local del emitido: la previsualización enseña lo mismo que
// vería quien arranque la app generada.
const SAMPLE_USERS: UserDto[] = [
  {
    id: '01900000-0000-7000-8000-000000000001',
    email: 'admin@app.local',
    name: 'Admin Local',
    role: UserRoleEnum.ADMIN,
    status: UserStatusEnum.ACTIVE,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z'
  },
  {
    id: '01900000-0000-7000-8000-000000000002',
    email: 'user@app.local',
    name: 'Usuario Local',
    role: UserRoleEnum.USER,
    status: UserStatusEnum.ACTIVE,
    createdAt: '2026-01-16T10:30:00.000Z',
    updatedAt: '2026-01-16T10:30:00.000Z'
  },
  {
    id: '01900000-0000-7000-8000-000000000003',
    email: 'viewer@app.local',
    name: 'Auditor Local',
    role: UserRoleEnum.VIEWER,
    status: UserStatusEnum.ACTIVE,
    createdAt: '2026-01-17T08:15:00.000Z',
    updatedAt: '2026-01-17T08:15:00.000Z'
  }
]

/**
 * Doble de previsualización del UserService emitido (spec 57). Mismo nombre de clase y misma
 * superficie (request/resetRequest/users/invite/changeRole/disable/reactivate) para que la
 * copia sincronizada de users-list compile sin tocar su código. El "backend" es la lista de
 * muestra: filtra y pagina en memoria, y las acciones son inertes.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  readonly request = signal<UserRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly users = resource<OffsetPaginatedOutput<UserDto>, UserRequest>({
    params: () => this.request(),
    loader: async ({ params: req }) => {
      const filtered = SAMPLE_USERS.filter(
        user =>
          (!req.role || user.role === req.role) &&
          (!req.status || user.status === req.status) &&
          (!req.text || user.email.includes(req.text))
      )
      const start = (req.page - 1) * req.pageSize
      return {
        items: filtered.slice(start, start + req.pageSize),
        total: filtered.length,
        page: req.page,
        pageSize: req.pageSize
      }
    }
  })

  async invite(_dto: InviteUserDto): Promise<void> {
    // inerte: la vista de sistema se mira, no se usa
  }

  async changeRole(_id: string, _role: UserRoleEnum): Promise<void> {
    // inerte
  }

  async disable(_id: string): Promise<void> {
    // inerte
  }

  async reactivate(_id: string): Promise<void> {
    // inerte
  }
}
