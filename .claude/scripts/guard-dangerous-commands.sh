#!/usr/bin/env bash
# PreToolUse guard (Bash): bloquea comandos destructivos.
# Reescrito portable para macOS (el original de sap-licences usaba grep -oP / PCRE,
# no disponible en BSD grep — fallaba en silencio). Extraemos el comando con python3.
set -euo pipefail

INPUT=$(cat)

COMMAND=$(printf '%s' "$INPUT" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get("tool_input", {}).get("command", ""))
except Exception:
    print("")
' 2>/dev/null || echo "")

[ -z "$COMMAND" ] && exit 0

DANGEROUS_PATTERNS=(
  'rm -rf /'
  'rm -rf ~'
  'rm -rf \$HOME'
  'git push --force'
  'git push -f'
  'git reset --hard origin'
  'DROP DATABASE'
  'DROP SCHEMA'
  'TRUNCATE.*public'
  '> /dev/sda'
  'mkfs\.'
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if printf '%s' "$COMMAND" | grep -qiE "$pattern"; then
    echo "🛑 Comando bloqueado por guard-dangerous-commands: coincide con '$pattern'" >&2
    exit 2
  fi
done

exit 0
