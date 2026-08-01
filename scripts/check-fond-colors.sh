#!/usr/bin/env bash
# ==========================================
# eLISAschool — Garde anti-drift : couleurs du fond principal
# ==========================================
# Vérifie qu'aucune couleur n'est définie hors de fond-palette.ts
# dans le code du fond (frontend/src/components/layout/).
#
# Exclusions assumées :
#   - fond-palette.ts (LA source de vérité)
#   - les autres composants de layout/ (PageHeader… ne font pas partie du fond)
#
# Usage : scripts/check-fond-colors.sh   (exit 0 = OK, exit 1 = violations)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR="$ROOT/frontend/src/components/layout"

PATTERN='#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch'

VIOLATIONS="$(
    find "$DIR" -maxdepth 1 -name 'fond-*' -type f \( -name '*.ts' -o -name '*.tsx' \) \
        | grep -v 'fond-palette.ts' \
        | xargs grep -nE "$PATTERN" 2>/dev/null || true
)"

if [ -n "$VIOLATIONS" ]; then
    echo "ERREUR : couleurs définies hors de fond-palette.ts dans les fichiers fond-* de components/layout/ :" >&2
    echo "$VIOLATIONS" >&2
    exit 1
fi

echo "OK : aucune couleur hors fond-palette.ts dans les fichiers fond-* de components/layout/"
