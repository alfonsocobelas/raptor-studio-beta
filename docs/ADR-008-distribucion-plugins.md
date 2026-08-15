# ADR-008: Distribución del catálogo como paquetes instalables

**Estado:** Aceptado (2026-07-30, decisión de Alfonso: "la idea es que todo esto sean como plugins")
**Relacionado:** ADR-004 (catálogo de adapters), revisión crítica B1

---

## Contexto

El catálogo de infra (puertos + adapters) vivía como libs internas del monorepo, consumidas por
referencia vía aliases TypeScript. La revisión crítica marcó la distribución del kernel (B1) como
"la decisión abierta más cara". Alfonso decide: los componentes del acelerador deben poder
**instalarse como plugins** en proyectos de cliente independientes.

## Decisión

1. **Paquetes npm bajo el scope `@raptor`**, uno por lib del catálogo. Nombres npm válidos
   (`@raptor/infra-ports`, no `@raptor/infra/ports`): el rename se ejecutó en este ADR.
2. **El monorepo sigue siendo la única fuente de verdad** (fix-once-propagate del ADR-004):
   los paquetes se construyen con `nx build` (tsc) que emite `dist/libs/*` con `package.json`
   completo — Nx inyecta automáticamente las dependencias entre paquetes del workspace con su versión.
3. **Consumo dual**: dentro del monorepo por alias (paths); fuera, por instalación
   (`npm install @raptor/infra-storage-azure`).
4. **Registro**: GitHub Packages (privado, gratuito con el repo) como destino recomendado;
   Verdaccio para pruebas locales. El pipeline de publicación (nx release + CI) es tarea operativa
   pendiente; la instalabilidad ya está **verificada por smoke test** (npm pack de 9 paquetes +
   install en proyecto externo + ejecución: puertos, instanceof entre paquetes, sanitizer,
   métricas y defineResource funcionando).

## Consecuencias

- Un proyecto de cliente puede montar el hexágono con `npm install @raptor/infra-ports
@raptor/infra-storage-azure …` y cablear su composition root, sin clonar el monorepo.
- Versionado: fixed (una versión para todo el catálogo) hasta que haya motivo real para
  independiente; pin por cliente vs última = política del ADR-004 §8, sigue vigente.
- El generador (`@raptor/generators`) y el schema (`@raptor/schema`) siguen el mismo camino: el
  generador podrá ejecutarse en el workspace del cliente como plugin Nx instalado.

## Verificación (reproducible)

```bash
npx nx run-many -t build
cd /tmp/demo && npm init -y
npm pack <repo>/dist/libs/infra/ports    # …y el resto
npm install ./acc-infra-storage-azure-0.0.1.tgz   # + overrides file: para los transitivo-locales
# hasta que exista el registro; con registro publicado, el install es directo
```
