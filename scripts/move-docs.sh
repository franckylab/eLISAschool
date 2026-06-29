#!/bin/bash
# Script de déplacement et classification des documents Markdown
# Organisation par type de document dans docs/

set -e

ROOT_DIR="/mnt/DONNEES/projets/eLISAschool"
DOCS_DIR="$ROOT_DIR/docs"

echo "🚀 Début du déplacement des documents..."
echo "========================================="

# Fonction pour déplacer un fichier avec marquage si obsolète
move_file() {
    local file="$1"
    local target_dir="$2"
    local filename=$(basename "$file")
    
    # Marquer comme obsolète si contient V1 (mais pas V10, V11, etc.)
    if [[ "$filename" =~ -V1\.md$ ]] && [[ ! "$filename" =~ -V1[0-9]\.md$ ]]; then
        local version_file="$DOCS_DIR/$target_dir/$filename"
        cp "$file" "$version_file"
        
        # Ajouter le marquage en haut du fichier
        local temp_file=$(mktemp)
        echo -e "> ⚠️ **DOCUMENT OBSOLÈTE** - Ce document a été remplacé par une version plus récente.\n> Consultez la version mise à jour (recherchez V2, V3, ou FINAL dans le même dossier).\n\n---\n" > "$temp_file"
        cat "$version_file" >> "$temp_file"
        mv "$temp_file" "$version_file"
        
        echo "  📦 $filename → $target_dir/ (marqué obsolète)"
    else
        mv "$file" "$DOCS_DIR/$target_dir/"
        echo "  📦 $filename → $target_dir/"
    fi
}

# Compteur de fichiers déplacés
count=0

echo ""
echo "📊 ANALYSES..."
for f in "$ROOT_DIR"/ANALYSE-*.md; do
    [ -e "$f" ] && move_file "$f" "analyses" && ((count++))
done

echo ""
echo "🔧 CORRECTIONS..."
for f in "$ROOT_DIR"/CORRECTION-*.md "$ROOT_DIR"/CORRECTIONS-*.md; do
    [ -e "$f" ] && move_file "$f" "corrections" && ((count++))
done

echo ""
echo "✨ AMÉLIORATIONS..."
for f in "$ROOT_DIR"/AMELIORATION-*.md "$ROOT_DIR"/AMELIORATIONS-*.md "$ROOT_DIR"/AMÉLIORATIONS-*.md; do
    [ -e "$f" ] && move_file "$f" "ameliorations" && ((count++))
done

echo ""
echo "🔨 IMPLÉMENTATIONS..."
for f in "$ROOT_DIR"/IMPLEMENTATION-*.md "$ROOT_DIR"/IMPLÉMENTATION-*.md; do
    [ -e "$f" ] && move_file "$f" "implementations" && ((count++))
done

echo ""
echo "📖 GUIDES..."
for f in "$ROOT_DIR"/GUIDE-*.md; do
    [ -e "$f" ] && move_file "$f" "guides" && ((count++))
done

echo ""
echo "🔍 AUDITS..."
for f in "$ROOT_DIR"/AUDIT-*.md; do
    [ -e "$f" ] && move_file "$f" "audits" && ((count++))
done

echo ""
echo "🎓 CERTIFICATIONS..."
for f in "$ROOT_DIR"/CERTIFICATION-*.md; do
    [ -e "$f" ] && move_file "$f" "certifications" && ((count++))
done

echo ""
echo "✅ CHECKLISTS..."
for f in "$ROOT_DIR"/CHECKLIST-*.md; do
    [ -e "$f" ] && move_file "$f" "checklists" && ((count++))
done

echo ""
echo "⚙️ CONFIGURATIONS..."
for f in "$ROOT_DIR"/CONFIGURATION-*.md; do
    [ -e "$f" ] && move_file "$f" "configurations" && ((count++))
done

echo ""
echo "🚀 DÉPLOIEMENTS..."
for f in "$ROOT_DIR"/DEPLOYMENT-*.md "$ROOT_DIR"/DEPLOIEMENT-*.md; do
    [ -e "$f" ] && move_file "$f" "deploiements" && ((count++))
done

echo ""
echo "🔄 MIGRATIONS..."
for f in "$ROOT_DIR"/MIGRATION-*.md "$ROOT_DIR"/MAJ-*.md; do
    [ -e "$f" ] && move_file "$f" "migrations" && ((count++))
done

echo ""
echo "📊 RAPPORTS..."
for f in "$ROOT_DIR"/RAPPORT-*.md; do
    [ -e "$f" ] && move_file "$f" "rapports" && ((count++))
done

echo ""
echo "📝 SYNTHÈSES..."
for f in "$ROOT_DIR"/SYNTHESE-*.md; do
    [ -e "$f" ] && move_file "$f" "syntheses" && ((count++))
done

echo ""
echo "📋 RESUMÉS..."
for f in "$ROOT_DIR"/RESUME-*.md; do
    [ -e "$f" ] && move_file "$f" "resumes" && ((count++))
done

echo ""
echo "📁 AUTRES DOCUMENTS..."
# Fichiers restants qui ne correspondent pas aux catégories ci-dessus
for f in "$ROOT_DIR"/*.md; do
    filename=$(basename "$f")
    # Exclure les fichiers à garder à la racine
    if [[ "$filename" != "README.md" && "$filename" != "QUICKSTART.md" && 
          "$filename" != "CHEATSHEET.md" && "$filename" != "INDEX.md" &&
          "$filename" != "ETAPES-COMPLETES-RESUME.md" && "$filename" != "ETAPES-ACCOMPLIES.txt" ]]; then
        move_file "$f" "autres" && ((count++))
    fi
done

echo ""
echo "========================================="
echo "✅ Déplacement terminé !"
echo "📊 Total : $count fichiers déplacés"
echo "========================================="
