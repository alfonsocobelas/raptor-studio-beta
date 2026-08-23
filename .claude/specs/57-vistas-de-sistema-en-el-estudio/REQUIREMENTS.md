# Spec: Vistas de sistema en el estudio (login, usuarios, mi cuenta)

---

## Contexto de negocio

Hoy las pantallas que regala la autenticación — login, recuperación, usuarios, Mi cuenta — no
aparecen en el estudio: el cliente las descubre en la app generada, rompiendo "lo que ves es lo
que se genera". La pestaña Accesos (spec 46/49) cubre la parte conceptual (roles × capacidades);
falta la visual.

Decisiones (conversación 2026-08-23 con Alfonso):

- **Toda app lleva auth** (spec 58: `auth=none` se retira, single-tenant por defecto). Por
  tanto en el estudio NO hay interruptor: las vistas de sistema se muestran **siempre**. La
  pregunta original "¿dónde vive el toggle?" quedó obsoleta con esta decisión.
- Las vistas de sistema son **solo lectura** (contrapartida inversa de la etiqueta "Diseño aún
  no generable": "esto te lo regala la autenticación, no se edita"). Nunca bloques del schema
  (inner-platform, regla 7).
- La previsualización renderiza los **componentes reales del emitido** (decisión de Alfonso:
  "componente real"), no mocks dibujados: un mock sería una segunda fuente de verdad que
  derivaría del generador con el tiempo. El runner ya compila componentes (spec 35).

## User stories (formato EARS)

- **WHEN** el diseñador abre el modo Vistas **THEN** el raíl muestra, además de sus vistas, un grupo "Sistema" con Login, Usuarios y Mi cuenta, visualmente distinguible (no reordenable, no borrable)
- **WHEN** el diseñador selecciona una vista de sistema **THEN** el lienzo renderiza el componente real que emite el generador, en solo lectura (sin drop de bloques, sin panel de edición) y con la nota "La trae la autenticación"
- **WHILE** una vista de sistema está abierta **THEN** el preset visual del diseño (actual/cabina/suite) se aplica igual que en las demás vistas
- **IF** el componente real cambia en el generador **THEN** el estudio lo refleja sin tocar nada (misma fuente: assets del plugin de auth)
- **IF** el diseño es antiguo **THEN** carga igual: las vistas de sistema no viven en el diseño, son una proyección (como Modelo o Flujos)

## Criterios de aceptación

- [ ] Grupo "Sistema" en el raíl de Vistas con las 3 entradas, siempre presente
- [ ] El lienzo renderiza LoginComponent, UsersListComponent y ProfileComponent reales (AuthService/UserService mockeados con datos de muestra), sin edición
- [ ] Cero cambios en `DesignPage`/autosave/historial (proyección, no estado)
- [ ] Los tres presets visuales se aplican a las vistas de sistema
- [ ] Suite front del estudio en verde + smoke actualizado

## Preguntas abiertas para el DESIGN

- Cómo llegan los componentes del emitido al estudio: ¿import directo de los assets del plugin
  (son `.template` literales sin EJS, importables tras un paso de build) o copia sincronizada
  con test de paridad? Se decide en DESIGN mirando cómo el runner resolvió esto en la spec 35.

## Referencias

- Raíl y lienzo: `apps/studio/libs/frontend/src/domains/studio/design/views-sidebar.component.ts`, `canvas-page.component.ts`
- Runner que compila componentes (spec 35): `.claude/specs/35-tests-datatable/`
- Componentes a renderizar: `libs/generators/src/generators/app/plugins/assets-auth/libs/frontend/src/domains/{auth,iam}/`
- Precedente de etiqueta: memoria `etiqueta-diseno-aun-no-generable`

## Fuera de scope (deliberado)

- Editar las vistas de IAM o modelarlas como bloques
- El interruptor de auth (no existe: toda app lleva auth — spec 58)
- Retirar `auth=none` del generador y el default single-tenant (spec 58)
- Shell admin completo (backlog de rescates)

## Dependencias

- **Spec 58 primero**: el wizard deja de preguntar auth y el estudio puede asumir "siempre hay IAM".
