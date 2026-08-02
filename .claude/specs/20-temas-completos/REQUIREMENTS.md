# 20 — Temas completos

**Estado:** activa · **Depende de:** 18-paleta-y-texto (la corrige y la sustituye en su parte de paleta)

## 1. Problema

Lo que la spec 18 llamó «paleta» no es un tema: es un **tinte**. `applyPalette`
reescribe tres tokens —`--primary`, `--primary-foreground`, `--ring`— y el resto
del juego se queda clavado en el neutro del esqueleto. El resultado visible es
que elegir «Océano» cambia el color de los botones y de los chips de enum, y
nada más: fondos, tarjetas, bordes, sidebar y radios siguen siendo grises.

Un cliente no distingue su app de la de otro por el color de un botón. Lo que
hace falta es un **tema**: el juego completo de tokens, en claro y en oscuro.

El esqueleto ya emite el gancho a medio usar — `<body class="theme-neutral">` y
`:root .theme-neutral { … }` — una clase de tema que nunca tuvo hermanas.

## 2. Un tema se deriva, no se escribe

Escribir a mano ~25 tokens × 2 modos × N temas es insostenible y produce temas
incoherentes o inaccesibles. Pero los valores neutros que ya emitimos
(`0.145 / 0.205 / 0.269 / 0.556 / 0.708 / 0.922 / 0.97 / 0.985`) **ya son una
escala de luminancias** con croma 0 y tono 0.

Así que un tema declara semillas, y una función pura produce los tokens:

```
tema = { escala L fija (la de shadcn, compartida por todos los temas) }
     + { chroma + hue de las superficies }   → background, card, popover,
     |                                          muted, accent, border, input,
     |                                          sidebar y sus foregrounds
     + { primary / ring / destructive literales }   ← decisión de marca
     + { radius }        (fase 2)
     + { fuente }        (fase 3)
                │
                ▼
       deriveTheme(tema) : ThemeTokens      ← TypeScript puro, en @acc/schema
                │
        ┌───────┴────────┐
        ▼                ▼
   styles.css        lienzo del estudio
   (app emitida)     (previsualización)
```

**El seguro contra romper nada:** `neutral` es chroma 0. La derivación con
chroma 0 y hue 0 debe reproducir los valores actuales carácter a carácter. Si el
diff de oro con `neutral` no sale vacío, el diseño está mal, no el diff.

Los tokens de acción van literales por tema: `primary` y `destructive` son
decisiones de marca, no puntos de una escala.

## 3. La emisión deja de ser un regex

Hoy el CSS se copia literal desde el esqueleto y `palette.ts` reescribe tres
líneas con una expresión regular que cuenta apariciones para distinguir el
bloque claro del oscuro. Con 25 tokens eso es frágil hasta lo indefendible.

`styles.css` pasa a ser **plantilla EJS** con los tokens interpolados. Toda la
derivación vive en `generator.ts` (regla del proyecto: plantillas tontas).
`palette.ts` desaparece.

## 4. El escape del cliente: mismo motor, otra semilla

```ts
theme: { id: 'custom', seed: { brand: '#0F62FE', surfaceHue: 250, radius: '0.25rem' } }
```

El cliente aporta su color corporativo y `deriveTheme` produce un tema coherente
completo. **No** es «elige libremente cada token»: eso sería un editor de temas,
y produce basura. Es «entra una marca, sale un tema sano». El catálogo cerrado
sigue siendo el camino principal; esto es la puerta de atrás, no la puerta.

## 5. El lienzo previsualiza los tokens de verdad

`PREVIEW_PALETTES` pasa a `PREVIEW_THEMES` y el lienzo aplica el resultado de la
**misma** `deriveTheme`. Es la única forma de que lo que ves sea lo que se
genera; si el lienzo usara sus propios colores, volveríamos a mentir.

## 6. Nomenclatura y compatibilidad

`theme.palette` pasa a `theme.id`. `palette` se sigue aceptando como alias para
no invalidar las apps ya generadas (`apps/boutique`, `apps/vetcare`).

El catálogo actual se rehace: las seis paletas fueron pensadas como tintes de un
botón; como temas completos hay que reelegir sus superficies, y alguna puede no
sobrevivir.

## 7. Fuera de alcance (YAGNI explícito)

- **Densidad** (altura de fila, padding de tarjeta, escala tipográfica): toca
  las plantillas emitidas y multiplica los golden diffs por cada tema.
- **Editor libre de tokens** en el lienzo: ver §4.
- **Cambio de tema en runtime** por el usuario final: la app se genera con un
  tema y se queda con él. El conmutador claro/oscuro sigue como está.

## 8. User stories (EARS)

- CUANDO el app-schema declara `theme.id`, EL generador DEBE emitir el juego
  completo de tokens de ese tema en `styles.css`, en claro y en oscuro.
- CUANDO no se declara tema, O se declara `neutral`, EL generador DEBE emitir un
  `styles.css` idéntico byte a byte al de hoy.
- CUANDO el usuario elige un tema en el lienzo, EL estudio DEBE dibujar la app
  con los mismos tokens que el generador emitirá.
- CUANDO el app-schema declara `theme.seed`, EL generador DEBE derivar un tema
  completo a partir del color de marca del cliente.

## 9. Gate

Golden diff vacío con `neutral`, en las dos pieles. Y dos apps generadas lado a
lado —una de catálogo, otra con semilla de cliente— visiblemente distintas en
fondos, superficies y bordes, no sólo en botones.
