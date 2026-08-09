# Diseño técnico: Presets de diseño

> Un preset = carpeta de override copiada DESPUES del esqueleto (su app.component gana) +
> bloque CSS inyectado al final del styles.css del tema. Toda la logica vive en
> `design/presets.ts` (regla 8: plantillas tontas).
>
> El CSS del preset va SIN @layer: dentro de una capa pierde contra las utilidades de Tailwind.
