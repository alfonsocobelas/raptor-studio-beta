import { Module } from '@nestjs/common'
import { MODELS } from '@acc/generators/src/generators/resource/models/registry'
import { ChatPort } from './chat.port'
import { FakeChatAdapter } from './fake-chat.adapter'
import { AnthropicChatAdapter } from './anthropic-chat.adapter'
import { StudioChatController } from './studio-chat.controller'

/**
 * Chat de diseño del estudio. La clave API vive SOLO aquí (servidor): con
 * ANTHROPIC_API_KEY presente se usa el adapter real; sin ella, el fake
 * determinista (modo demo) — mismo puerto, mismos tests.
 */
@Module({
  controllers: [StudioChatController],
  providers: [
    {
      provide: ChatPort,
      useFactory: (): ChatPort =>
        process.env['ANTHROPIC_API_KEY'] ? new AnthropicChatAdapter(MODELS) : new FakeChatAdapter(MODELS)
    }
  ]
})
export class StudioChatModule {}
