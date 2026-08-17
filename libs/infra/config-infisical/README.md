# infra-config-infisical

Resolves the `vault.*` placeholders of an app's config against [Infisical](https://infisical.com),
the secrets manager of the Raptor Cloud provider (`--infra=raptor`). Sibling of
`infra-config-azure` (Key Vault) and `infra-config-aws` (Secrets Manager).

```ts
const config = await resolveInfisicalConfig(rawConfig)
// vault.typeorm.password  →  secret TYPEORM_PASSWORD
```

No SDK: two REST calls over the native `fetch` of Node 24. The access token stays in
memory for the life of the process, never on disk.

## Environment

| Variable                   | Meaning                                         | Default                     |
| -------------------------- | ----------------------------------------------- | --------------------------- |
| `INFISICAL_CLIENT_ID`      | Machine identity (universal auth)               | —                           |
| `INFISICAL_CLIENT_SECRET`  | Machine identity secret                         | —                           |
| `INFISICAL_PROJECT_ID`     | Project (workspace) holding the secrets         | —                           |
| `INFISICAL_ENV`            | Environment slug inside the project             | `prod`                      |
| `INFISICAL_SITE_URL`       | API base URL — point it at your own self-hosted | `https://app.infisical.com` |

A config without `vault.*` placeholders never calls Infisical, so local and test runs need
none of the above.

## Building

Run `nx build infra-config-infisical` to build the library.

## Running unit tests

Run `nx test infra-config-infisical` to execute the unit tests via [Jest](https://jestjs.io).
