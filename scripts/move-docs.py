#!/usr/bin/env python3
"""
Script de déplacement et classification des documents Markdown
Organisation par type de document dans docs/
"""

import os
import shutil
from pathlib import Path

ROOT_DIR = Path("/mnt/DONNEES/projets/eLISAschool")
DOCS_DIR = ROOT_DIR / "docs"

# Mapping préfixe -> dossier cible
CATEGORIES = {
    'ANALYSE': 'analyses',
    'CORRECTION': 'corrections',
    'CORRECTIONS': 'corrections',
    'AMELIORATION': 'ameliorations',
    'AMELIORATIONS': 'ameliorations',
    'AMÉLIORATIONS': 'ameliorations',
    'IMPLEMENTATION': 'implementations',
    'IMPLÉMENTATION': 'implementations',
    'GUIDE': 'guides',
    'AUDIT': 'audits',
    'CERTIFICATION': 'certifications',
    'CHECKLIST': 'checklists',
    'CONFIGURATION': 'configurations',
    'DEPLOYMENT': 'deploiements',
    'DEPLOIEMENT': 'deploiements',
    'MIGRATION': 'migrations',
    'MAJ': 'migrations',
    'RAPPORT': 'rapports',
    'SYNTHESE': 'syntheses',
    'RESUME': 'resumes',
}

# Fichiers à garder à la racine
KEEP_IN_ROOT = {
    'README.md',
    'QUICKSTART.md', 
    'CHEATSHEET.md',
    'INDEX.md',
    'ETAPES-COMPLETES-RESUME.md',
    'ETAPES-ACCOMPLIES.txt',
}

def is_obsolète(filename):
    """Vérifier si un fichier est une version obsolète (V1 mais pas V10, V11, etc.)"""
    return filename.endswith('-V1.md') and not any(filename.endswith(f'-V{i}.md') for i in range(10, 20))

def mark_as_obsolète(filepath):
    """Ajouter un marquage en haut du fichier pour indiquer qu'il est obsolète"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        markage = """> ⚠️ **DOCUMENT OBSOLÈTE** - Ce document a été remplacé par une version plus récente.
> Consultez la version mise à jour (recherchez V2, V3, ou FINAL dans le même dossier).

---

"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(markage + content)
        return True
    except Exception as e:
        print(f"  ⚠️ Erreur marquage {filepath.name}: {e}")
        return False

def get_category(filename):
    """Déterminer la catégorie d'un fichier selon son préfixe"""
    for prefix, category in CATEGORIES.items():
        if filename.startswith(prefix):
            return category
    return 'autres'

def move_file(filepath, category):
    """Déplacer un fichier vers sa catégorie"""
    target_dir = DOCS_DIR / category
    target_dir.mkdir(parents=True, exist_ok=True)
    
    target_path = target_dir / filepath.name
    
    try:
        # Si fichier obsolète, copier + marquer
        if is_obsolète(filepath.name):
            shutil.copy2(filepath, target_path)
            mark_as_obsolète(target_path)
            filepath.unlink()  # Supprimer l'original
            print(f"  📦 {filepath.name} → {category}/ (marqué obsolète)")
        else:
            shutil.move(str(filepath), str(target_path))
            print(f"  📦 {filepath.name} → {category}/")
        return True
    except Exception as e:
        print(f"  ❌ Erreur {filepath.name}: {e}")
        return False

def main():
    print("🚀 Début du déplacement des documents...")
    print("=" * 60)
    
    count = 0
    errors = 0
    
    # Lister tous les fichiers .md à la racine
    md_files = [f for f in ROOT_DIR.glob("*.md") if f.is_file()]
    
    print(f"\n📊 {len(md_files)} fichiers Markdown trouvés à la racine\n")
    
    for filepath in sorted(md_files):
        filename = filepath.name
        
        # Skip fichiers à garder
        if filename in KEEP_IN_ROOT:
            print(f"  ⏭️  {filename} (conservé à la racine)")
            continue
        
        # Déterminer la catégorie
        category = get_category(filename)
        
        # Déplacer
        if move_file(filepath, category):
            count += 1
        else:
            errors += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Déplacement terminé !")
    print(f"📊 Succès : {count} fichiers déplacés")
    if errors > 0:
        print(f"❌ Erreurs : {errors} fichiers")
    print("=" * 60)

if __name__ == "__main__":
    main()
