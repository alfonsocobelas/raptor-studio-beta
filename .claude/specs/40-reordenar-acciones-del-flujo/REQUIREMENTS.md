# Spec: Reordenar las acciones de un flujo

## Contexto de negocio

La spec 28 dejó el lienzo de flujos editable y la 39 hizo que cada flujo emita una clase de
proceso con un método por acción. Falta el gesto más básico de todos: **cambiar el orden en
que se hacen las acciones**. Hoy, para meter una acción entre dos que ya existen, hay que
borrar la flecha, crear el nodo y recoser la cadena a mano: el estudio deja escribir el
proceso pero no deja corregirlo.

Y hay una segunda mitad, menos visible y más grave: **el orden que se ve en el lienzo no es
el que sale al generar**. `bfsOrder` (`brief-doc.ts`) ordena por profundidad BFS —primer
descubrimiento—, que no es un orden topológico. Con dos ramas de distinta longitud, un nodo
se numera antes que sus predecesores:

```
inicio → stock<10 ─sí→ marcar → enviar → fin
                  └─no─────────────────→ fin

bfsOrder actual:  1. inicio  2. stock  3. fin  4. marcar  5. enviar
                                       ^^^^^^ el fin, antes de las acciones que llevan a él
```

Además, las acciones de dos tarjetas hermanas se **entrelazan** por capas, así que los
métodos de la clase de proceso no salen en el orden en que se leen las tarjetas. Reordenar
sin arreglar esto sería mentirle al usuario: mueve la fila y el código emitido no cambia
donde debería. De ahí que la spec tenga dos mitades: **el gesto** y **la garantía**.

## User stories (formato EARS)

### Bloque A — el gesto (estudio)

- WHEN el usuario pasa el puntero por una fila de acción THEN aparece un asa de arrastre a
  la izquierda de su número.
- WHEN el usuario arrastra el asa de una fila THEN se dibuja una guía entre filas que marca
  dónde va a caer.
- WHEN el usuario suelta la fila en otra posición de su tarjeta THEN la cadena de la tarjeta
  se recablea para que las acciones se recorran en ese nuevo orden, y los números de las
  filas se renumeran de arriba abajo.
- IF la fila se suelta en la posición que ya ocupaba THEN el flujo no cambia (no se toca
  ninguna arista ni se marca el diseño como sucio).
- IF la acción arrastrada era la cabeza de la tarjeta THEN la arista que entraba en ella
  —con su etiqueta de rama, si venía de una condición— pasa a entrar en la nueva cabeza.
- IF la acción arrastrada era la cola de la tarjeta THEN la arista que salía hacia el
  siguiente bloque pasa a salir de la nueva cola.
- WHILE se arrastra una fila THEN la tarjeta no se mueve por el lienzo (el arrastre de la
  tarjeta sigue viviendo en su cabecera) y ni el clic de seleccionar ni el doble clic de
  editar se disparan al soltar.
- WHEN el orden cambia THEN el diseño se guarda como cualquier otra edición (autosave a
  `.studio/designs`), sin cambio en el contrato `BusinessFlow`.

### Bloque B — la garantía (generador)

- WHEN se ordenan los nodos de un flujo THEN ningún nodo aparece antes que un nodo del que
  es alcanzable: el orden es topológico (nivel = camino más largo desde el inicio), con
  desempate alfabético por id dentro del mismo nivel.
- WHEN un flujo tiene dos ramas de distinta longitud THEN el nodo donde se juntan se numera
  después de todas las acciones de ambas ramas.
- WHEN una tarjeta tiene varias acciones en cadena THEN sus métodos se emiten seguidos y en
  el orden de la cadena, sin intercalar acciones de otra rama.
- WHEN se reordenan las acciones de un flujo y se regenera THEN los métodos de la clase de
  proceso salen en el nuevo orden, y el mapa numerado del JSDoc y del `CLAUDE.md` también.
- IF un nodo no es alcanzable desde el inicio THEN sigue yendo al final, como hoy.

## Criterios de aceptación

- [ ] Se puede arrastrar una fila de acción dentro de su tarjeta y el nuevo orden se ve al
      soltar (números renumerados).
- [ ] Mover la primera o la última fila no rompe la entrada, la salida ni la rama.
- [ ] El orden sobrevive al guardado y a la recarga del estudio.
- [ ] Un flujo con ramas de distinta longitud numera el nodo de reunión al final.
- [ ] Regenerar una app tras reordenar cambia el orden de los métodos emitidos.
- [ ] `/golden-diff` en verde (con re-baseline en commit propio si el orden emitido cambia).

## Referencias

- `apps/studio/libs/shared/domain/src/studio/flow-groups.ts` — las tarjetas se DEDUCEN del
  grafo; el grupo no existe en el contrato.
- `libs/generators/src/generators/app/brief-doc.ts` — `bfsOrder`, numeración y mapa.
- `libs/generators/src/generators/app/flow-process.ts` — derivación de métodos (spec 39).
- Spec 39 (`.claude/specs/39-flujos-emiten-proceso/`) — de quién depende esta.

## Reglas de negocio aplicables

- **El contrato no cambia** (spec 28/39): `BusinessFlow` sigue siendo nodos + aristas. El
  orden es la cadena de aristas, no un campo `order`. Añadir un índice sería duplicar la
  verdad y dejar dos fuentes que se pueden contradecir.
- **Regla 7 (generar, no interpretar)**: el flujo no se ejecuta; el orden es documentación y
  disposición de métodos, no una máquina de estados.
- El layout arrastrado sigue siendo cosmético y de sesión; el ORDEN no: es del diseño.

## Fuera de scope (deliberado)

- Arrastrar una fila **de una tarjeta a otra** (cambiar de rama arrastrando). Se sigue
  haciendo recableando flechas. Decisión de Alfonso, 2026-08-13: recablear entrada, salida y
  rama de golpe multiplica la superficie de fallo (huérfanos, ciclos).
- Reordenar tarjetas o bloques entre sí; sigue mandando el layout automático.
- Deshacer/rehacer del reordenado (el estudio no tiene historial de gestos).
