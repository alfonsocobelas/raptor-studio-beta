import {
  roleConstantName,
  roleEnumMembersBlock,
  roleValuesList,
  roleValuesUnion,
  roleSeedEntries,
  roleLabelEntries,
  roleVariantEntries
} from './role-emission'

/**
 * Spec 76: las cadenas de emisión de roles. Con cero roles personalizados reproducen
 * EXACTAMENTE los literales actuales de las plantillas (gate de oro); con roles extra
 * los añaden detrás de los fijos, en el orden declarado.
 */
describe('role-emission — cadenas de emisión de roles (spec 76)', () => {
  const perito = { name: 'perito', label: 'Perito' }
  const backOffice = { name: 'back-office', label: 'Back office' }

  it('el miembro del enum sale del nombre kebab-case, no de toUpperCase', () => {
    expect(roleConstantName('perito')).toBe('PERITO')
    expect(roleConstantName('back-office')).toBe('BACK_OFFICE')
  })

  it('sin roles extra, el bloque del enum es el literal actual', () => {
    expect(roleEnumMembersBlock([])).toBe("  ADMIN = 'admin',\n  USER = 'user',\n  VIEWER = 'viewer'")
  })

  it('con roles extra, el enum los añade detrás en orden declarado', () => {
    expect(roleEnumMembersBlock([perito, backOffice])).toBe(
      "  ADMIN = 'admin',\n  USER = 'user',\n  VIEWER = 'viewer',\n  PERITO = 'perito',\n  BACK_OFFICE = 'back-office'"
    )
  })

  it('la lista de valores (VO y CHECK SQL) y la union (auth-types) llevan los fijos delante', () => {
    expect(roleValuesList([])).toBe("'admin', 'user', 'viewer'")
    expect(roleValuesList([perito])).toBe("'admin', 'user', 'viewer', 'perito'")
    expect(roleValuesUnion([])).toBe("'admin' | 'user' | 'viewer'")
    expect(roleValuesUnion([perito])).toBe("'admin' | 'user' | 'viewer' | 'perito'")
  })

  it('cada rol extra trae un usuario de seed local con su etiqueta', () => {
    expect(roleSeedEntries([])).toBe('')
    expect(roleSeedEntries([perito])).toBe(
      ",\n  { email: 'perito@app.local', name: 'Perito Local', role: 'perito' }"
    )
  })

  it('labels y variants de la pantalla IAM: etiqueta declarada y variant outline', () => {
    expect(roleLabelEntries([])).toBe('')
    expect(roleLabelEntries([perito])).toBe(",\n  [UserRoleEnum.PERITO]: 'Perito'")
    expect(roleVariantEntries([])).toBe('')
    expect(roleVariantEntries([backOffice])).toBe(",\n  'back-office': 'outline'")
  })
})
