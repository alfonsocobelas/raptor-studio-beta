export interface AddContactInput {
  customerId: string
  contact: {
    id: string
    name: string
    role?: string
    email?: string
    phone?: string
    isPrimary?: boolean
  }
}
