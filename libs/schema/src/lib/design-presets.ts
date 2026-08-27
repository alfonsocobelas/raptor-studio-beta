/**
 * Presets de diseño (spec 37).
 *
 * Por qué existe esta ranura: cambiar de librería de componentes NO cambia la app. Medido el
 * 2026-08-09 generando la misma app con spartan y con material — 12 ficheros distintos de ~750,
 * y el listado y el diálogo IDÉNTICOS byte a byte, porque las pantallas consumen los contratos
 * neutrales del ADR-003. Lo que sí se percibe al abrir la app es el SHELL (dónde vive la
 * navegación), la DENSIDAD y el cromo. Eso es lo que parametriza un preset.
 *
 * Un preset aporta tres cosas y ninguna más:
 *   1. `files`  — su carpeta de override, copiada DESPUÉS del esqueleto (gana su app.component)
 *   2. `tokens` — los tokens DEL TEMA que pisa; se inyectan dentro de `:root .theme-x`
 *   3. `css`    — sus reglas y sus tokens propios, añadidos al final del styles.css del tema
 *
 * Por qué `tokens` va aparte de `css` (spec 67): el bloque `css` se añade al final del fichero,
 * y ahí `:root { --radius: 0 }` es CSS MUERTO. El tema declara ese mismo token en
 * `:root .theme-x`, que es más específico (0,2,0 contra 0,1,0) y además vive en el <body>, más
 * cerca del contenido. Ningún selector estable lo bate desde fuera. Lo que sí es estable es el
 * orden de declaración dentro del mismo bloque, así que los tokens del preset entran ahí,
 * detrás de los del tema.
 *
 * No aporta componentes: los emitidos siguen siendo los mismos, con sus mismos tests.
 *
 * Hoy el catálogo tiene UNA entrada. Las cinco pieles que existieron (cabina, suite y la familia
 * raptor: taller, banco, rótulo) se retiraron el 2026-08-27 por decisión de Alfonso; lo que
 * queda es la maquinaria, que sigue siendo la de siempre: una piel nueva es una entrada de esta
 * lista más su carpeta `files-design/<id>/`.
 */
export interface DesignPreset {
  id: string
  label: string
  description: string
  /** Carpeta de override relativa a app/, o undefined si no cambia el esqueleto */
  files?: string
  /** Declaraciones que pisan tokens del tema, inyectadas dentro de su bloque; '' si ninguna */
  tokens: string
  /** Bloque CSS del preset; '' si se conforma con los tokens del tema */
  css: string
}

export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: 'actual',
    label: 'Actual (neutro)',
    description: 'El shell que ya emite el acelerador: barra lateral sobria, sin identidad de sector',
    tokens: '',
    css: ''
  }
]

export const DEFAULT_DESIGN = 'actual'

/** El preset elegido, validado. Un id desconocido rompe ANTES de emitir un solo fichero. */
export function selectDesign(value: string | undefined): DesignPreset {
  const id = value ?? DEFAULT_DESIGN
  const preset = DESIGN_PRESETS.find(p => p.id === id)
  if (!preset) {
    throw new Error(`Unknown design '${id}'. Available: ${DESIGN_PRESETS.map(p => p.id).join(', ')}`)
  }
  return preset
}
