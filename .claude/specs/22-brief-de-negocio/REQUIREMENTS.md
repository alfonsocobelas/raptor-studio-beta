# Spec: Brief de negocio en el esquema

## Contexto de negocio

El chat del estudio conoce el negocio del cliente **solo mientras dura la
conversación**: `messages` vive en un signal de la pestaña y el diseño que
viaja al backend (`DesignPayload`) lleva entidades y vistas, pero ni una
palabra de *para qué* existen. Recargar el navegador borra todo lo que el
usuario contó («las citas duran media hora», «al historial lo llamamos
ficha») y la IA vuelve a diseñar a ciegas o repregunta lo ya contestado.

El segundo agujero es la frontera de generación: el `.app.json` cruza al
generador sin contexto, así que la app generada nace sin memoria de su
negocio — y la spec que rellene los huecos `@ai` (fase 4 de la spec 15,
aparcada) no tendrá de dónde leer.

Esta spec añade un **brief de negocio** al contrato: la IA lo destila de la
conversación, el usuario lo ve y lo corrige, viaja con el diseño (persistencia
de la spec 21 y export incluidos), cruza al generador y aterriza como
`CLAUDE.md` en la app generada. Nadie lo consume para generar código todavía.

Decisiones tomadas en el brainstorming (2026-08-03):

- Granularidad **app + entidad** (no por campo: inner-platform, regla 7).
- Lo escribe **la IA y lo corrige el usuario** (contexto que no puedes ver ni
  editar es contexto en el que no puedes confiar).
- Alcance **hasta la app generada**, aterrizando como `CLAUDE.md` en su raíz.
- El campo se llama **`brief`**, no `context`: `ResourceDefinition.context` ya
  significa bounded context y `FieldRelation.context` lo mismo.

## Contrato

```ts
// @acc/schema — app-types.ts
export interface BusinessBrief {
  business: string                              // prosa: qué hace este negocio
  rules?: string[]                              // reglas que la IA debe respetar
  glossary?: { term: string; means: string }[]  // jerga del cliente
}
export interface AppDefinition { …; brief?: BusinessBrief }

// @acc/schema — resource-types.ts
export interface ResourceDefinition { …; brief?: string }
```

`brief` de entidad es un `string` pelado: en la entidad no hay gloso ni reglas
transversales, hay una frase. Opcional en ambos niveles — ningún schema
existente se rompe y el precedente de metadatos-que-no-generan-código ya
existe (`samples`, `subtitle`).

**Topes** (el brief se reenvía en cada turno del chat; sin tope, degrada el
prompt con el uso): `business` ≤ 1200 chars · `rules` ≤ 20 × 240 ·
`glossary` ≤ 30 entradas con `term` ≤ 40 · brief de entidad ≤ 500.

## El viaje

```
 chat ──► brief ──► DesignStore ──► export/persistencia ──► generador ──► CLAUDE.md
  ▲          │           │              (.app.json,                        en la app
  └──────────┘        editable          spec 21 gratis)                    generada
 lo relee cada       en la UI
 turno como
  contexto
```

## User stories (formato EARS)

- WHEN el usuario cuenta algo del negocio en el chat THEN la propuesta de la IA
  incluye el brief actualizado (app y/o entidad) junto al diseño, y pasa el
  mismo gate que el resto.
- WHEN el usuario recarga el estudio THEN el brief se restaura con el diseño
  (persistencia de la spec 21) y el siguiente turno del chat lo recibe.
- WHEN el usuario edita el brief a mano (panel de contexto o inspector de la
  entidad) THEN el cambio queda en el diseño y viaja al siguiente turno.
- WHEN se exporta el `.app.json` THEN lleva `brief` de app y `brief` en cada
  resource-schema expandido que lo tenga.
- WHEN se genera una app cuyo diseño tiene brief THEN la app contiene un
  `CLAUDE.md` en su raíz con negocio, reglas, glosario y una línea por entidad.
- IF el diseño no tiene brief THEN el generador NO emite `CLAUDE.md` y el
  golden diff de las fixtures actuales queda vacío.
- IF la IA devuelve un brief que excede los topes THEN el gate lo rechaza y el
  lienzo conserva el diseño anterior (mismo comportamiento que hoy).
- WHILE el usuario conversa por turnos THEN el prompt exige conservar las
  reglas ya presentes: destilar lo dicho, no inventar, no borrar.
- WHEN el modo demo sin IA está activo (fake adapter) THEN también produce un
  brief de ejemplo, para que el panel no parezca roto.

## Criterios de aceptación

- [ ] `defineApp`/`defineResource` aceptan brief válido, rechazan `business`
      vacío y cortan por tope (tests en `@acc/schema`).
- [ ] Contar el negocio en el chat y recargar: el panel de contexto muestra lo
      destilado y el siguiente turno no repregunta (verificado con bridge).
- [ ] El brief es editable en el panel del chat (app) y en el inspector
      (entidad), y la edición sobrevive al siguiente turno de chat.
- [ ] `<app>.app.json` exportado contiene el brief en ambos niveles.
- [ ] App generada desde un diseño con brief → `CLAUDE.md` presente y con el
      contenido del brief; sin brief → sin fichero.
- [ ] `/golden-diff` vacío en las tareas que no tocan plantillas; la fixture
      nueva con brief se baseline-a en su propio commit.
- [ ] Suite verde en `@acc/schema`, generadores y estudio (back y front).

## Referencias

- `.claude/specs/15-modelo-de-dominio-visual/REQUIREMENTS.md` fase 4 (origen
  de la idea; el diagrama queda aparcado).
- `.claude/specs/10-studio-chat/` (gate y adapters del chat).
- `.claude/specs/21-historial-de-disenos/` (persistencia que el brief hereda).
- `apps/studio/libs/backend/src/contexts/studio/chat/` (adapters y gate).
- `apps/studio/libs/backend/src/contexts/studio/generate/build-app-file.ts`
  (la frontera diseño → generador).

## Reglas de negocio aplicables

- Regla 7 (generar, no interpretar): el brief NO altera ni un byte del código
  generado — es documentación que viaja con él. Si mañana una regla del brief
  debe generar un validador, eso es otro contrato y otro debate.
- Regla 8 (plantillas tontas): el markdown del `CLAUDE.md` se construye en
  `generator.ts`; la plantilla solo interpola.
- Gate de oro: tareas sin plantillas → diff vacío; la fixture con brief va en
  commit propio de re-baseline (skill `golden-diff`).

## Riesgos asumidos

| Riesgo | Decisión |
| --- | --- |
| La IA machaca una regla editada a mano (el gate no puede detectarlo) | Mitigar por prompt («conserva») + historial spec 21. Un `pinned` por regla queda FUERA salvo que duela en uso real. |
| Regla de app huérfana tras borrar una entidad | No se detecta: es texto que el usuario ve y borra. Adivinar sería peor. |
| Regenerar sobre una app existente sobrescribe un `CLAUDE.md` editado | Comportamiento heredado del esqueleto (observación 14 del ROADMAP); no se arregla aquí. |

## Fuera de scope (deliberado)

- Los huecos `@ai` del código emitido: el brief llega a la app y ahí se queda.
  Consumirlo es la spec siguiente.
- El diagrama de entidades (fase 4 de la spec 15): aparcado.
- Brief por campo (inner-platform).
- `pinned` en reglas editadas a mano (ver riesgos).
- Que el brief afecte al código generado.
