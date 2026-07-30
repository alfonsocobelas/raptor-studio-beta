import { IsIn } from 'class-validator'
import { UserRole } from '../../../domain/value-objects/user-role.vo'

export class ChangeUserRoleHttpDto {
  // Derivado del VO, como el resto de DTOs del repo: una lista literal se queda atrás al añadir un
  // rol y el endpoint responde 400 aunque el dominio sí lo acepte (pasó con `viewer`, spec 50).
  @IsIn([...UserRole.VALUES])
  role!: string
}
