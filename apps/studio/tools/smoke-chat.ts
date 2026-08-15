/**
 * Smoke del chat de diseño (modo fake, sin backend Nest levantado):
 * Playwright intercepta POST /api/v1/studio/chat y delega en el
 * FakeChatAdapter y el gate REALES del backend — verifica el circuito
 * panel → HTTP → adapter → gate → applyExternal → lienzo.
 *
 *   npx tsx tools/smoke-chat.ts   (con `ng serve --port 4312` corriendo)
 */
import { chromium } from 'playwright'
import { FakeChatAdapter } from '../libs/backend/src/contexts/studio/chat/fake-chat.adapter'
import { validateProposal } from '../libs/backend/src/contexts/studio/chat/validate-proposal'
import { MODELS } from '@raptor/generators/src/generators/resource/models/registry'
import type { AppDefinition } from '@raptor/schema'
import type { ChatMessage } from '../libs/backend/src/contexts/studio/chat/chat.types'

const adapter = new FakeChatAdapter(MODELS)

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1700, height: 950 } })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.route('**/api/v1/studio/chat', async route => {
    const body = route.request().postDataJSON() as { messages: ChatMessage[]; schema: AppDefinition }
    try {
      const proposal = await adapter.propose(body.messages, body.schema)
      const schema = validateProposal(proposal.schema)
      await route.fulfill({ json: { reply: proposal.reply, schema, mode: 'fake' } })
    } catch (e) {
      await route.fulfill({ status: 422, json: { message: `La propuesta de la IA no pasa el gate: ${String(e)}` } })
    }
  })

  await page.goto('http://localhost:4312/studio', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('[data-testid="chat-input"]')
  const nav = '[data-testid="studio-page-nav"] [data-testid^="studio-page-"]'

  const send = async (text: string): Promise<void> => {
    await page.fill('[data-testid="chat-input"]', text)
    await page.click('[data-testid="chat-send"]')
    await page.waitForSelector('[data-testid="chat-pending"]', { state: 'detached' })
  }

  // 1. quitar página por chat → el nav pierde una entrada
  await send('quita la página de prendas')
  await page.waitForFunction(sel => document.querySelectorAll(sel).length === 3, nav)

  // 2. modo demo visible
  const fakeBadge = (await page.locator('[data-testid="chat-mode-fake"]').count()) === 1

  // 3. añadir de nuevo → el nav crece
  await send('añade la página de prendas')
  await page.waitForFunction(sel => document.querySelectorAll(sel).length === 4, nav)

  // 4. duplicar → el gate rechaza y el lienzo NO cambia
  await send('añade la página de prendas')
  await page.waitForSelector('[data-testid="chat-error"]')
  const navAfterRejected = await page.locator(nav).count()

  // 5. el schema JSON refleja el estado final
  const schemaText = await page.locator('[data-testid="schema-json"]').textContent()
  const parsed = JSON.parse(schemaText ?? '{}') as AppDefinition
  const garmentPages = parsed.pages.filter(p => p.kind === 'resource' && p.resource === 'garment').length

  await page.screenshot({ path: '/tmp/studio-chat-smoke.png' })
  await browser.close()

  const results = { fakeBadge, navAfterRejected, garmentPages, errors }
  console.log(JSON.stringify(results))
  if (!fakeBadge || navAfterRejected !== 4 || garmentPages !== 1 || errors.length) {
    process.exitCode = 1
  }
}

void main()
