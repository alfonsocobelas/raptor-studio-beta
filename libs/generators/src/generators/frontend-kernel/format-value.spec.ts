import * as fs from 'fs'
import * as path from 'path'

/**
 * Tres defectos seguidos (booleanos true/false, año 2.019, enum en_curso) tenían
 * la misma causa: cada pantalla formateaba por su cuenta. Este test fija que el
 * kernel emite UN formateador y que las plantillas que lo necesitan lo usan.
 */
describe('formateador compartido del kernel', () => {
  const read = (relative: string): string =>
    fs.readFileSync(path.join(__dirname, '..', relative), 'utf-8')

  it('el kernel emite el formateador', () => {
    const emitted = read('frontend-kernel/files/shared/utils/format-value.ts.template')

    expect(emitted).toContain('export function formatValue')
    expect(emitted).toContain('useGrouping: false')
    expect(emitted).toContain("'Sí' : 'No'")
    expect(emitted).toContain('format.labels')
  })

  it('la ficha, la tabla relacionada y la galería lo usan en vez de reimplementarlo', () => {
    const consumers = [
      'resource/files-detail/frontend/__fileName__-detail.component.ts.template',
      'frontend-kernel/files/shared/components/related-table.ts.template',
      'resource/files-gallery/frontend/__plural__-gallery.component.ts.template'
    ]

    for (const consumer of consumers) {
      const emitted = read(consumer)

      expect(emitted).toContain('formatValue')
      // nadie vuelve a inventarse el formato de un número o un booleano
      expect(emitted).not.toContain('useGrouping')
      expect(emitted).not.toContain("? 'Sí' : 'No'")
    }
  })
})
