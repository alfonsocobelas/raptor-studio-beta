# Spec: Historial de diseños del estudio

## Contexto de negocio

Hoy el diseño del lienzo vive **solo en memoria** (`DesignStore`, signals en el
root injector). Recargar la pestaña, reiniciar el `studio-api` o cerrar el
navegador borra el trabajo sin aviso. Y una vez generada la app (`apps/vetcare2`,
`apps/boutique`…) no queda ninguna huella de qué diseño la produjo: el
`.app.json` que consume el generador se escribe en un `mkdtemp` del sistema y
muere ahí.

Alfonso trabaja en sesiones cortas sobre varios diseños a la vez (una demo de
cliente, un almacén, el dogfood del estudio) y necesita dos cosas: que el
borrador en curso **no se pierda**, y poder **recuperar la última modificación de
un diseño** para comprobar con sus propios ojos si la app generada se le parece.
No hace falta comparación automática ni registro de generaciones: eso lo juzga él
mirando.

## User stories (formato EARS)

- WHEN el usuario muta el lienzo (añadir vista, bloque, campo, renombrar, cambiar
  paleta) THEN el diseño activo se guarda en disco sin que él pulse nada.
- WHEN el usuario abre el estudio THEN se restaura el diseño que tenía activo, con
  sus entidades, sus vistas y su paleta.
- WHEN el usuario elige otro diseño del selector THEN el pendiente de guardar se
  escribe antes de cargar el nuevo.
- WHEN el usuario crea un diseño nuevo THEN el lienzo queda vacío y el diseño
  anterior permanece intacto en disco.
- WHEN el usuario renombra un diseño THEN el fichero pasa a llamarse por el nuevo
  slug y el antiguo desaparece.
- WHEN el usuario borra un diseño THEN se elimina su fichero y, si era el activo,
  el lienzo queda vacío.
- IF el fichero del diseño activo no existe, está corrupto o no pasa el gate
  THEN el lienzo arranca vacío y se muestra el motivo, sin aplicar un diseño a
  medias y sin borrar el fichero.
- IF el slug recibido por la API no encaja en `^[a-z0-9][a-z0-9-]*$` THEN la
  petición se rechaza con 400 y no se toca el sistema de ficheros.
- IF un `PUT` trae un diseño que no pasa `validateDesign` THEN se rechaza con 400
  y el fichero previo queda intacto.
- WHILE se está escribiendo un diseño THEN un fallo o interrupción nunca deja un
  JSON truncado en su ruta final (escritura atómica).
- WHILE el usuario teclea de seguido en el inspector THEN se emite **una sola**
  escritura tras el reposo, no una por pulsación.

## Criterios de aceptación

- [ ] `.studio/designs/<slug>.json` en la raíz del acelerador contiene el diseño
      activo tras cualquier mutación del lienzo (con ~1 s de reposo).
- [ ] Recargar el navegador restaura entidades, vistas y paleta idénticas.
- [ ] El selector de la barra lista los diseños guardados con su nombre y permite
      cambiar de activo, crear, renombrar y borrar.
- [ ] Un indicador discreto confirma el guardado y se apaga solo.
- [ ] `GET /api/v1/studio/designs` devuelve `slug`, `appName` y `updatedAt` sin
      cargar los cuerpos completos.
- [ ] Un slug con `..`, `/` o mayúsculas devuelve 400 y no escribe ni lee nada
      fuera de `.studio/designs/`.
- [ ] Un `PUT` con un diseño inválido devuelve 400 con el mensaje del gate.
- [ ] Un JSON corrupto en disco produce error limpio en `GET`, lienzo vacío y
      aviso en la UI; el fichero no se borra.
- [ ] Suite verde: `make test-back` y `make test-front`.

## Referencias del proyecto de referencia

- `docs/ADR-009-limite-de-composicion-de-vistas.md` — el diseño es *vistas
  compuestas de bloques*; es esa estructura la que se persiste, sin traducir.
- `docs/vision-editor-visual-schema.md` — fase 4 del roadmap (editor visual); esta
  spec es la pieza de durabilidad que faltaba en ella.
- `.claude/specs/10-studio-chat/` — `applyExternal` y el gate de aplicación de un
  diseño externo: cargar de disco reutiliza exactamente ese camino.
- `.claude/specs/18-paleta-y-texto/` — la paleta viaja a la app generada, así que
  forma parte del diseño y se persiste con él.
- `apps/studio/libs/backend/src/contexts/studio/generate/` — hermano directo del
  contexto nuevo: mismo estilo de controller local sobre el workspace.

## Reglas de negocio aplicables

- **El gate manda** (regla no negociable 4): un diseño solo entra al lienzo por
  `applyExternal`, que valida con `defineResource`/`defineApp` y hace rollback.
  Cargar de disco no abre una puerta trasera.
- **Validar toda entrada externa en el borde** (constitución): el slug es entrada
  externa que se convierte en ruta de fichero; se sanea antes de tocar disco.
- **YAGNI**: un fichero por diseño, sobrescrito. El historial de versiones lo da
  git al versionar `.studio/designs/`, no una máquina de snapshots.
- **Estado de ventana vs. estado del proyecto**: qué diseño está activo es de la
  ventana (localStorage); los diseños son del proyecto (disco). El servidor no
  guarda ninguna noción de sesión.
- **Plantillas y generador intactos**: esta spec no toca `libs/generators/`, así
  que no hay gate de oro que pasar.

## Fuera de scope (deliberado)

- **Registro de generaciones por diseño** (fecha, ui/db/plugins, ruta, ok/fallo).
  Decisión de Alfonso 2026-08-02: para esta versión basta recuperar la última
  modificación y comprobar a ojo.
- **Copia del `.app.json` dentro de la app generada**. Son tres líneas en
  `studio-generate.controller.ts` y quedan anotadas como futuro, pero no entran.
- **Diff automático diseño ↔ código emitido**: solapa con el gate `golden-diff` y
  es mucho más trabajo del que el problema pide.
- **Versionado/snapshots dentro del estudio** (`.bak`, historial de cambios,
  undo persistente). El fichero guarda la última modificación y nada más.
- **Multiusuario, bloqueos o concurrencia** entre dos pestañas sobre el mismo
  diseño: entorno local de un solo desarrollador; la última escritura gana.
- **Importar un `.app.json` de fuera** como diseño del estudio.
