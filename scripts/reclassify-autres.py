#!/usr/bin/env python3
"""
Script de reclassification des documents dans docs/autres/
Crée des sous-catégories thématiques
"""

import shutil
from pathlib import Path
from collections import defaultdict

AUTRES_DIR = Path("/mnt/DONNEES/projets/eLISAschool/docs/autres")

# Patterns de classification
CATEGORIES = {
    '_backup-system': ['BACKUP', 'backup'],
    '_sessions': ['SESSION', 'session', 'RAPPORT-SESSION', 'SESSION-'],
    '_seeds': ['SEED', 'seed'],
    '_phase1': ['PHASE1', 'phase1'],
    '_multi-tenant': ['MULTI-TENANT', 'MULTI-ETABLISSEMENT', 'multi-tenant'],
    '_notifications': ['NOTIFICATION', 'notification'],
    '_frontend': ['FRONTEND', 'frontend'],
    '_rbac': ['RBAC', 'PERMISSION', 'permission'],
    '_optimisations': ['OPTIM', 'optim', 'PERFORMANCE', 'performance'],
    '_quick-start': ['QUICK', 'quick', 'QUICKSTART', 'DEPLOY-RH'],
    '_fix': ['FIX', 'fix', 'DIAGNOSTIC', 'CORRECTION'],
    '_integration': ['INTEGRATION', 'integration'],
    '_navigation': ['NAVIGATION', 'SIDEBAR'],
    '_gamification': ['GAMIFICATION', 'gamification'],
    '_formulaire': ['FORMULAIRE', 'formulaire'],
    '_nettoyage': ['NETTOYAGE', 'nettoyage'],
    '_mise-a-jour': ['MISE-A-JOUR', 'MAJ-'],
    '_index': ['INDEX-'],
    '_summary': ['SUMMARY', 'RESUME', 'EXECUTIVE'],
    '_refactorisation': ['REFACTORISATION', 'FINAL-REFACTORISATION'],
    '_improvements': ['IMPROVEMENT', 'FEATURES', 'AMELIORATION'],
}

def classify_file(filename):
    """Classer un fichier selon son nom"""
    for category, patterns in CATEGORIES.items():
        for pattern in patterns:
            if pattern.lower() in filename.lower():
                return category
    return '_divers'

def main():
    print("🔄 Re-classification des documents dans docs/autres/...")
    print("=" * 60)
    
    # Créer les dossiers
    for category in CATEGORIES.keys():
        (AUTRES_DIR / category).mkdir(exist_ok=True)
    (AUTRES_DIR / '_divers').mkdir(exist_ok=True)
    
    # Lister les fichiers .md (pas les dossiers)
    md_files = [f for f in AUTRES_DIR.glob("*.md") if f.is_file()]
    
    print(f"\n📊 {len(md_files)} fichiers à classer\n")
    
    classified = defaultdict(list)
    
    for filepath in md_files:
        category = classify_file(filepath.name)
        classified[category].append(filepath.name)
        
        target = AUTRES_DIR / category / filepath.name
        try:
            shutil.move(str(filepath), str(target))
        except Exception as e:
            print(f"  ⚠️ Erreur {filepath.name}: {e}")
    
    # Afficher les résultats
    for category, files in sorted(classified.items()):
        print(f"  📁 {category}/: {len(files)} fichiers")
    
    total = sum(len(files) for files in classified.values())
    print(f"\n{'=' * 60}")
    print(f"✅ Classification terminée : {total} fichiers reclassés")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
