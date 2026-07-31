import { v7 as uuidv7 } from 'uuid'

/** Generates a UUIDv7 — the project-wide identifier format. */
export const generateId = (): string => uuidv7()
