/**
 * «En curso» → «en_curso»: el valor va a la base, la etiqueta a la pantalla. La regla vive
 * una sola vez porque el value se deriva SIEMPRE del label, se edite el enum donde se edite
 * (popover de columna en Vistas o panel de campo en Modelo).
 */
export function slug(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}
