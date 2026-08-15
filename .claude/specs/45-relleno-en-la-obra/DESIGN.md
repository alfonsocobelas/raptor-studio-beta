# Diseño técnico: El relleno llama a la puerta de la obra

_Decisión «opción b» 2026-08-15. La fontanería (generador fill-flow-slots + puente + gate)
existe desde la spec 39 y NO se toca en su lógica: esta spec la invoca y la asoma._

## 1. El borde (studio-api)

- **`done` de `POST /studio/generate/stream`** gana `slots: string[]` — los huecos `flow-*`
  aún vacíos en la app emitida, contados con un escáner de disco propio del studio-api
  (regex del hueco vacío; el generador no puede prestarnos el suyo sin un Tree de nx).
- **`POST /studio/fill-slots/stream`** `{directory}`: lanza
  `npx nx g @acc/generators:fill-flow-slots --directory=… --bridge=tmp/studio-bridge`
  como proceso hijo (mismo patrón que generate) y traduce su consola a NDJSON:

```
consola del generador                     evento NDJSON
─────────────────────────────────────    ─────────────────────────────────────
→ flow-x: proponiendo…                    {type:'slot', id, status:'proposing'}
✓ flow-x relleno y aceptado…              {type:'slot', id, status:'filled'}
✗ flow-x: <motivo>                        {type:'slot', id, status:'rejected', reason}
✗ La app ya estaba en rojo…               {type:'done', baseline}
(salida del proceso)                      {type:'done', filled, rejected, pending}
```

  El generador gana UNA línea (`→ <id>: proponiendo…`) antes de llamar al ejecutor: sin
  ella, el puente espera hasta 15 min en silencio y la pantalla parecería colgada.
  Cancelación: cerrar la respuesta mata el grupo, como generate (el relleno a medias no
  deja rojo: cada hueco es transaccional por el gate).

## 2. La obra (frontend)

- `GenerateRunner`: `slots` del done; `fillSlots()` consume el stream nuevo
  (`fillingSlots`, `slotStates: {id, status, reason?}[]`, `fillReport`).
- Desenlace ok con huecos: sección «Pasos de negocio por rellenar» — lista de huecos con
  su estado y botón «Rellenar con IA (puente)» (deshabilitado mientras corre, con la nota
  de que hace falta una sesión respondiendo `tmp/studio-bridge`). Rechazos con su motivo.
- Sin huecos: la sección no existe.

## Decisiones

| Decisión                | Elegida                                  | Razón                                    |
| ----------------------- | ---------------------------------------- | ----------------------------------------- |
| Invocación              | proceso hijo `nx g fill-flow-slots`      | el generador necesita el Tree de nx; mismo patrón que generate |
| Progreso                | traducir la consola                      | patrón describeProgress ya probado         |
| Ejecutor                | solo puente                              | ADR: sin SDK embebido                      |
| Contador de huecos      | escáner de disco en studio-api           | contar no exige el Tree; regex del hueco vacío |
