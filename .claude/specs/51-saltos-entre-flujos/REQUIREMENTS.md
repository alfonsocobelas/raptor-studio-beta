# Spec: Saltos entre flujos

> Acordada en el brainstorming del 2026-08-17, a raíz de rehacer la Vista de texto de la
> pestaña Flujos (commit `d71df8e0`). El diseño `aguas.json` ya encadena ocho flujos a mano
> con la convención textual `→ Flujo: X` en diez nodos de fin: esta spec convierte esa
> convención en contrato.

---

## Contexto de negocio

Un proceso de negocio real no cabe en un diagrama. El diseño de aguas parte el trámite de
prórrogas en ocho flujos que se llaman entre sí: el job diario arranca «Responsabilidad
Solicitud de PRÓRROGA», que reparte a «Fase I - Tramitaciones» o «Fase II - Operaciones», y
ambas devuelven casos a la encrucijada cuando la vía no sale adelante. Hoy ese encadenado se
escribe **dentro del texto del nodo** (`→ Flujo: Responsabilidad Solicitud de PRÓRROGA`),
que es un comentario, no un enlace: nadie valida que el flujo destino exista, renombrarlo
deja la referencia colgada, el estudio no permite navegar hasta él, y el markdown que
aterriza en la app generada tampoco lo enlaza.

La pieza que falta es mínima porque el contrato ya está a un campo de distancia: un nodo de
**fin** que declara **en qué flujo continúa el proceso**. Sin retorno, sin pila, sin
ejecución — el salto es una referencia entre mapas, igual que `entity` es una referencia al
modelo. Los flujos siguen sin generar código (regla 7): esto es contexto, y el gate lo
verifica.

Decisiones cerradas en el brainstorming (2026-08-17):

- El salto vive en un nodo **`end`**, con un campo nuevo, **no** en un `kind` nuevo. Un
  salto **es** un fin de este flujo; un `kind` `jump` duplicaría `end` sin ganar nada y
  rompería los dos `Record<FlowNodeKind, string>` exhaustivos del estudio.
- **Sin subflujo con retorno**: exigiría semántica de pila y un punto de retorno en el
  grafo, y ninguno de los diez saltos de aguas lo necesita — todos son terminales.
- La identidad de un flujo **sigue siendo su `name`** (no se introduce id estable). A cambio,
  renombrar o borrar un flujo **recose** las referencias que lo apuntan, igual que cambiar
  de entidad ya tira la `transition` del paso.
- Los ciclos entre flujos **se permiten** (aguas ya los tiene: Fase I vuelve a
  Responsabilidad). Ni la prosa ni el markdown recorren los saltos de forma transitiva: cada
  flujo se cuenta solo. La navegación del estudio sí los sigue.

## User stories (formato EARS)

### Estudio

- WHEN el diseñador elige un bloque de fin THEN el inspector ofrece un desplegable
  «Continúa en» con los demás flujos del diseño («— ninguno —» lo quita)
- WHEN un fin declara continuación THEN el lienzo lo enseña (el nombre del flujo destino
  junto al texto), y el diseño lo persiste
- WHEN el diseñador pulsa ese fin en el lienzo THEN el estudio navega al flujo destino
- IF el flujo destino se renombra THEN los fines que lo apuntan siguen apuntándolo
- IF el flujo destino se borra THEN los fines que lo apuntaban quedan sin continuación (no
  con una referencia rota)
- WHEN el chat propone flujos encadenados THEN sabe declarar la continuación (prompt +
  schema de salida)

### Contrato y frontera

- IF un nodo que no es `end` declara continuación THEN la frontera lo rechaza
- IF la continuación nombra un flujo que no existe en el diseño THEN la frontera lo rechaza
- WHILE un fin declara continuación THEN sigue sin aristas de salida (la regla de `end` no
  se relaja: el salto no es una arista)

### Lectura y emitido

- WHEN un fin declara continuación THEN la Vista de texto lo lee como «y continúa en el
  flujo «X»» en vez de nombrar el texto crudo del nodo
- WHEN un fin declara continuación THEN el mapa numerado del `CLAUDE.md` emitido lo marca
  como salto al flujo destino
- IF un flujo tiene saltos THEN NO cambia el código emitido: ningún método, ningún endpoint
  nuevo (los fines nunca derivaron método)

## Criterios de aceptación

- [ ] El contrato admite la continuación solo en fines y la frontera rechaza las dos formas
      de romperla (nodo que no es fin; flujo destino inexistente)
- [ ] El inspector la ofrece y la persiste; renombrar y borrar el flujo destino recosen
- [ ] El lienzo la enseña y el clic navega al flujo destino
- [ ] La Vista de texto la lee, y el `CLAUDE.md` emitido la marca
- [ ] El chat sabe declararla (prompt + schema), y `validate-proposal` la valida heredando
      el gate estructural
- [ ] La app de oro gana un salto y `/golden-diff` queda vacío tras el re-baseline
- [ ] `aguas.json` migrado a mano: los diez `→ Flujo: X` pasan a ser saltos de verdad
- [ ] Suite completa + `npm run web:build` + comprobación en navegador

## Referencias (proyecto de referencia y diseño)

- Contrato de flujos: `libs/schema/src/lib/app-types.ts` §`FlowNode`/`BusinessFlow`/`FLOW_LIMITS`
- Gate estructural: `libs/schema/src/lib/validate-flows.ts`
- Specs hermanas: 28 (flujos de negocio), 39 (clase de proceso emitida), 43 (máquina de
  estados), 44 (convergencia flujos↔transiciones — el precedente exacto de «campo nuevo en
  `FlowNode` que atraviesa estudio, frontera, chat y emitido»)
- Documento maestro: `docs/ACELERADOR-arquitectura-consolidada.md`
- Diseño real que lo motiva: `.studio/designs/aguas.json` (ocho flujos, diez saltos escritos
  a mano)

## Reglas de negocio aplicables

- **Regla 7 (generar, no interpretar)**: el salto es una anotación del mapa. NO emite
  máquina de ejecución, ni orquestador, ni endpoint. Mismo precedente que `status` en la
  spec 39.
- **Regla 8 (plantillas tontas)**: todo el cálculo del salto vive en `generator.ts` /
  `brief-doc.ts`; las plantillas EJS no se tocan.
- **Regla de los dos**: no se abstrae ninguna noción general de «referencia entre flujos».
  Hay un caso (el fin que continúa) y se resuelve con un campo.
- La frontera valida lo que puede ver: a diferencia de `entity` —que `defineApp` no puede
  comprobar porque no conoce los recursos—, `validateFlows` recibe **todos** los flujos, así
  que un salto roto es error del gate determinista, no una sorpresa posterior.

## Fuera de scope (deliberado)

- **Subflujo con retorno** (llamar a otro flujo y volver al punto de llamada).
- **Id estable para `BusinessFlow`**: la identidad sigue siendo el nombre; se recose al
  renombrar. El día que haga falta por otra razón, será su propia spec.
- **Recorrido transitivo**: ni la prosa ni el markdown siguen los saltos para contar el
  proceso completo de punta a punta. Cada flujo se lee solo.
- **Detección de ciclos entre flujos**: se permiten y no se avisa de ellos.
- **Navegación desde el markdown emitido** (anclas entre secciones del `CLAUDE.md`).
- **Saltos desde un paso o desde una rama de condición**: solo desde un fin.

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `DESIGN.md` hasta aprobación
> explícita de Alfonso.
