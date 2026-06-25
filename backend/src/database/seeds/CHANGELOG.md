# 📝 Changelog - Seeds eLISAschool

## Version 5.0.0 (2026-01-21)

### 🎉 Nouveautés

#### 1. Nouveau Seed: Années Scolaires
- **Fichier:** `seed-annees-scolaires.ts`
- **Version:** 1.0.0
- **Description:** Crée 3 années scolaires (2024-2025, 2025-2026, 2026-2027)
- **Fonctionnalités:**
  - Support multi-tenant avec `etablissementId`
  - Retourne l'ID de l'année active
  - Idempotent (vérifie l'existence avant création)
  - Exécution standalone possible

#### 2. Nouveau Seed: Élèves Exemples
- **Fichier:** `seed-eleves-exemples.ts`
- **Version:** 1.0.0
- **Description:** Crée 34 élèves exemples répartis dans différentes classes
- **Fonctionnalités:**
  - 34 élèves réalistes (noms camerounais et anglophones)
  - Répartis dans 14 classes différentes
  - Primaire, Collège et Lycée (Francophone et Anglophone)
  - Crée automatiquement les utilisateurs associés
  - Met à jour les effectifs des classes
  - Mot de passe par défaut: `Test123456!`

#### 3. Nouveau Seed: Matières-Niveaux
- **Fichier:** `seed-matieres-niveaux.ts`
- **Version:** 1.0.0
- **Description:** Associe les matières aux niveaux avec coefficients et horaires
- **Fonctionnalités:**
  - Configuration complète pour ~100 associations
  - Coefficients conformes au système camerounais
  - Volumes horaires en minutes
  - Support Francophone et Anglophone
  - Couvre: CM1, CM2, 6ème, 3ème, Terminale, STD6, FORM1, FORM5, UPPER6

### 🔄 Modifications

#### seed-classes-par-defaut.ts (v2.0.0 → v3.0.0)
- **Changements:**
  - Correction de l'import de `AnneeScolaire`
  - Ajout de l'import dynamique dans l'exécution standalone
  - Documentation mise à jour
  - Version bumpée à 3.0.0

#### seed-matieres.ts (v1.0.0 → v2.0.0)
- **Changements:**
  - Ajout de 2 nouvelles matières: Technologie, Sciences Économiques
  - Total: 15 matières au lieu de 13
  - Amélioration de la documentation
  - Version bumpée à 2.0.0

#### initial.seed.ts (v4.0.0 → v5.0.0)
- **Changements majeurs:**
  - Réorganisation complète de l'ordre d'exécution
  - Ajout des nouveaux seeds dans le pipeline
  - Meilleure gestion des dépendances entre seeds
  
**Nouvel ordre d'exécution:**
1. Établissements (2 établissements)
2. Structure académique (cycles, niveaux, filières)
3. **Années scolaires** (3 années) ← NOUVEAU
4. Classes (1 par niveau, avec année scolaire active)
5. **Matières** (15 matières) ← MIS À JOUR
6. **Matières-Niveaux** (coefficients) ← NOUVEAU
7. Configuration (modules, paramètres)
8. RBAC (rôles, permissions)
9. Super Admin
10. Groupes d'établissements
11. Chef établissement secondaire
12. Utilisateurs par rôle (38 utilisateurs)
13. **Élèves exemples** (34 élèves) ← NOUVEAU

### 📊 Statistiques

#### Données créées (par établissement)
| Entité | Ancien | Nouveau | Différence |
|--------|--------|---------|------------|
| Établissements | 2 | 2 | 0 |
| Cycles | 4 | 4 | 0 |
| Niveaux | 28 | 28 | 0 |
| Filières | 16 | 16 | 0 |
| Spécialités | 34 | 34 | 0 |
| Examens | 7 | 7 | 0 |
| Compétences | 28 | 28 | 0 |
| **Années scolaires** | **0** | **3** | **+3** ✨ |
| Classes | 34 | 34 | 0 |
| **Matières** | **13** | **15** | **+2** ✨ |
| **Matières-Niveaux** | **0** | **~100** | **+~100** ✨ |
| Utilisateurs | 39 | 39 | 0 |
| **Élèves** | **0** | **34** | **+34** ✨ |

#### Total global (2 établissements + données partagées)
- **Établissements:** 2
- **Structures académiques:** 2 × (4 + 28 + 16 + 34 + 7 + 28) = 234 entités
- **Années scolaires:** 2 × 3 = 6
- **Classes:** 2 × 34 = 68
- **Matières:** 2 × 15 = 30
- **Matières-Niveaux:** 2 × ~100 = ~200
- **Utilisateurs:** 39 (1 super admin + 38 test)
- **Élèves:** 34 (uniquement ETAB-001)

**Total estimé:** ~400+ entités créées

### 🐛 Corrections

1. **Import AnneeScolaire:**
   - Problème: Import manquant dans `seed-classes-par-defaut.ts`
   - Solution: Ajout de l'import dynamique

2. **Structure MatiereNiveau:**
   - Problème: Utilisation de champs inexistants (`etablissementId`, `horaireHebdomadaire`)
   - Solution: Utilisation des champs corrects (`volumeHoraire`, `obligatoire`)

3. **Ordre d'exécution:**
   - Problème: Les classes étaient créées avant les années scolaires
   - Solution: Réorganisation pour créer les années scolaires d'abord

### 📚 Documentation

- **Nouveau fichier:** `README.md` dans `backend/src/database/seeds/`
- **Contenu:**
  - Liste complète des seeds
  - Guide d'exécution
  - Ordre recommandé
  - Données créées
  - Configuration requise
  - Dépannage
  - Conventions de développement

### ⚠️ Breaking Changes

**Aucun breaking change** - Tous les changements sont additifs et rétrocompatibles.

### 🚀 Migration

Pour utiliser la nouvelle version:

```bash
# 1. Pull les changements
git pull

# 2. Installer les dépendances (si nécessaire)
cd backend && npm install

# 3. Exécuter les seeds
npm run seed

# Ou pour un reset complet:
# - Supprimer la base de données
# - Recréer la base
# - Exécuter npm run seed
```

### 🎯 Prochaines Améliorations (Roadmap)

- [ ] Seed pour les notes et bulletins
- [ ] Seed pour l'emploi du temps
- [ ] Seed pour les absences
- [ ] Seed pour les finances (paiements, frais)
- [ ] Seed pour la cantine
- [ ] Seed pour le transport
- [ ] Données de test plus réalistes (photos, adresses complètes)
- [ ] Support pour d'autres pays (pas seulement Cameroun)
- [ ] Seeds configurables via JSON/YAML

### 🙏 Remerciements

- Architecture multi-tenant robuste
- Système de seeds idempotents
- Logging détaillé pour le debugging
- Documentation complète

---

## Historique des Versions

### Version 4.0.0
- Seed des établissements, structure académique, classes
- Configuration, RBAC, utilisateurs
- Super admin et groupes d'établissements

### Version 3.0.0
- Amélioration du support multi-tenant
- Correction des incohérences de seeds
- Meilleure gestion des erreurs

### Version 2.0.0
- Migration vers l'architecture multi-tenant
- Refonte complète des seeds
- Ajout de `etablissementId` partout

### Version 1.0.0
- Première version des seeds
- Données de base pour le développement
