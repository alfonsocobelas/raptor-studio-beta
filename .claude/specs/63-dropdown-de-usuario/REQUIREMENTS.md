# Spec: Dropdown de usuario en el pie de sesión

## Contexto

Último rescate visual del IAM de la referencia (nav-user): el pie de sesión emitido muestra el
chip y dos filas planas; la referencia abre un menú desde el chip (avatar + nombre + email →
"Cuenta" / "Cerrar sesión"). Pedido por Alfonso 2026-08-24 tras cerrar la spec 57.

## User stories (EARS)

- WHEN el usuario pulsa el chip (avatar con iniciales + nombre + email) THEN se abre un menú sobre el chip con "Cuenta" (→ /account) y "Cerrar sesión"
- IF se pulsa fuera del menú o Escape THEN el menú se cierra
- WHEN se genera cualquier app con auth THEN el pie es este dropdown (sustituye a las filas planas de la 57)
- El estudio lo refleja en la maqueta y en la vista de sistema

## Criterios

- [ ] session-footer emitido con dropdown propio (sin imports de Spartan — ADR-003; menú con signal + cierre por click fuera, patrón del estudio)
- [ ] Iniciales derivadas del nombre; iconos lucide como la referencia
- [ ] Golden re-baseline acotado a session-footer; typecheck 0
- [ ] Maqueta del estudio con el mismo comportamiento; smoke en verde

## Referencias

- docs/referencia/libs/frontend/src/domains/admin/layout/sidebar/nav-user.ts
- Captura: docs/style/Captura … 23.33.22.png (menú abierto sobre el chip)

## Fuera de scope

- El resto del shell admin de la referencia (colapsables, hlmSidebar)
