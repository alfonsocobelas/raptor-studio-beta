# Verificación — TASK-10 (2026-08-25)

## Cómo se hizo

Sobre el estudio corriendo de verdad (`npm run web`, 4316): vista nueva con tabla, KPIs,
calendario, kanban y galería; se recorren las tres pieles desde el panel «Piel» y se mide con
`getComputedStyle` lo que se ve. Se mide además un botón del CHROME del estudio, que es lo que
no debe teñirse. Cero errores de consola.

⚠️ El autosave escribe en `.studio/designs`: se respalda antes y se retira el diseño de prueba
después ([[probar-el-estudio-ensucia-el-diseno]]).

## Medida objetiva en el LIENZO del estudio

| esquinas de…            | actual | cabina | suite |
| ----------------------- | ------ | ------ | ----- |
| tarjeta KPI             | 14px   | 0px    | 2px   |
| panel (calendario/tabla)| 8px    | 0px    | 2px   |
| pastilla (evento/badge) | 6px    | 0px    | 2px   |
| envoltura `rounded-lg`  | 10px   | 0px    | 2px   |
| celda de día            | 0px    | 0px    | 0px   |
| **chrome del ESTUDIO**  | 7px    | 7px    | 7px   |

La última fila es la que importa tanto como las otras: la hoja inyectada (7.4 KB en cabina,
3.8 KB en suite, 0 en actual) **no se sale del lienzo**.

Capturas: `docs/style/smoke-68-lienzo-{actual,cabina,suite}.png`.

## Lo que estaba pasando, con nombre y apellidos

El estudio tenía DOS copias a mano de la piel:

1. `presetChrome()` — cinco tokens de color del shell, copiados de `design/presets.ts`.
2. ~141 líneas de `.preview-scope[data-preset='…']` en el `styles.css` del estudio, que
   aplanaban las esquinas **listando clases a mano**:

```
.preview-scope[data-preset='cabina'] .rounded-full,
.preview-scope[data-preset='cabina'] .rounded-md,
.preview-scope[data-preset='cabina'] .rounded-lg,
.preview-scope[data-preset='cabina'] .rounded {      ← falta rounded-xl
  border-radius: 0;
}
```

`rounded-xl` es la clase de la tarjeta KPI de spartan. No estaba en la lista, así que bajo
cabina y suite el lienzo entero se cuadraba **menos los KPIs**. De ahí la conclusión de Alfonso
—correcta en lo que veía— de que la piel no se aplicaba.

Las dos copias están borradas. La verdad vive en `libs/schema/design-presets.ts`, junto a los
temas, y el lienzo inyecta su CSS acotado con `scopePresetCss()`.

## Veredicto

Elegir la piel en el estudio ahora enseña la piel. Queda una diferencia declarada y aceptada: el
SHELL del mock (barra de cabina, banda de suite) sigue siendo la aproximación que dibuja el
lienzo, mientras los bloques llevan el CSS real. Si canta, la siguiente vuelta es servir también
el shell.

Deuda que esta spec paga y no salda: los bloques siguen implementados dos veces (lienzo y
plantillas). Anotada en `.claude/specs/ROADMAP.md` idea 32, con la señal concreta para atacarla.
