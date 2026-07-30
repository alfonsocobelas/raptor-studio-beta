import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator'
import { AUTH_CONSTRAINTS } from '../../../domain/auth-constants'
import { UserRole } from '../../../domain/value-objects/user-role.vo'

export class LoginHttpDto {
  @IsEmail()
  @MaxLength(AUTH_CONSTRAINTS.EMAIL.MAX)
  email!: string

  @IsString()
  password!: string
}

export class AcceptInvitationHttpDto {
  @IsString()
  token!: string

  @IsString()
  @MinLength(AUTH_CONSTRAINTS.PASSWORD.MIN)
  @MaxLength(AUTH_CONSTRAINTS.PASSWORD.MAX)
  password!: string
}

export class ForgotPasswordHttpDto {
  @IsEmail()
  @MaxLength(AUTH_CONSTRAINTS.EMAIL.MAX)
  email!: string
}

export class ResetPasswordHttpDto {
  @IsString()
  token!: string

  @IsString()
  @MinLength(AUTH_CONSTRAINTS.PASSWORD.MIN)
  @MaxLength(AUTH_CONSTRAINTS.PASSWORD.MAX)
  password!: string
}

export class InviteUserHttpDto {
  @IsEmail()
  @MaxLength(AUTH_CONSTRAINTS.EMAIL.MAX)
  email!: string

  @IsString()
  @MaxLength(AUTH_CONSTRAINTS.NAME.MAX)
  name!: string

  // Derivado del VO, como el resto de DTOs del repo (ver users-request.dtos.ts).
  @IsIn([...UserRole.VALUES])
  role!: string
}
