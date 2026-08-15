# Spec: Convergencia flujos↔transiciones

> Acordada en el brainstorming de la spec 43 (2026-08-14/15). Cierra la promesa a medias de
> la spec 39: el flujo pasa de documentación a proceso ejecutable exactamente en los pasos
> donde el determinismo alcanza.

---

## Contexto de negocio

La spec 39 emite la clase de proceso con un método por paso, pero todos los cuerpos son
huecos `@ai` vacíos y **sin endpoints**: una clase inerte que nadie llama (decisión
documentada — publicar una API sobre huecos vacíos sería una API mentirosa). La spec 43
trajo la pieza que faltaba: la máquina de estados de la entidad. La mayoría de pasos reales
de un proceso no son lógica arbitraria — son **transiciones de la entidad ancla** («se
aprueba el presupuesto» es `presupuesto.aprobar()`).

Convergencia: un paso que declara `transition` (la costura ya está en el contrato desde la
43) emite **cuerpo real determinista** — delegar en el caso de uso de la transición — y
AHORA SÍ su endpoint, porque hace algo de verdad. La regla queda limpia: **endpoint solo
donde hay cuerpo real; nunca fachadas sobre huecos vacíos**. Los pasos sin `transition`
siguen como huecos `@ai`, sin endpoint.

Doctrina (memoria «backlog-ideas-estudio» §9): el vocabulario de cajas compilables crece
**verbo a verbo** por regla de los dos. Prohibido el vocabulario genérico
(asignar/condición/bucle): sería un lenguaje de programación visual (regla 7).

## User stories (formato EARS)

### Estudio

- WHEN un paso de flujo alude a una entidad con máquina THEN el panel del paso ofrece
  elegir una de sus transiciones (desplegable; «— ninguna —» la quita)
- WHEN el paso declara `transition` THEN el nodo del canvas lo enseña (el verbo junto al
  texto), y el diseño lo persiste
- WHEN el chat propone un flujo sobre una entidad con máquina THEN sabe declarar
  `transition` en los pasos que ejecutan un verbo de la máquina (prompt + schema de salida)
- IF la transición no existe en la máquina de la entidad THEN la frontera lo rechaza
  (ya cubierto por la 43; aquí solo se conserva)

### Emitido

- WHEN un paso declara `transition` THEN su método en la clase de proceso deja de ser un
  hueco `@ai`: delega en el use case de la transición (`TerminateContractUseCase`), y su
  JSDoc lo dice
- WHEN un paso declara `transition` THEN el controller de procesos expone
  `POST /processes/<flujo>/<paso>/:id` → 204, con los mismos 409/404 que el endpoint de la
  transición (la guarda vive en el dominio, no se duplica)
- IF ningún paso del flujo declara `transition` THEN NO se emite controller de procesos
  (nada de fachadas sobre huecos)
- WHILE un paso no declara `transition` THEN su método sigue siendo hueco `@ai` sin endpoint

## Criterios de aceptación

- [ ] El panel del paso ofrece las transiciones de la máquina de su entidad y lo persiste
- [ ] El chat declara `transition` cuando procede (prompt + schema)
- [ ] La app de oro: el flujo golden gana un paso con `transition` y `/golden-diff` vacío
- [ ] El proceso emitido delega en el use case; el endpoint responde 204/409/404 de verdad
- [ ] Suite completa + `npm run web:build` + comprobación en navegador

## Referencias

- Spec 39 (`.claude/specs/39-flujos-emiten-proceso/DESIGN.md`) — coreografía documentada,
  la clase de proceso NO es un runner; cada paso es un punto de entrada independiente
- Spec 43 — máquina de estados; `FlowNode.transition` ya en contrato y frontera

## Fuera de scope (deliberado)

- **Relleno de huecos `@ai` como fase de la pantalla de obra** (decisión «opción b»):
  se separa — es fontanería del estudio/bridge, no de la emisión; irá como spec propia
  cuando se priorice
- Verbos de vocabulario nuevos (crear relacionada, enviar email…): regla de los dos
- Botones de proceso en las vistas emitidas (el «flujo pulsable», idea 3 del backlog):
  los endpoints de esta spec son su prerequisito, no su entrega
- Decisiones (`decision`) siguen sin emitir código; pasos `start`/`end` igual
