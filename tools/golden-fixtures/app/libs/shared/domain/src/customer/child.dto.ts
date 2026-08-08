export interface ContactDto {
  id: string
  customerId: string
  name: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}

export interface AddContactDto {
  id: string
  name: string
  role?: string
  email?: string
  phone?: string
  isPrimary?: boolean
}

export interface UpdateContactDto {
  name?: string
  role?: string
  email?: string
  phone?: string
  isPrimary?: boolean
}
