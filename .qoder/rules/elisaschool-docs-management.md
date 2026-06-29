/**
 * ==================================
 * eLISAschool - Gestion Documentaire
 * ==================================
 * Version: 1.0.0
 * Portée: Organisation et maintenance de la documentation
 * Auteur: franck arlos chendjou
 */

# Conventions eLISAschool — Gestion Documentaire

> **Portée** : Cette règle s'applique à **tous les documents Markdown** créés pendant les sessions de travail.
> **Objectif** : Maintenir une documentation **structurée, navigable et professionnelle** dans `docs/`.
> **Évolution** : Cette règle est **vivante** — mise à jour automatique quand l'organisation évolue.

---

## 📁 Structure de Documentation Obligatoire

**TOUS les fichiers Markdown** (sauf README.md, QUICKSTART.md, CHEATSHEET.md) DOIVENT être dans `docs/`.

### Architecture de `docs/`

```
docs/
├── analyses/          # Analyses architecture, métier, sécurité
├── ameliorations/     # Propositions d'améliorations
├── audits/            # Audits code, performance, sécurité
├── autres/            # Documents divers (à reclasser si possible)
│   ├── frontend/      #   → Docs spécifiques frontend
│   ├── backend/       #   → Docs spécifiques backend
│   ├── deployment/    #   → Docs déploiement
│   └── _divers/       #   → Non catégorisés (à éviter)
├── certifications/    # Certifications finales
├── checklists/        # Checklists validation
├── configurations/    # Configurations système
├── corrections/       # Corrections bugs, fixes
├── deploiements/      # Guides déploiement
├── guides/            # Guides pratiques (dev, tests, utilisation)
├── implementations/   # Implémentations features
├── migrations/        # Migrations database
├── rapports/          # Rapports sessions, avancement, status
├── resumes/           # Résumés exécutifs
├── syntheses/         # Synthèses projet
├── INDEX.md           # ⭐ Index principal (auto-généré)
└── GUIDE-MAINTENANCE-DOCUMENTATION.md  # Guide maintenance
```

---

## 🎯 Règles de Classification

### 1. Prefixes de Fichiers → Catégorie

| Préfixe | Catégorie | Exemple |
|---------|-----------|---------|
| `ANALYSE-*` | `analyses/` | `ANALYSE-ARCHITECTURE-MULTI-TENANT.md` |
| `AUDIT-*` | `audits/` | `AUDIT-MODULES-EXISTANTS.md` |
| `CORRECTION-*`, `FIX-*` | `corrections/` | `CORRECTION-401-JWT-SECRET-DYNAMIQUE.md` |
| `GUIDE-*` | `guides/` | `GUIDE-TEST-MODULE-ELEVES.md` |
| `IMPLEMENTATION-*` | `implementations/` | `IMPLEMENTATION-MODULE-ELEVES-COMPLETE.md` |
| `DEPLOIEMENT-*`, `DEPLOYMENT-*` | `deploiements/` | `GUIDE-DEPLOIEMENT-RAPIDE-V2.md` |
| `MIGRATION-*` | `migrations/` | `MIGRATION-RBAC-v3-MULTI-TENANT-STRICT.md` |
| `RAPPORT-*`, `*-REPORT.md`, `*-SUMMARY.md` | `rapports/` | `RAPPORT-FINAL-SESSION.md` |
| `RESUME-*`, `*-RESUME.md` | `resumes/` | `RESUME-FINAL.md` |
| `SYNTHESE-*` | `syntheses/` | `SYNTHESE-FINALE.md` |
| `CERTIFICATION-*` | `certifications/` | `CERTIFICATION-FINALE-CORRECTIONS-ACADEMIQUE-V2.md` |
| `CHECKLIST-*` | `checklists/` | `CHECKLIST-NOUVEAU-MODULE.md` |
| `CONFIGURATION-*` | `configurations/` | `CONFIGURATION-PORTS.md` |
| `AMELIORATION-*` | `ameliorations/` | `AMELIORATIONS-GROUPES-V1.1.md` |

### 2. Documents Backend vs Frontend

**Règle** : Les documents backend et frontend sont **mélangés** dans les mêmes catégories, pas de séparation.

**Exemples** :
- ✅ `guides/GUIDE-DEVELOPPEMENT.md` (frontend)
- ✅ `guides/MIGRATIONS-GUIDE.md` (backend)
- ✅ `rapports/SESSION-SUMMARY.md` (frontend)
- ✅ `rapports/RAPPORT-ANALYSE-ENUMS.md` (backend)

**Pourquoi** : Meilleure visibilité, navigation unifiée, cohérence thématique.

### 3. Documents à Conserver à la Racine

**Uniquement** :
```
README.md              # Point d'entrée principal
QUICKSTART.md          # Guide démarrage rapide
CHEATSHEET.md          # Aide-mémoire commandes
INDEX.md               # Pointeur vers docs/INDEX.md
.env.example           # Template configuration
```

**Interdiction** : Créer tout autre fichier `.md` à la racine du projet, `backend/`, ou `frontend/`.

---

## 📝 Workflow de Création Documentaire

### Pendant une Session de Travail

**Étape 1 : Créer le document au bon endroit**

```bash
# ✅ CORRECT — Directement dans docs/<catégorie>/
echo "# Titre" > docs/rapports/RAPPORT-SESSION-2026-06-29.md

# ❌ INTERDIT — À la racine
echo "# Titre" > RAPPORT-SESSION.md

# ❌ INTERDIT — Dans backend/ ou frontend/
echo "# Titre" > backend/RAPPORT-SESSION.md
```

**Étape 2 : Nommer selon les conventions**

- **Format** : `TYPE-SUJET-CONTEXTE.md` (KEBAB-CASE)
- **Exemples** :
  - ✅ `CORRECTION-401-JWT-SECRET-DYNAMIQUE.md`
  - ✅ `GUIDE-TEST-MODULE-ELEVES.md`
  - ✅ `RAPPORT-FINAL-SESSION.md`
  - ❌ `rapport final.md` (espaces, lowercase)
  - ❌ `Correction401Jwt.md` (camelCase)

**Étape 3 : Structurer le contenu**

```markdown
# 📋 TYPE - Sujet

> **Contexte** : Description courte du problème/feature
> **Date** : YYYY-MM-DD
> **Statut** : ✅ Terminé / 🔄 En cours / ⚠️ Bloqué

---

## 🎯 Objectif

Description de l'objectif...

## 🔍 Analyse

Détails techniques...

## ✅ Solution

Implémentation...

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| Fichiers modifiés | X |
| Lignes ajoutées | +Y |
| Lignes supprimées | -Z |

---

**📌 Prochaines étapes** : ...
```

---

## 🔄 Maintenance Automatique

### 1. Mise à jour de l'INDEX.md

**Quand** : Après chaque session de travail avec création de documents.

**Comment** :
```bash
# Script auto-généré (à exécuter manuellement ou via hook)
python3 scripts/update-docs-index.py
```

**Ce que fait le script** :
- Compte les fichiers par catégorie
- Met à jour les statistiques dans `docs/INDEX.md`
- Ajoute les nouveaux documents dans les tableaux
- Vérifie les liens cassés
- Génère un rapport de cohérence

### 2. Nettoyage Périodique

**Fréquence** : Tous les 10-15 documents créés.

**Actions** :
1. **Reclassifier** les documents dans `docs/autres/_divers/`
2. **Marquer obsolètes** les anciennes versions :
   ```markdown
   ⚠️ **DOCUMENT OBSOLÈTE** — Voir [VERSION-V2.md](chemin)
   ```
3. **Fusionner** les documents très similaires
4. **Archiver** les documents historiques (si nécessaire)

### 3. Validation des Liens

**Avant commit** :
```bash
# Vérifier les liens dans docs/INDEX.md
python3 scripts/validate-docs-links.py
```

**Règle** : 100% des liens DOIVENT être fonctionnels.

---

## 🚫 Anti-Patterns

### ❌ À NE PAS FAIRE

1. **Créer des fichiers `.md` à la racine**
   ```bash
   # ❌ INTERDIT
   echo "# Rapport" > RAPPORT-SESSION.md
   echo "# Analyse" > backend/ANALYSE.md
   echo "# Guide" > frontend/GUIDE.md
   ```

2. **Ignorer la classification**
   ```bash
   # ❌ INTERDIT — Mauvaise catégorie
   echo "# Fix" > docs/analyses/FIX-BUG.md  # Devrait être corrections/
   ```

3. **Nommage incohérent**
   ```bash
   # ❌ INTERDIT
   docs/rapports/rapport session.md       # Espaces
   docs/rapports/RapportSession.md        # PascalCase
   docs/rapports/rapport-session.md       # Lowercase
   ```

4. **Oublier de mettre à jour l'INDEX**
   - Créer un document sans l'ajouter à `docs/INDEX.md`
   - Laisser les statistiques obsolètes

5. **Dupliquer l'information**
   - Créer `RAPPORT-V1.md` ET `RAPPORT-V2.md` sans marquer V1 obsolète
   - Avoir la même info dans 3 documents différents

---

## ✅ Bonnes Pratiques

### 1. Classification Intelligente

**Se poser la question** : "Quel est le TYPE de document ?"

| Si le document est... | Alors catégorie |
|-----------------------|-----------------|
| Une analyse technique/métier | `analyses/` |
| Un guide pratique | `guides/` |
| Un rapport de session/avancement | `rapports/` |
| Une correction de bug | `corrections/` |
| Une implémentation de feature | `implementations/` |
| Un résumé exécutif | `resumes/` |
| Une synthèse projet | `syntheses/` |

### 2. Documentation Vivante

- **Mettre à jour** les documents existants plutôt que d'en créer de nouveaux
- **Versionner** avec suffixe `-V2`, `-V3` si rupture majeure
- **Marquer obsolètes** les anciennes versions
- **Lien vers la version actuelle** dans les documents obsolètes

### 3. Structure de Fichier

```markdown
# 📋 Titre Descriptif

> **Contexte** : Pourquoi ce document existe
> **Date** : 2026-06-29
> **Auteur** : franck arlos chendjou
> **Statut** : ✅ Actif / ⚠️ Obsolète

---

## 🎯 Objectif

## 🔍 Analyse / Contexte

## ✅ Solution / Implémentation

## 📊 Résultats

## 📚 Références

- [Document lié 1](chemin)
- [Document lié 2](chemin)

---

**📌 Notes** : ...
```

### 4. Navigation Facile

- **Toujours** ajouter les nouveaux documents à `docs/INDEX.md`
- **Utiliser** des liens relatifs : `[Titre](categorie/FICHIER.md)`
- **Éviter** les liens absolus ou URLs
- **Tester** les liens après chaque mise à jour

---

## 📊 Statistiques de Référence

**État actuel** (2026-06-29) :

| Catégorie | Documents |
|-----------|-----------|
| analyses | 18 |
| corrections | 64 |
| implementations | 41 |
| guides | 35 |
| rapports | 43 |
| resumes | 24 |
| syntheses | 11 |
| audits | 4 |
| ameliorations | 11 |
| deploiements | 7 |
| migrations | 7 |
| configurations | 4 |
| certifications | 2 |
| checklists | 2 |
| autres | 131 |
| **TOTAL** | **402** |

---

## 🛠️ Scripts de Maintenance

### 1. `scripts/update-docs-index.py`

**Rôle** : Mettre à jour automatiquement `docs/INDEX.md`

```python
#!/usr/bin/env python3
"""Mettre à jour docs/INDEX.md après création de documents"""

import os
from pathlib import Path

docs_dir = Path("/mnt/DONNEES/projets/eLISAschool/docs")

# Compter les fichiers par catégorie
categories = {}
for cat_dir in docs_dir.iterdir():
    if cat_dir.is_dir():
        files = list(cat_dir.glob("*.md"))
        categories[cat_dir.name] = len(files)

# Mettre à jour docs/INDEX.md
# (logique de mise à jour des tableaux et statistiques)
```

### 2. `scripts/validate-docs-links.py`

**Rôle** : Vérifier que tous les liens dans `docs/INDEX.md` sont valides

```python
#!/usr/bin/env python3
"""Valider les liens dans docs/INDEX.md"""

import re
from pathlib import Path

index_file = Path("/mnt/DONNEES/projets/eLISAschool/docs/INDEX.md")
content = index_file.read_text()

# Extraire tous les liens Markdown
links = re.findall(r'\[([^\]]+)\]\(([^\)]+)\)', content)

# Vérifier chaque lien
valid = 0
broken = 0
for text, url in links:
    # Ignorer les URLs externes
    if url.startswith('http'):
        continue
    
    # Vérifier le fichier existe
    target = Path("docs") / url
    if target.exists():
        valid += 1
    else:
        broken += 1
        print(f"❌ Lien cassé: {url}")

print(f"\n✅ {valid} liens valides")
print(f"❌ {broken} liens cassés")
```

---

## 🎓 Formation Nouvel Arrivant

**Parcours documentation** :

1. **Lire** `docs/INDEX.md` pour comprendre la structure
2. **Consulter** `docs/GUIDE-MAINTENANCE-DOCUMENTATION.md` pour les workflows
3. **Explorer** `docs/guides/` pour les guides pratiques
4. **Lire** `docs/rapports/RAPPORT-FINAL-SESSION.md` pour le contexte projet

---

## 📞 Support

### En Cas de Doute

1. **Quelle catégorie ?** → Voir tableau "Prefixes → Catégorie"
2. **Comment nommer ?** → Format `TYPE-SUJET-CONTEXTE.md`
3. **Où créer ?** → TOUJOURS dans `docs/<catégorie>/`
4. **Mettre à jour l'INDEX ?** → Exécuter `scripts/update-docs-index.py`

### Règle d'Or

> **Quand tu crées un fichier `.md`, il va dans `docs/`. Point final.**

---

## 🔄 Historique des Mises à jour

| Date | Version | Changement |
|------|---------|------------|
| 2026-06-29 | 1.0.0 | Création initiale après réorganisation 402 documents |
