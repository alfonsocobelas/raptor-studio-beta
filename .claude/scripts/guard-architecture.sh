#!/usr/bin/env bash
# PreToolUse guard (Write|Edit|MultiEdit): reglas de arquitectura del acelerador.
# 1) libs/schema es TypeScript puro (sin framework, sin @nx/devkit, sin ejs)
# 2) tools/golden-fixtures/ es de solo lectura (solo re-baseline deliberado vía make golden-baseline)
# 3) las plantillas de features no importan @spartan-ng/* directamente (ADR-003 Nivel 1)
# 4) las plantillas de domain no emiten imports de framework (@nestjs, typeorm)
# Portable macOS: parsing con python3, sin grep -P.
set -euo pipefail

INPUT=$(cat)

eval "$(printf '%s' "$INPUT" | python3 -c '
import json, shlex, sys
try:
    data = json.load(sys.stdin)
    ti = data.get("tool_input", {})
    path = ti.get("file_path", "")
    content = ti.get("content", "") or ti.get("new_string", "") or ""
    print("FILE_PATH=" + shlex.quote(path))
    print("CONTENT=" + shlex.quote(content))
except Exception:
    print("FILE_PATH=''"); print("CONTENT=''")
' 2>/dev/null || echo "FILE_PATH=''; CONTENT=''")"

[ -z "$FILE_PATH" ] && exit 0

# Regla 2: golden fixtures congeladas
case "$FILE_PATH" in
  *tools/golden-fixtures/*)
    echo "🛑 tools/golden-fixtures/ es de solo lectura. Usa el flujo de re-baseline de la skill golden-diff." >&2
    exit 2
    ;;
esac

# Solo inspeccionamos contenido de .ts/.tsx y plantillas
case "$FILE_PATH" in
  *.ts | *.tsx | *.template) ;;
  *) exit 0 ;;
esac

fail() {
  echo "🛑 Violación de arquitectura ($1): $2" >&2
  exit 2
}

# Regla 1: pureza de libs/schema
case "$FILE_PATH" in
  *libs/schema/*)
    if printf '%s' "$CONTENT" | grep -qE "from '(@nestjs|@angular|typeorm|class-validator|class-transformer|@nx/devkit|ejs)"; then
      fail "libs/schema" "el schema es TypeScript puro; no puede importar frameworks ni tooling"
    fi
    ;;
esac

# Reglas 3 y 4: qué emiten las plantillas
case "$FILE_PATH" in
  *libs/generators/*files/*)
    case "$FILE_PATH" in
      *frontend*/features/* | */features/*)
        if printf '%s' "$CONTENT" | grep -q "@spartan-ng/"; then
          fail "plantilla feature" "las features emitidas no importan @spartan-ng/* directamente (ADR-003: usar componentes shared)"
        fi
        ;;
    esac
    case "$FILE_PATH" in
      */domain/*)
        if printf '%s' "$CONTENT" | grep -qE "from '(@nestjs|typeorm)"; then
          fail "plantilla domain" "el dominio emitido no importa @nestjs/* ni typeorm"
        fi
        ;;
    esac
    ;;
esac

exit 0
