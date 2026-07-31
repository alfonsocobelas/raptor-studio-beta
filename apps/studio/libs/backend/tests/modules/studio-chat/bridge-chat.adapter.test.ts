import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { BridgeChatAdapter } from '@app/backend/contexts/studio/chat/bridge-chat.adapter'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'

const design: DesignPayload = { appName: 'mi-app', resources: [], pages: [] }

describe('BridgeChatAdapter — arnés request/response por ficheros', () => {
  it('escribe la petición y devuelve la respuesta cuando aparece', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bridge-'))
    const adapter = new BridgeChatAdapter(dir, 5000, 50)

    const pending = adapter.propose([{ role: 'user', text: 'hola' }], design)
    // simula la sesión de Claude Code al otro lado del puente
    await new Promise(resolve => setTimeout(resolve, 150))
    const requestFile = readdirSync(dir).find(f => f.startsWith('request-'))
    expect(requestFile).toBeDefined()
    const request = JSON.parse(readFileSync(path.join(dir, requestFile as string), 'utf-8'))
    expect(request.messages[0].text).toBe('hola')
    writeFileSync(
      path.join(dir, `response-${request.id}.json`),
      JSON.stringify({ reply: 'diseñado', design })
    )

    const proposal = await pending
    expect(proposal.reply).toBe('diseñado')
  })

  it('agota el timeout con un error claro si nadie responde', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bridge-'))
    const adapter = new BridgeChatAdapter(dir, 300, 50)

    await expect(adapter.propose([{ role: 'user', text: 'x' }], design)).rejects.toThrow(/puente no respondió/)
  })
})
