import { ParseUUIDPipe } from '@nestjs/common'

export const ParseUUIDv7Pipe = new ParseUUIDPipe({ version: '7' })
