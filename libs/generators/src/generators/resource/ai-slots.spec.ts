import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { harvestAiSlots, reinjectAiSlots, stripAiSlots } from './ai-slots'
import { resourceGenerator } from './resource'

describe('ai slots', () => {
  describe('harvest + reinject (unit)', () => {
    it('carries slot content from the old file into the regenerated one', () => {
      const tree = createTreeWithEmptyWorkspace()
      tree.write(
        'out/domain/customer.ts',
        [
          'class Customer {',
          '  // @ai:begin domain-extra',
          '  hasTaxId(): boolean {',
          '    return true',
          '  }',
          '  // @ai:end',
          '}'
        ].join('\n')
      )

      const harvest = harvestAiSlots(tree, 'out')

      tree.write(
        'out/domain/customer.ts',
        ['class Customer {', '  // @ai:begin domain-extra', '  // @ai:end', '}'].join('\n')
      )
      reinjectAiSlots(tree, 'out', harvest)

      const content = tree.read('out/domain/customer.ts', 'utf-8') ?? ''
      expect(content).toContain('hasTaxId(): boolean')
      expect(content.indexOf('// @ai:begin domain-extra')).toBeLessThan(content.indexOf('hasTaxId'))
      expect(content.indexOf('hasTaxId')).toBeLessThan(content.indexOf('// @ai:end'))
    })

    it('leaves untouched slots empty and ignores slots that vanished', () => {
      const tree = createTreeWithEmptyWorkspace()
      tree.write('out/a.ts', '// @ai:begin gone\nx()\n// @ai:end\n')
      const harvest = harvestAiSlots(tree, 'out')

      tree.write('out/a.ts', '// @ai:begin fresh\n// @ai:end\n')
      reinjectAiSlots(tree, 'out', harvest)

      expect(tree.read('out/a.ts', 'utf-8')).toBe('// @ai:begin fresh\n// @ai:end\n')
    })
  })

  describe('strip (paso de entrega)', () => {
    it('removes the marker lines but keeps the slot body, TS and HTML alike', () => {
      const tree = createTreeWithEmptyWorkspace()
      tree.write(
        'out/domain/customer.ts',
        [
          'class Customer {',
          '  // @ai:begin domain-extra — métodos de negocio no derivables del schema',
          '  hasTaxId(): boolean {',
          '    return true',
          '  }',
          '  // @ai:end',
          '}'
        ].join('\n')
      )
      tree.write(
        'out/dashboard.component.ts',
        [
          '<section>',
          '        <!-- @ai:begin dashboard-extra — secciones de dominio -->',
          '        <p>Ventas</p>',
          '        <!-- @ai:end -->',
          '</section>'
        ].join('\n')
      )

      stripAiSlots(tree, 'out')

      expect(tree.read('out/domain/customer.ts', 'utf-8')).toBe(
        ['class Customer {', '  hasTaxId(): boolean {', '    return true', '  }', '}'].join('\n')
      )
      expect(tree.read('out/dashboard.component.ts', 'utf-8')).toBe(
        ['<section>', '        <p>Ventas</p>', '</section>'].join('\n')
      )
    })

    it('removes empty slots without leaving blank lines behind', () => {
      const tree = createTreeWithEmptyWorkspace()
      tree.write('out/a.ts', 'class A {\n  // @ai:begin domain-extra\n  // @ai:end\n}\n')

      stripAiSlots(tree, 'out')

      expect(tree.read('out/a.ts', 'utf-8')).toBe('class A {\n}\n')
    })

    it('leaves files without markers untouched', () => {
      const tree = createTreeWithEmptyWorkspace()
      tree.write('out/plain.ts', 'export const x = 1\n')

      stripAiSlots(tree, 'out')

      expect(tree.read('out/plain.ts', 'utf-8')).toBe('export const x = 1\n')
    })
  })

  describe('end to end (resource generator)', () => {
    it('emits the domain-extra slot and preserves its content across regeneration', async () => {
      const tree = createTreeWithEmptyWorkspace()
      await resourceGenerator(tree, { name: 'customer' })

      const file = 'tmp/generated/customers/backend/domain/customer.ts'
      const emitted = tree.read(file, 'utf-8') ?? ''
      expect(emitted).toContain('// @ai:begin domain-extra')

      tree.write(
        file,
        emitted.replace(
          '// @ai:begin domain-extra',
          '// @ai:begin domain-extra\n  hasTaxId(): boolean {\n    return !this._taxId.isEmpty()\n  }'
        )
      )

      await resourceGenerator(tree, { name: 'customer' })
      expect(tree.read(file, 'utf-8')).toContain('hasTaxId(): boolean')
    })
  })
})
