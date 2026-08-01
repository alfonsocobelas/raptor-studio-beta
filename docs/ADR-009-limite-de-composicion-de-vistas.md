# ADR-009 — El límite de composición de vistas

**Fecha:** 2026-08-01
**Estado:** Aceptado
**Contexto:** Alfonso, tras ver un diseño de Claude Design: «solo con tablas no haces una web;
hay que encontrar el límite de hasta dónde podemos llegar con el layout libre sin romper nuestra
idea, pero enriqueciendo las piezas».

---

## Decisión en una frase

El lienzo compone **bloques en secuencia**, no elementos en coordenadas: el usuario elige
**qué bloques**, **en qué orden** y **con qué ancho** (completo o mitad). Nada más.

```
   ✅ DENTRO DEL LÍMITE                       ❌ FUERA DEL LÍMITE
   página = [ bloqueA(full),                  posicionar en x/y/w/h
              bloqueB(half), bloqueC(half),   anidar contenedores a voluntad
              bloqueD(full) ]                 CSS/HTML arbitrario
   → una columna de filas; una fila = 1 o 2   → motor de layout
     bloques                                  → el código emitido deja de ser canónico
```

## El criterio que decide los casos dudosos

> **¿Un desarrollador escribiría ese fichero a mano tal cual, y al leerlo no sabría que lo generó
> una máquina?** Si la respuesta es sí, está dentro del límite.

Ese es el mismo criterio del diff de oro (el código emitido es indistinguible del escrito a
mano), aplicado a la composición. Un `@if` sobre un bloque opcional lo pasa; una rejilla de 12
columnas con offsets calculados, no.

## Qué se enriquece entonces: las PIEZAS, no el lienzo

La variedad no viene de dar libertad de colocación, sino de tener **más bloques buenos**:

| Bloque | Qué pinta | De dónde sale |
|---|---|---|
| `table` | listado + búsqueda/filtros/orden/export + CRUD | ✅ emitido |
| `kpis` | fila de tarjetas de totales | ✅ emitido |
| `fields` | tarjeta de datos de un registro (secciones + badges) | canon en la referencia (fichas) |
| `attachments` | dropzone + lista de ficheros | spec 14 |
| `chart` | barras/donut por categoría o mes | por escribir (agregación acotada) |
| `cards` | galería de tarjetas (título, subtítulo, chips, métrica, acción) | por escribir |
| `timeline` | histórico ordenado por fecha | por escribir |
| `richText` | encabezado/texto de apoyo de la página | trivial |

Una vista es una **composición de bloques**; los «arquetipos» (lista, ficha, panel, galería) son
**presets**: combinaciones de partida que el usuario puede retocar dentro del límite. Así se
consigue que no todas las vistas sean iguales sin abrir la puerta al layout libre.

## Reglas operativas

1. **Orden y ancho, nada más.** El ancho solo admite `full` o `half`; dos `half` seguidos forman
   una fila de dos columnas. No hay tercera opción (evita reinventar un grid).
2. **Los bloques no se anidan.** Un bloque no contiene otros bloques.
3. **Cada bloque es una plantilla EJS propia** con su fixture de oro. El catálogo crece
   linealmente: N bloques = N plantillas, no N×M combinaciones.
4. **Todo bloque deriva del schema.** Si un bloque necesita un dato que el schema no declara, se
   añade al schema *porque el generador lo necesita*, nunca «para que se pueda dibujar» (regla 7).
5. **Sin bloque no hay herramienta.** El estudio solo ofrece en su barra bloques que el generador
   emite de verdad.

## Consecuencias

- **A favor:** vistas visualmente distintas entre sí; el código emitido sigue siendo canónico y
  editable a mano; el gate de oro sigue siendo posible (una fixture por bloque).
- **En contra:** no se podrán reproducir maquetaciones arbitrarias (un dashboard con un mosaico
  irregular, por ejemplo). Se asume: eso se edita a mano sobre el código generado — que es
  exactamente el trato del acelerador (regla 7: generar, no interpretar).
- **Reversible:** si algún día un cliente real exige maquetación libre, se revisa este ADR; la
  arquitectura de bloques es un subconjunto de cualquier motor futuro, no un callejón sin salida.
