# 📖 Guide de Maintenance de la Documentation

> **Version** : 1.0.0  
> **Date** : 29 juin 2026  
> **Objectif** : Maintenir la documentation organisée et professionnelle

---

## 🎯 Principes Directeurs

### 1. Organisation par Type
Chaque document doit être rangé selon son **type**, pas selon son sujet :

| Type de Document | Dossier | Exemples |
|------------------|---------|----------|
| **Analyse** | `docs/analyses/` | Étude d'architecture, audit de cohérence |
| **Correction** | `docs/corrections/` | Fix de bug, résolution d'erreur |
| **Implémentation** | `docs/implementations/` | Nouveau module, feature complète |
| **Guide** | `docs/guides/` | Tutoriel, procédure, how-to |
| **Rapport** | `docs/rapports/` | Rapport de session, d'exécution |
| **Synthèse** | `docs/syntheses/` | Résumé exécutif, vue d'ensemble |
| **Migration** | `docs/migrations/` | Changement de version, refactor |

### 2. Conventions de Nommage

**Format** : `TYPE-SUJET-CONTEXTE.md`

```
✅ CORRECTION-401-JWT-SECRET-DYNAMIQUE.md
✅ IMPLEMENTATION-MODULE-ELEVES-COMPLETE.md
✅ GUIDE-TEST-MULTI-TENANT-V3.md
✅ ANALYSE-ARCHITECTURE-MULTI-TENANT.md

❌ correction-401.md (minuscules)
❌ ModuleEleves.md (PascalCase)
❌ guide_test_multi_tenant.md (snake_case)
```

**Règles** :
- ✅ **KEBAB-CASE** en majuscules
- ✅ Préfixe par **TYPE** de document
- ✅ Mots en **FRANÇAIS** (sauf termes techniques)
- ✅ Pas de caractères spéciaux (accents acceptés)

### 3. Gestion des Versions

**Quand créer une nouvelle version** :
- Changement majeur de contenu (>50% modifié)
- Nouvelle approche architecturale
- Correction de erreurs fondamentales

**Format de version** :
```
DOCUMENT-V1.md          → Version initiale (obsolète si V2 existe)
DOCUMENT-V2.md          → Version actuelle
DOCUMENT-V3-FINAL.md    → Version finale et stable
```

**Marquage des obsolètes** :
```markdown
> ⚠️ **DOCUMENT OBSOLÈTE** - Ce document a été remplacé par une version plus récente.
> **Remplacé par :** DOCUMENT-V2.md
> 
> Ce document est conservé pour historique uniquement.

---

[Contenu original...]
```

---

## 📋 Workflow d'Ajout d'un Document

### Étape 1 : Déterminer le Type

Posez-vous la question : **"Qu'est-ce que ce document décrit ?"**

| Réponse | Type | Dossier |
|---------|------|---------|
| J'analyse un problème | Analyse | `docs/analyses/` |
| J'ai corrigé un bug | Correction | `docs/corrections/` |
| J'ai créé une feature | Implémentation | `docs/implementations/` |
| J'explique comment faire | Guide | `docs/guides/` |
| Je rapporte ce qui a été fait | Rapport | `docs/rapports/` |
| Je synthétise plusieurs docs | Synthèse | `docs/syntheses/` |
| J'ai migré/refactorisé | Migration | `docs/migrations/` |

### Étape 2 : Nommer le Fichier

```bash
# Format : TYPE-SUJET-CONTEXTE.md

# Exemples :
CORRECTION-ERREUR-500-LOGIN.md
IMPLEMENTATION-MODULE-TRANSPORT-COMPLETE.md
GUIDE-DEPLOIEMENT-PRODUCTION-V2.md
ANALYSE-PERFORMANCE-BULLETINS.md
```

### Étape 3 : Ranger au Bon Emplacement

```bash
# ✅ CORRECT
mv MON-DOCUMENT.md docs/corrections/

# ❌ INCORRECT
mv MON-DOCUMENT.md docs/          # Pas à la racine de docs/
mv MON-DOCUMENT.md docs/autres/   # Seulement si pas de catégorie claire
```

### Étape 4 : Mettre à Jour l'INDEX

Ajoutez une entrée dans `docs/INDEX.md` :

```markdown
### 🔧 Corrections (63 documents)

| Document | Description | Statut |
|----------|-------------|--------|
| [CORRECTION-ERREUR-500-LOGIN.md](corrections/CORRECTION-ERREUR-500-LOGIN.md) | Erreur login | ✅ Actif |
```

---

## 🔄 Maintenance Périodique

### Hebdomadaire
- [ ] Ranger les nouveaux documents créés dans la semaine
- [ ] Vérifier les fichiers dans `docs/autres/_divers/`
- [ ] Mettre à jour `docs/INDEX.md` si nouveaux documents

### Mensuel
- [ ] Consolider les documents similaires
- [ ] Marquer les versions obsolètes
- [ ] Vérifier les liens cassés dans INDEX.md
- [ ] Nettoyer le dossier `docs/temp/` si existe

### Trimestriel
- [ ] Audit complet de la documentation
- [ ] Supprimer les documents vraiment inutiles (>2 versions obsolètes)
- [ ] Archiver les anciens rapports de session
- [ ] Mettre à jour les statistiques dans INDEX.md

---

## 🛠️ Scripts Disponibles

### 1. move-docs.py
**Usage** : Déplacer et classifier les documents de la racine vers docs/

```bash
python3 scripts/move-docs.py
```

**Quand l'utiliser** :
- Après une session de travail avec nombreux .md créés à la racine
- Avant un commit majeur

### 2. mark-obsolete.py
**Usage** : Marquer les fichiers V1 comme obsolètes

```bash
python3 scripts/mark-obsolete.py
```

**Quand l'utiliser** :
- Après création d'une version V2 ou V3
- Avant de mettre à jour l'INDEX

### 3. reclassify-autres.py
**Usage** : Re-classifier les documents dans docs/autres/

```bash
python3 scripts/reclassify-autres.py
```

**Quand l'utiliser** :
- Quand docs/autres/ a +20 fichiers
- Trimestriellement

---

## ⚠️ Pièges à Éviter

### ❌ Ne PAS faire

1. **Créer des documents à la racine du projet**
   ```
   ❌ MON-DOCUMENT.md          # À la racine
   ✅ docs/analyses/MON-DOCUMENT.md  # Dans docs/
   ```

2. **Mélanger les types dans un même document**
   ```
   ❌ ANALYSE-ET-CORRECTION-BUG.md  # Trop vague
   ✅ ANALYSE-BUG-500.md            # Analyse pure
   ✅ CORRECTION-BUG-500.md         # Correction pure
   ```

3. **Supprimer les anciennes versions**
   ```
   ❌ rm DOCUMENT-V1.md          # Perte d'historique
   ✅ Marquer comme obsolète     # Traçabilité préservée
   ```

4. **Ignorer l'INDEX.md**
   ```
    Créer un document sans l'ajouter à INDEX.md
   ✅ Toujours mettre à jour INDEX.md après ajout
   ```

### ✅ Bonnes Pratiques

1. **Utiliser les templates**
   - Voir `docs/autres/_divers/TEMPLATE-DOCUMENTATION-MODULE.md`

2. **Lier les documents connexes**
   ```markdown
   ## Voir Aussi
   - [ANALYSE-ARCHITECTURE.md](ANALYSE-ARCHITECTURE.md)
   - [IMPLEMENTATION-COMPLETE.md](IMPLEMENTATION-COMPLETE.md)
   ```

3. **Dater les documents**
   ```markdown
   ---
   Date: 2026-06-29
   Auteur: Franck
   Version: 1.0.0
   ---
   ```

---

## 📊 Structure de Référence

```
docs/
├── INDEX.md                          # Index principal ⭐
├── RAPPORT-REORGANISATION-DOCUMENTATION.md
├── GUIDE-MAINTENANCE-DOCUMENTATION.md  # Ce fichier
│
├── analyses/ (18)                    # Analyses et études
├── ameliorations/ (11)               # Améliorations
├── audits/ (3)                       # Audits
│
├── autres/                           # Documents divers
│   ├── _backup-system/ (4)
│   ├── _sessions/ (12)
│   ├── _seeds/ (9)
│   ├── _phase1/ (13)
│   ├── _multi-tenant/ (10)
│   ├── _notifications/ (9)
│   ├── _frontend/ (5)
│   └── _divers/ (30)
│
├── certifications/ (2)               # Certifications
├── checklists/ (2)                   # Checklists
├── configurations/ (4)               # Configurations
│
├── corrections/ (63)                 # Corrections et fixes
├── deploiements/ (7)                 # Déploiements
├── guides/ (29)                      # Guides et tutoriels
│
├── implementations/ (41)             # Implémentations
├── migrations/ (7)                   # Migrations
├── rapports/ (32)                    # Rapports
│
├── resumes/ (23)                     # Résumés
└── syntheses/ (11)                   # Synthèses
```

---

## 🎯 Checklist de Qualité

Avant de commiter un nouveau document :

- [ ] **Nommage** : Format `TYPE-SUJET-CONTEXTE.md` respecté ?
- [ ] **Emplacement** : Dans le bon dossier `docs/<categorie>/` ?
- [ ] **INDEX** : Ajouté dans `docs/INDEX.md` ?
- [ ] **Version** : Si V2+, V1 marqué comme obsolète ?
- [ ] **Liens** : Liens vers documents connexes ajoutés ?
- [ ] **Date** : Date de création documentée ?
- [ ] **Contenu** : Bannière eLISAschool en haut du fichier ?

---

## 📞 Support

### Problème Fréquent : "Dans quel dossier ranger mon document ?"

**Arbre de décision** :

```
Mon document décrit...
│
├─ une analyse/étude → docs/analyses/
├─ une correction → docs/corrections/
├─ une implémentation → docs/implementations/
├─ un guide/tutorial → docs/guides/
├─ un rapport → docs/rapports/
├─ une synthèse → docs/syntheses/
├─ une migration → docs/migrations/
├─ une amélioration → docs/ameliorations/
├─ une configuration → docs/configurations/
├─ un déploiement → docs/deploiements/
├─ un audit → docs/audits/
├─ une checklist → docs/checklists/
├─ une certification → docs/certifications/
├─ un résumé → docs/resumes/
└─ pas clair → docs/autres/ (puis reclasser plus tard)
```

---

**📌 Gardez ce guide à portée de main pour toute opération sur la documentation !**

---

*Dernière mise à jour : 29 juin 2026*  
*Version : 1.0.0*  
*eLISAschool - Système de Gestion Scolaire*
