// Shared HTTP auth metadata keys. Live in shared/infrastructure so any bounded context
// (health, sap-licensing) can mark routes @Public/@Roles without importing IAM. The IAM
// guards read these same keys. Values kept stable ('iam:*') to preserve existing metadata.
export const IS_PUBLIC_KEY = 'iam:isPublic'
export const ROLES_KEY = 'iam:roles'
