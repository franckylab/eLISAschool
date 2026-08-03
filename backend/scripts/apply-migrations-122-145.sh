#!/usr/bin/env bash
# ==========================================
# eLISAschool — Application des migrations SQL 122–145 (staging/prod)
# ==========================================
# Les migrations SQL ne sont PAS branchées sur TypeORM (data-source.ts sans
# glob migrations) → application manuelle. Ce script applique les migrations
# 122–145 dans l'ORDRE CORRECT, une seule fois, sur l'environnement cible.
#
# ⚠️ ORDRE : la 139 (index unique heures_cours, WHERE "deletedAt" IS NULL)
# exige la colonne deletedAt → la 141 (soft delete) est appliquée AVANT la 139.
#
# ⚠️ La 128 (volume horaire heures → minutes) multiplie par 60 : NE PAS
# relancer si déjà appliquée (les valeurs seraient re-multipliées).
#
# Connexion (défauts = docker local, port 7002 DANS le conteneur) :
#   DB_HOST= DB_PORT= DB_USER= DB_NAME=  →  ./scripts/apply-migrations-122-145.sh
# Depuis le conteneur DB :
#   docker exec elisaschool_db psql -h 127.0.0.1 -p 7002 -U elisaschool_user -d elisaschool
#
# Usage :
#   ./scripts/apply-migrations-122-145.sh            # applique (liste ci-dessous)
#   ./scripts/apply-migrations-122-145.sh --list     # affiche l'ordre sans appliquer
# ==========================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/database/migrations"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-7002}"
DB_USER="${DB_USER:-elisaschool_user}"
DB_NAME="${DB_NAME:-elisaschool}"
export PGPASSWORD="${DB_PASSWORD:-}"

# Ordre d'application — 141 AVANT 139 (contrainte deletedAt)
MIGRATIONS=(
    "122-hierarchie-superieur-poste.sql"
    "123-refonte-notes-bulletins.sql"
    "124-fix-hierarchie-orphelins.sql"
    "125-organigramme-read-tous-roles.sql"
    "126-fix-vues-materialisees-statuts.sql"
    "127-templates-organisation-categorisation.sql"
    "128-co-enseignement.sql"
    "128-volume-horaire-minutes.sql"
    "129-notes-versions.sql"
    "130-soft-delete-eleves.sql"
    "131-drop-tables-legacy-edt.sql"
    "132-affectation-eleve-index-unique.sql"
    "133-drop-credits-matieres-niveaux.sql"
    "134-audit-permissions.sql"
    "135-audit-enrichissement.sql"
    "136-audit-metadata.sql"
    "137-audit-device-info.sql"
    "138-permissions-heures-cours.sql"
    "141-soft-delete-rh-organisation.sql"   # ⚠️ AVANT la 139
    "139-index-unique-heures-cours.sql"
    "140-materialisation-auto.sql"
    "142-network-permissions.sql"
    "143-heure-cours-updated-at.sql"
    "144-workflows-validation.sql"
    "145-audit-enum-competences-apparence-groupes-finances.sql"
)

if [[ "${1:-}" == "--list" ]]; then
    echo "Ordre d'application (${#MIGRATIONS[@]} migrations) :"
    for m in "${MIGRATIONS[@]}"; do
        echo "  $m"
    done
    echo
    echo "⚠️ 141 (soft delete) AVANT 139 (index unique heures_cours — exige deletedAt)."
    exit 0
fi

echo "Cible : $DB_HOST:$DB_PORT/$DB_NAME (user: $DB_USER)"
echo "Vérification de la connexion..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    echo "ERREUR : connexion PostgreSQL impossible. Variables : DB_HOST/DB_PORT/DB_USER/DB_NAME" >&2
    exit 1
fi

echo "Application de ${#MIGRATIONS[@]} migrations..."
for m in "${MIGRATIONS[@]}"; do
    fichier="$MIGRATIONS_DIR/$m"
    if [[ ! -f "$fichier" ]]; then
        echo "ERREUR : fichier introuvable — $fichier" >&2
        exit 1
    fi

    # Garde 128 : la conversion heures → minutes (×60) n'est pas idempotente.
    # Déjà convertie si le volume max dépasse 48 (en minutes, une matière peut
    # dépasser 48 ; en heures, une matière > 48h/semaine est impossible).
    if [[ "$m" == "128-volume-horaire-minutes.sql" ]]; then
        max_horaire="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tA -c 'SELECT COALESCE(MAX("volumeHoraire"), 0) FROM matieres_niveaux' 2>/dev/null || echo 0)"
        if [[ "$max_horaire" =~ ^[0-9]+$ ]] && (( max_horaire > 48 )); then
            echo "⏭  $m — SKIP (volume horaire déjà converti en minutes, max=$max_horaire)"
            continue
        fi
    fi

    echo "→ $m"
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$fichier" >/dev/null; then
        echo "❌ ÉCHEC : $m (les suivantes ne sont PAS appliquées)" >&2
        exit 1
    fi
    echo "  ✓ ok"
done

echo
echo "Terminé : ${#MIGRATIONS[@]} migrations appliquées."
