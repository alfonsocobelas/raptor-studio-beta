# Publicación de los paquetes @acc/\* (GitHub Packages)

Pipeline preparado en `.github/workflows/release.yml` (manual, `workflow_dispatch`).
`nx release` versiona por Conventional Commits, genera changelog por proyecto y publica
los 12 paquetes (`@acc/schema` + los 11 `@acc/infra-*`).

## Pasos que quedan del lado humano (una vez)

1. **Crear el repo en GitHub y añadir el remote** (`git remote add origin ...`).
2. **Regla dura de GitHub Packages**: el scope npm debe coincidir con el owner del repo.
   - Si el owner va a ser la organización `acc` → nada que tocar.
   - Si va a ser otra (p. ej. `avvale-es`), renombrar el scope en los `package.json`
     y en los import paths (`@acc/...` → `@avvale-es/...`). Es un buscar/reemplazar +
     re-verificar el smoke de instalación (npm pack + install en proyecto externo).
3. Añadir `"repository": { "type": "git", "url": "https://github.com/<owner>/<repo>.git" }`
   a cada `package.json` publicable (GitHub Packages lo exige para enlazar paquete↔repo).
4. Lanzar el workflow `release` desde Actions (elige patch/minor/major).

## Qué protege el pipeline

El publish está detrás del mismo gate que un commit local: `lint + test + build`
en verde **y** el diff de oro vacío. Si cualquiera falla, no se publica nada.

## Consumo desde otro proyecto

```
# .npmrc del proyecto consumidor
@acc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```
