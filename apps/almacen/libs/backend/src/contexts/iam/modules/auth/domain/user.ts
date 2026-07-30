import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { UserId } from '../../../../shared/domain/value-objects/iam/user-id.vo'
import { UserPrimitiveProps } from './auth-types'
import { Email } from './value-objects/email.vo'
import { PasswordHash } from './value-objects/password-hash.vo'
import { UserName } from './value-objects/user-name.vo'
import { UserRole } from './value-objects/user-role.vo'
import { UserStatus } from './value-objects/user-status.vo'

export interface UserInviteProps {
  id: UserId
  email: Email
  name: UserName
  role: UserRole
}

export class User extends AggregateRoot {
  private constructor(
    private readonly _id: UserId,
    private readonly _email: Email,
    private _name: UserName,
    private _passwordHash: Nullable<PasswordHash>,
    private _role: UserRole,
    private _status: UserStatus,
    private _failedLoginAttempts: number,
    private _lockedUntil: Nullable<Date>,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super()
  }

  get id(): UserId {
    return this._id
  }
  get email(): Email {
    return this._email
  }
  get name(): UserName {
    return this._name
  }
  get passwordHash(): Nullable<PasswordHash> {
    return this._passwordHash
  }
  get role(): UserRole {
    return this._role
  }
  get status(): UserStatus {
    return this._status
  }

  static invite(props: UserInviteProps): User {
    const now = new Date()
    return new User(
      props.id,
      props.email,
      props.name,
      null,
      props.role,
      UserStatus.create('pending'),
      0,
      null,
      now,
      now
    )
  }

  static fromPrimitives(props: UserPrimitiveProps): User {
    return new User(
      UserId.create(props.id),
      Email.create(props.email),
      UserName.create(props.name),
      props.passwordHash ? PasswordHash.create(props.passwordHash) : null,
      UserRole.create(props.role),
      UserStatus.create(props.status),
      props.failedLoginAttempts,
      props.lockedUntil ? new Date(props.lockedUntil) : null,
      new Date(props.createdAt),
      new Date(props.updatedAt)
    )
  }

  toPrimitives(): UserPrimitiveProps {
    return {
      id: this._id.value,
      email: this._email.value,
      name: this._name.value,
      passwordHash: this._passwordHash?.value ?? null,
      role: this._role.value as UserPrimitiveProps['role'],
      status: this._status.value as UserPrimitiveProps['status'],
      failedLoginAttempts: this._failedLoginAttempts,
      lockedUntil: this._lockedUntil,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  activateWithPassword(hash: PasswordHash): void {
    this._passwordHash = hash
    this._status = UserStatus.create('active')
    this._failedLoginAttempts = 0
    this._lockedUntil = null
    this.touch()
  }

  changePassword(hash: PasswordHash): void {
    this._passwordHash = hash
    this._failedLoginAttempts = 0
    this._lockedUntil = null
    this.touch()
  }

  changeRole(role: UserRole): void {
    this._role = role
    this.touch()
  }

  disable(): void {
    this._status = UserStatus.create('disabled')
    this.touch()
  }

  reactivate(): void {
    this._status = UserStatus.create('active')
    this.touch()
  }

  registerFailedLogin(now: Date, maxAttempts: number, lockMinutes: number): void {
    this._failedLoginAttempts += 1
    if (this._failedLoginAttempts >= maxAttempts) {
      this._lockedUntil = new Date(now.getTime() + lockMinutes * 60_000)
      this._failedLoginAttempts = 0
    }
    this.touch()
  }

  clearFailedLogins(): void {
    this._failedLoginAttempts = 0
    this._lockedUntil = null
    this.touch()
  }

  isLocked(now: Date): boolean {
    return this._lockedUntil !== null && this._lockedUntil.getTime() > now.getTime()
  }

  canLogin(now: Date): boolean {
    return this._status.isActive() && this._passwordHash !== null && !this.isLocked(now)
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof User)) {
      return false
    }
    return this._id.equals(other._id)
  }

  private touch(): void {
    this._updatedAt = new Date()
  }
}
