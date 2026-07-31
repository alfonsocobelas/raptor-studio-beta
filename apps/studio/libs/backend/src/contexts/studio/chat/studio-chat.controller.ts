import { Body, Controller, Post, UnprocessableEntityException } from '@nestjs/common'
import { IsArray, IsIn, IsObject, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ChatPort } from './chat.port'
import { validateDesign } from './validate-proposal'
import type { ChatProposal, DesignPayload } from './chat.types'

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
  design!: DesignPayload
}

@Controller('studio/chat')
export class StudioChatController {
  constructor(private readonly chat: ChatPort) {}

  @Post()
  async propose(@Body() body: ChatRequestDto): Promise<ChatProposal & { mode: string }> {
    const proposal = await this.chat.propose(body.messages, body.design)
    try {
      // el gate manda: nada llega al lienzo sin validar
      const design = validateDesign(proposal.design)
      return { reply: proposal.reply, design, mode: this.chat.mode }
    } catch (e) {
      throw new UnprocessableEntityException(
        `La propuesta de la IA no pasa el gate: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }
}
