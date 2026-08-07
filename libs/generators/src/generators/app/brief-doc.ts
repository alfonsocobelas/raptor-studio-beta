import type { BusinessBrief, ResourceDefinition } from '@acc/schema'

/**
 * El brief aterriza como CLAUDE.md en la raíz de la app generada (spec 22): la memoria del negocio
 * que acompaña al código. No genera ni altera un byte de código (regla 7) — es la documentación que
 * la spec de los huecos @ai leerá algún día. Markdown construido aquí (regla 8): la plantilla solo
 * interpola el resultado.
 */
export function renderClaudeMd(appName: string, brief: BusinessBrief, models: ResourceDefinition[]): string {
  const sections: string[] = [
    `# ${appName} — contexto del negocio`,
    '',
    '> Destilado de la conversación de diseño en el estudio. Corrige aquí lo que cambie:',
    '> este fichero es la memoria del negocio que acompaña al código generado.',
    '',
    '## Negocio',
    '',
    brief.business
  ]

  if (brief.rules?.length) {
    sections.push('', '## Reglas', '', ...brief.rules.map(rule => `- ${rule}`))
  }

  if (brief.glossary?.length) {
    sections.push('', '## Glosario', '', ...brief.glossary.map(entry => `- **${entry.term}**: ${entry.means}`))
  }

  const withBrief = models.filter(model => model.brief)
  if (withBrief.length) {
    sections.push(
      '',
      '## Entidades',
      '',
      ...withBrief.map(model => `- **${model.labels?.singular ?? model.name}**: ${model.brief}`)
    )
  }

  return sections.join('\n') + '\n'
}
