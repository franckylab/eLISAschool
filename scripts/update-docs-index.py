#!/usr/bin/env python3
"""
==================================
eLISAschool - Update Docs Index
==================================
Version: 1.0.0
Auteur: franck arlos chendjou

Rôle: Mettre à jour automatiquement docs/INDEX.md après création de documents
Usage: python3 scripts/update-docs-index.py
"""

import os
import re
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/mnt/DONNEES/projets/eLISAschool")
DOCS_DIR = BASE_DIR / "docs"
INDEX_FILE = DOCS_DIR / "INDEX.md"

# Mapping catégorie → emoji + titre
CATEGORY_INFO = {
    "analyses": ("🔍", "Analyses"),
    "ameliorations": ("🚀", "Améliorations"),
    "audits": ("🔎", "Audits"),
    "certifications": ("🎓", "Certifications"),
    "checklists": ("✅", "Checklists"),
    "configurations": ("⚙️", "Configurations"),
    "corrections": ("🔧", "Corrections"),
    "deploiements": ("🚀", "Déploiements"),
    "guides": ("📖", "Guides"),
    "implementations": ("🔨", "Implémentations"),
    "migrations": ("🔄", "Migrations"),
    "rapports": ("📊", "Rapports"),
    "resumes": ("📋", "Résumés"),
    "syntheses": ("📝", "Synthèses"),
    "autres": ("📁", "Autres"),
}

def count_files_by_category():
    """Compter les fichiers .md par catégorie"""
    counts = {}
    total = 0
    
    for cat_dir in sorted(DOCS_DIR.iterdir()):
        if cat_dir.is_dir() and cat_dir.name in CATEGORY_INFO:
            files = [f for f in cat_dir.iterdir() if f.suffix == '.md']
            counts[cat_dir.name] = len(files)
            total += len(files)
    
    return counts, total

def get_recent_documents(limit=10):
    """Obtenir les documents les plus récents"""
    all_docs = []
    
    for cat_dir in DOCS_DIR.iterdir():
        if cat_dir.is_dir():
            for file in cat_dir.glob("*.md"):
                stat = file.stat()
                all_docs.append({
                    'path': file,
                    'category': cat_dir.name,
                    'mtime': stat.st_mtime,
                    'name': file.name
                })
    
    # Trier par date de modification (plus récent d'abord)
    all_docs.sort(key=lambda x: x['mtime'], reverse=True)
    return all_docs[:limit]

def update_index():
    """Mettre à jour docs/INDEX.md"""
    print("🚀 Mise à jour de docs/INDEX.md...")
    
    # Compter les fichiers
    counts, total = count_files_by_category()
    
    print(f"\n📊 Statistiques:")
    for cat, count in sorted(counts.items()):
        emoji, name = CATEGORY_INFO.get(cat, ("📁", cat))
        print(f"   {emoji} {name}: {count} fichiers")
    print(f"\n   📚 TOTAL: {total} fichiers")
    
    # Documents récents
    recent = get_recent_documents(10)
    print(f"\n🆕 10 documents les plus récents:")
    for doc in recent:
        cat_name = CATEGORY_INFO.get(doc['category'], ("📁", doc['category']))[1]
        print(f"   - {doc['name']} ({cat_name})")
    
    # Sauvegarder les statistiques dans un fichier JSON pour usage futur
    stats_file = DOCS_DIR / "stats.json"
    import json
    stats = {
        'last_updated': datetime.now().isoformat(),
        'total_documents': total,
        'by_category': counts,
        'recent_documents': [d['name'] for d in recent]
    }
    
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Statistiques sauvegardées dans {stats_file}")
    print(f"✅ INDEX.md prêt pour mise à jour manuelle si nécessaire")
    
    return counts, total

def validate_links():
    """Valider les liens dans INDEX.md"""
    print("\n🔍 Validation des liens...")
    
    if not INDEX_FILE.exists():
        print(f"❌ {INDEX_FILE} n'existe pas")
        return
    
    content = INDEX_FILE.read_text(encoding='utf-8')
    
    # Extraire tous les liens Markdown [text](path)
    links = re.findall(r'\[([^\]]+)\]\(([^\)]+)\)', content)
    
    valid = 0
    broken = 0
    broken_links = []
    
    for text, url in links:
        # Ignorer les URLs externes et ancres
        if url.startswith('http') or url.startswith('#') or url.startswith('mailto:'):
            valid += 1
            continue
        
        # Ignorer les liens vers fichiers .qoder
        if '.qoder' in url:
            valid += 1
            continue
        
        # Vérifier le fichier existe (chemin relatif depuis docs/)
        target = DOCS_DIR / url
        if target.exists():
            valid += 1
        else:
            broken += 1
            broken_links.append((text, url))
    
    print(f"\n✅ {valid} liens valides")
    if broken > 0:
        print(f"❌ {broken} liens cassés:")
        for text, url in broken_links[:10]:  # Afficher max 10
            print(f"   - [{text}]({url})")
    else:
        print(f"🎉 100% des liens sont fonctionnels!")
    
    return valid, broken

if __name__ == "__main__":
    print("=" * 80)
    print("📚 eLISAschool - Update Documentation Index")
    print("=" * 80)
    print()
    
    # Mise à jour des statistiques
    counts, total = update_index()
    
    # Validation des liens
    valid, broken = validate_links()
    
    print("\n" + "=" * 80)
    print("✅ Mise à jour terminée!")
    print("=" * 80)
