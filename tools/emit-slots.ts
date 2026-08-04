/**
 * Regenera `tools/slots.json` desde el registro de ranuras del generador (spec 23).
 * Es la fuente única de las opciones que ofrece el estudio: si añades un proveedor,
 * ejecuta `npm run slots` y commitea el JSON — un test falla si se queda atrás.
 */
import { writeFileSync } from 'fs'
import * as path from 'path'
import { renderSlotsManifest } from '../libs/generators/src/generators/app/plugins/manifest'

const target = path.join(__dirname, 'slots.json')
writeFileSync(target, renderSlotsManifest())
console.log(`✅ ${path.relative(process.cwd(), target)} regenerado desde SLOTS + PLUGINS`)
