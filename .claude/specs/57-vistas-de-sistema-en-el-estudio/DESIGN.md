# Diseño técnico: vistas de sistema en el estudio

## El descubrimiento que ordena el diseño

El estudio **ya es estructuralmente una app generada**: lleva dentro el kernel frontend emitido
(`apps/studio/libs/frontend/src/shared/components/` con DataTable, button/input/form-field/
select/dialog…), usa el mismo alias `@app/shared/domain` y su `libs/shared/domain` ya contiene
los DTOs de auth. Renderizar los componentes reales no exige traer un mundo: exige traer TRES
ficheros y mockear dos servicios.

## Mapa

```
 plugin de auth (fuente de verdad)          estudio
 assets-auth/…/domains/                     domains/studio/design/system-preview/
   auth/login.component.ts.template   ──►     login.component.ts        (sync + paridad)
   iam/users-list.component.ts.template ─►    users-list.component.ts
   iam/profile.component.ts.template  ──►     profile.component.ts
   iam/iam-labels.ts.template         ──►     iam-labels.ts
                                              preview-auth.service.ts   (mock: admin de muestra)
                                              preview-user.service.ts   (mock: 3 usuarios seed)
                                              system-views.ts           (registro de las 3 vistas)
```

- **Sync + test de paridad, no import directo**: los assets son `.template` (no compilan en el
  repo a propósito) y sus imports relativos apuntan a la app emitida. Un script
  (`apps/studio/tools/emit-system-preview.ts`, mismo patrón que `tools/emit-slots.ts`) copia y
  reescribe SOLO rutas de import (`../../core/services/*` → mocks del preview; profundidades de
  `../../shared/…`); un spec de paridad falla si el asset cambió y el preview no se regeneró —
  idéntico al contrato de `tools/slots.json`. Cero divergencia posible sin test rojo.
- **Los mocks son providers, no forks**: los componentes se renderizan tal cual con
  `{ provide: AuthService, useClass: PreviewAuthService }` a nivel de la vista del lienzo.
  `PreviewAuthService` expone el admin de muestra y métodos inertes (login/changePassword
  resuelven sin red); `PreviewUserService` devuelve los 3 usuarios del seed (admin/user/viewer).
  Espera un matiz: el import del componente nombra `AuthService` del emitido — el sync lo
  reescribe al servicio del preview directamente, así el lienzo no necesita DI trickery.

## Raíl y lienzo

- `views-sidebar.component.ts`: grupo nuevo "Sistema" bajo las vistas del diseño, con las 3
  entradas de `SYSTEM_VIEWS` (`system-views.ts`: id, título, componente). Sin drag, sin borrar,
  sin renombrar; testids `system-view-<id>`.
- Estado: la vista activa del lienzo hoy es un índice de página del diseño; se amplía con una
  selección `{ kind: 'design', index } | { kind: 'system', id }` en el servicio de UI del modo
  Vistas (sesión, no diseño — como el rol activo de Accesos). Cero cambios en `DesignPage`.
- `studio-canvas`: cuando la selección es de sistema, en lugar de `canvas-page` monta
  `system-view.component.ts`: banda superior "La trae la autenticación — no se edita" +
  `<ng-container *ngComponentOutlet>` del componente real, con los providers del preview y
  `pointer-events: none` sobre el contenido (se mira, no se usa). El preset visual ya aplica:
  los componentes usan los tokens del tema del estudio.
- Login es una pantalla completa (min-h-screen, fuera del shell): se renderiza dentro de un
  marco a escala del lienzo, igual que el resto — el objetivo es enseñar, no navegar.

## Decisiones

| Decisión | Elegida | Razón |
| --- | --- | --- |
| Componentes reales vs mock dibujado | Reales (Alfonso 2026-08-23) | Un dibujo es una segunda fuente de verdad que deriva |
| Import directo vs sync+paridad | Sync + test de paridad | Los `.template` no compilan en el repo; el patrón slots.json ya existe y funciona |
| Dónde viven los mocks | `system-preview/`, junto a las copias | Es la única pieza escrita a mano; el sync no la toca |
| Estado de la vista activa | Sesión del modo Vistas | Las vistas de sistema no son diseño: proyección, como Modelo/Flujos |
| Interacción | Solo lectura con `pointer-events: none` | Enseñar sin fingir que el login del lienzo inicia sesión |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El sync reescribe imports con regex frágil | Reescrituras declaradas por tabla (de → a) + el spec de paridad compila el resultado |
| users-list arrastra deps no presentes en el estudio | Ya están (DataTable, dialogs, notification); lo confirma el primer sync compilando |
| El preview deriva del asset | Test de paridad estilo slots.json: asset cambiado sin `npm run system-preview` = suite roja |

## Tareas

Ver TASKS.md: (1) sync+paridad+mocks, (2) raíl+lienzo, (3) verificación visual con Alfonso.
