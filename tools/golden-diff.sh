#!/usr/bin/env bash
# Gate de oro: regenera cada modelo registrado y compara CADA fichero generado
# contra su homólogo en tools/golden-fixtures/<plural>/.
# Cobertura incremental: los ficheros de fixture sin plantilla aún no fallan.
set -uo pipefail

MODELS=("contract:contracts")   # <name>:<plural> — crece con los modelos registrados
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

echo
echo "🏅 Golden diff —$summary"
[[ $failures -eq 0 ]] && echo "Veredicto: apto para commit" || echo "Veredicto: NO commitear hasta vaciar los diffs"
exit $failures
