#!/usr/bin/env bash
# Gate de oro: regenera cada modelo registrado y compara CADA fichero generado
# contra su homólogo en tools/golden-fixtures/<plural>/.
# Cobertura incremental: los ficheros de fixture sin plantilla aún no fallan.
set -uo pipefail

MODELS=("contract:contracts" "customer:customers" "license:licenses" "project:projects")   # <name>:<plural> — crece con los modelos registrados
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/tmp/generated"
FIX="$ROOT/tools/golden-fixtures"
failures=0
summary=""

rm -rf "$OUT"
for entry in "${MODELS[@]}"; do
  name="${entry%%:*}"; plural="${entry##*:}"
  if ! npx nx generate @acc/generators:resource "$name" >/dev/null 2>&1; then
    summary+=" $name: ❌ generación falló |"; failures=$((failures+1)); continue
  fi
  entity_fail=0; covered=0
  while IFS= read -r -d '' file; do
    rel="${file#"$OUT/$plural/"}"
    covered=$((covered+1))
    if [[ ! -f "$FIX/$plural/$rel" ]]; then
      echo "❌ $name: sin homólogo en fixture: $rel"; entity_fail=1; continue
    fi
    if ! diff -u "$FIX/$plural/$rel" "$file" > /tmp/golden-diff-out 2>&1; then
      echo "❌ $name: diff en $rel"; cat /tmp/golden-diff-out; entity_fail=1
    fi
  done < <(find "$OUT/$plural" -type f -print0)
  if [[ $entity_fail -eq 0 ]]; then
    summary+=" $name: ✅ vacío ($covered ficheros) |"
  else
    summary+=" $name: ❌ con diffs |"; failures=$((failures+1))
  fi
done

# ── Gate del generador de APP ────────────────────────────────────────────────
# La capa de composición (esqueleto, plugins, recolocaciones, cableado del root)
# no la cubren los módulos: se genera una app canónica completa y se compara.
# contract+project ejercitan composición, período, lookups y delete; los 3
# plugins opcionales van activados. skipInstall: el gate no toca la red.
APP_OUT="$ROOT/tmp/generated/app-golden"
if ! NX_PREFER_NODE_STRIP_TYPES=false npx nx generate @acc/generators:app app-golden \
      --models=contract,project --ui=spartan --plugins=auth,email,observability \
      --directory=tmp/generated/app-golden --skipInstall --no-interactive >/dev/null 2>&1; then
  summary+=" app: ❌ generación falló |"; failures=$((failures+1))
else
  app_fail=0; covered=0
  while IFS= read -r -d '' file; do
    rel="${file#"$APP_OUT/"}"
    covered=$((covered+1))
    if [[ ! -f "$FIX/app/$rel" ]]; then
      echo "❌ app: sin homólogo en fixture: $rel"; app_fail=1; continue
    fi
    if ! diff -u "$FIX/app/$rel" "$file" > /tmp/golden-diff-out 2>&1; then
      echo "❌ app: diff en $rel"; cat /tmp/golden-diff-out; app_fail=1
    fi
  done < <(find "$APP_OUT" -type f -print0)
  if [[ $app_fail -eq 0 ]]; then
    summary+=" app: ✅ vacío ($covered ficheros) |"
  else
    summary+=" app: ❌ con diffs |"; failures=$((failures+1))
  fi
fi

echo
echo "🏅 Golden diff —$summary"
[[ $failures -eq 0 ]] && echo "Veredicto: apto para commit" || echo "Veredicto: NO commitear hasta vaciar los diffs"
exit $failures
