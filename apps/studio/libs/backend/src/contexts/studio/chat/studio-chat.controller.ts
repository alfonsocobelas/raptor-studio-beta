import { Body, Controller, Post, UnprocessableEntityException } from '@nestjs/common'
import { IsArray, IsIn, IsObject, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import type { AppDefinition } from '@acc/schema'
import { ChatPort } from './chat.port'
import { validateProposal } from './validate-proposal'
import type { ChatProposal } from './chat.types'

class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant'

  @IsString()
  text!: string
}

class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]

  @IsObject()
  schema!: AppDefinition
}

@Controller('studio/chat')
export class StudioChatController {
  constructor(private readonly chat: ChatPort) {}

  @Post()
  async propose(@Body() body: ChatRequestDto): Promise<ChatProposal & { mode: string }> {
    const proposal = await this.chat.propose(body.messages, body.schema)
    try {
      // el gate manda: nada llega al lienzo sin validar contra el catálogo
      const schema = validateProposal(proposal.schema)
      return { reply: proposal.reply, schema, mode: this.chat.mode }
    } catch (e) {
      throw new UnprocessableEntityException(
        `La propuesta de la IA no pasa el gate: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }
}
