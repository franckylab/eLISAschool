#!/usr/bin/env python3
"""
Script de marquage des fichiers obsolètes
Ajoute un bandeau en haut des fichiers V1 pour indiquer qu'ils sont obsolètes
"""

import os
from pathlib import Path

DOCS_DIR = Path("/mnt/DONNEES/projets/eLISAschool/docs")

def mark_file_as_obsolète(filepath, replacement_hint=None):
    """Marquer un fichier comme obsolète"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier si déjà marqué
        if "⚠️ **DOCUMENT OBSOLÈTE**" in content:
            return False
        
        # Créer le message de marquage
        if replacement_hint:
            markage = f"""> ⚠️ **DOCUMENT OBSOLÈTE** - Ce document a été remplacé par une version plus récente.
> **Remplacé par :** {replacement_hint}
> 
> Ce document est conservé pour historique uniquement.

---

"""
        else:
            markage = """> ⚠️ **DOCUMENT OBSOLÈTE** - Ce document a été remplacé par une version plus récente.
> Consultez la version mise à jour (recherchez V2, V3, ou FINAL dans le même dossier).
> 
> Ce document est conservé pour historique uniquement.

---

"""
        
        # Écrire le fichier avec le marquage
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(markage + content)
        
        return True
    except Exception as e:
        print(f"  ⚠️ Erreur marquage {filepath.name}: {e}")
        return False

def main():
    print("🔍 Recherche et marquage des fichiers obsolètes...")
    print("=" * 60)
    
    marked = 0
    
    # Liste des fichiers V1 à marquer (exemples détectés)
    fichiers_a_marquer = [
        # Certifications
        ("docs/certifications/CERTIFICATION-FINALE-CORRECTIONS-ACADEMIQUE.md", 
         "CERTIFICATION-FINALE-CORRECTIONS-ACADEMIQUE-V2.md"),
        
        # Améliorations - versions anciennes
        ("docs/ameliorations/AMELIORATIONS-GROUPES-V1.1.md", None),
        ("docs/ameliorations/AMELIORATIONS-ORGANISATION-v1.1.md", None),
        
        # Configurations - versions anciennes  
        ("docs/configurations/CONFIGURATION-ORGANISATION-v1.3.md", None),
    ]
    
    # Mapper les chemins relatifs vers absolus
    for rel_path, replacement in fichiers_a_marquer:
        filepath = Path("/mnt/DONNEES/projets/eLISAschool") / rel_path
        
        if filepath.exists():
            if mark_file_as_obsolète(filepath, replacement):
                print(f"  ✅ {filepath.name}")
                marked += 1
            else:
                print(f"  ⏭️  {filepath.name} (déjà marqué)")
        else:
            print(f"  ❌ {filepath.name} (fichier non trouvé)")
    
    print("\n" + "=" * 60)
    print(f"✅ Marquage terminé : {marked} fichiers marqués")
    print("=" * 60)

if __name__ == "__main__":
    main()
