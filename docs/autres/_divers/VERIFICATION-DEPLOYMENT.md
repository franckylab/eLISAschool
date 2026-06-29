# Guide de Vérification et Déploiement - Architecture Académique v2

## ✅ Résumé des Modifications

### Modules Corrigés et Consolidés

1. **ClasseAnnee** - Utilise l'entité existante dans `backend/src/modules/classes/entities/`
   - ✅ Service existant : `classes/services/classes-annees.service.ts`
   - ✅ Controller créé : `classes/controllers/classes-annees.controller.ts`
   - ✅ DTOs existants : `classes/dto/classes.dto.ts`
   - ✅ Route : `/api/classes-annees`

2. **ConfigurationMatiereClasse** - Utilise l'entité existante dans `backend/src/modules/matieres/entities/`
   - ✅ Entité existante
   - ✅ Controller créé : `matieres/controllers/configuration-matiere-classe.controller.ts`
   - ✅ DTOs existants : `matieres/dto/matieres.dto.ts`
   - ✅ Route : `/api/configuration-matiere-classe`

3. **ConfigurationScoring** - Nouveau module complet
   - ✅ Entité créée : `scoring/entities/scoring.entity.ts`
   - ✅ Service créé : `scoring/services/configuration-scoring.service.ts`
   - ✅ Controller créé : `scoring/controllers/configuration-scoring.controller.ts`
   - ✅ DTOs créés : `scoring/dto/scoring.dto.ts`
   - ✅ Route : `/api/scoring/config`

4. **Bulletin** - Modifié
   - ✅ Ajout de `classeAnneeId` avec relation vers `ClasseAnnee`

5. **EmploiDuTemps** - Modifié
   - ✅ Ajout de `affectationMatiereId` avec relation vers `AffectationMatiere`

6. **Permission RBAC** - Ajoutée
   - ✅ `notes:modifier_apres_cloture` dans `shared/src/enums/roles.enum.ts`

### Modules Supprimés (Doublons)

- ❌ `backend/src/modules/classes-annees/` → Supprimé (utilise `classes/`)
- ❌ `backend/src/modules/configuration-matiere-classe/` → Supprimé (utilise `matieres/`)

## 🚀 Procédure de Déploiement

### Étape 1 : Démarrer PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Étape 2 : Vérifier la connexion

```bash
psql -h localhost -U postgres -d elisaschool -c "SELECT version();"
```

### Étape 3 : Exécuter la Migration 088

```bash
psql -h localhost -U postgres -d elisaschool -f backend/database/migrations/088-refactorisation-architecture-academique.sql
```

**Vérifications post-migration 088 :**

```sql
-- Vérifier les tables créées
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('configurations_matieres_classes', 'classes_annees')
ORDER BY table_name;

-- Vérifier les données migrées
SELECT 
    (SELECT COUNT(*) FROM configurations_matieres_classes) as configs,
    (SELECT COUNT(*) FROM classes_annees) as classes_annees,
    (SELECT COUNT(*) FROM affectations_matieres WHERE date_debut IS NOT NULL) as affectations_updated,
    (SELECT COUNT(*) FROM affectations_eleves WHERE classe_annee_id IS NOT NULL) as affectations_eleves_migrated,
    (SELECT COUNT(*) FROM bulletins WHERE classe_annee_id IS NOT NULL) as bulletins_migrated;
```

### Étape 4 : Exécuter la Migration 089

```bash
psql -h localhost -U postgres -d elisaschool -f backend/database/migrations/089-finalisation-architecture-academique-v2.sql
```

**Vérifications post-migration 089 :**

```sql
-- Vérifier la table configurations_scoring
SELECT COUNT(*) as configs_scoring FROM configurations_scoring;

-- Vérifier la permission
SELECT code, libelle FROM permissions WHERE code = 'notes:modifier_apres_cloture';

-- Vérifier les attributions de permissions
SELECT r.code as role, p.code as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.code = 'notes:modifier_apres_cloture';

-- Vérifier les index
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
  AND tablename IN ('emploi_du_temps', 'bulletins', 'affectations_eleves', 'configurations_scoring')
ORDER BY tablename, indexname;
```

### Étape 5 : Compiler le Backend

```bash
cd backend
npm install
npm run build
```

### Étape 6 : Démarrer l'Application

```bash
cd backend
npm start
```

### Étape 7 : Tester les Endpoints

```bash
# Remplacer <TOKEN> par un token JWT valide

# 1. Tester Classes Années
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/classes-annees

# 2. Tester Configuration Matière Classe
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/configuration-matiere-classe

# 3. Tester Configuration Scoring
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/scoring/config

# 4. Tester Configuration Scoring Active
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/scoring/config/active
```

## 🔍 Vérifications de Cohérence

### Imports Vérifiés

✅ `backend/src/modules/bulletins/entities/bulletin.entity.ts`
   - Import : `import { Classe, ClasseAnnee } from '@modules/classes/entities';`

✅ `backend/src/modules/emploi-du-temps/entities/emploi-du-temps.entity.ts`
   - Import : `import { AffectationMatiere } from '@modules/matieres/entities';`

✅ `backend/src/app.ts`
   - Import : `import { classesController, classesAnneesController } from '@modules/classes';`
   - Import : `import { matieresController, configurationMatiereClasseController } from '@modules/matieres';`
   - Import : `import { configurationScoringController } from '@modules/scoring';`

✅ `backend/src/modules/index.ts`
   - Export : `export * from './classes';`
   - Export : `export * from './matieres';`
   - Export : `export * from './scoring';`

### Relations Vérifiées

```
ClasseAnnee (modules/classes/entities/classe-annee.entity.ts)
  ├─ ManyToOne → Classe
  ├─ ManyToOne → AnneeScolaire
  ├─ ManyToOne → Etablissement
  ├─ ManyToOne → MembrePersonnel (professeur principal)
  ├─ OneToMany ← AffectationEleve
  └─ OneToMany ← Bulletin

ConfigurationMatiereClasse (modules/matieres/entities/configuration-matiere-classe.entity.ts)
  ├─ ManyToOne → Matiere
  ├─ ManyToOne → Classe
  ├─ ManyToOne → AnneeScolaire
  ├─ ManyToOne → Etablissement
  └─ OneToMany ← AffectationMatiere (via configurationId)

AffectationMatiere (modules/matieres/entities/affectation-matiere.entity.ts)
  ├─ ManyToOne → ConfigurationMatiereClasse
  ├─ ManyToOne → Matiere
  ├─ ManyToOne → Classe
  ├─ ManyToOne → MembrePersonnel (enseignant)
  ├─ ManyToOne → AnneeScolaire
  ├─ ManyToOne → Etablissement
  └─ OneToMany ← EmploiDuTemps (via affectationMatiereId)

Bulletin (modules/bulletins/entities/bulletin.entity.ts)
  ├─ ManyToOne → ClasseAnnee (NOUVEAU)
  ├─ ManyToOne → Eleve
  ├─ ManyToOne → Classe (legacy)
  ├─ ManyToOne → Periode
  ├─ ManyToOne → AnneeScolaire (legacy)
  └─ ManyToOne → Etablissement

EmploiDuTemps (modules/emploi-du-temps/entities/emploi-du-temps.entity.ts)
  ├─ ManyToOne → AffectationMatiere (NOUVEAU)
  ├─ ManyToOne → Classe
  ├─ ManyToOne → Matiere
  ├─ ManyToOne → MembrePersonnel (enseignant)
  └─ ManyToOne → Salle

ConfigurationScoring (modules/scoring/entities/scoring.entity.ts)
  ├─ ManyToOne → Etablissement
  └─ ManyToOne → AnneeScolaire (optionnel)
```

## ⚠️ Points d'Attention

1. **Migration 088 - Données**
   - Les colonnes `classeAnneeId` sont nullable pour migration progressive
   - Les anciennes colonnes (`classeId`, `anneeScolaireId`) sont conservées
   - Vérifier que toutes les affectations_eleves et bulletins ont un `classeAnneeId` valide

2. **Configuration Scoring**
   - Une configuration par défaut est créée pour chaque établissement
   - La configuration est globale (sans année scolaire) par défaut
   - Le service utilise un fallback intelligent : config spécifique → config globale

3. **Permissions RBAC**
   - La permission `notes:modifier_apres_cloture` est attribuée à ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT
   - Vérifier les attributions après migration

## 📊 Métriques de l'Implémentation

- **Entités modifiées** : 2 (Bulletin, EmploiDuTemps)
- **Controllers créés** : 2 (ClassesAnnees, ConfigurationMatiereClasse)
- **Nouveau module complet** : 1 (ConfigurationScoring)
- **Nouvelle permission** : 1
- **Migrations SQL** : 2 (088, 089)
- **Nouvelles routes API** : ~15
- **Modules supprimés (doublons)** : 2
- **Incohérences corrigées** : 5

## ✅ Checklist Finale

- [x] Vérifier et corriger les incohérences de modules
- [x] Créer les controllers manquants
- [x] Supprimer les modules dupliqués
- [x] Vérifier toutes les entités et relations
- [x] Corriger les imports dans app.ts
- [x] Mettre à jour les exports dans modules/index.ts
- [x] Créer les migrations SQL
- [x] Créer les scripts de déploiement
- [ ] Exécuter migration 088 (manuel)
- [ ] Exécuter migration 089 (manuel)
- [ ] Compiler le backend (manuel)
- [ ] Tester les endpoints (manuel)

## 🎯 Prochaines Étapes

1. Exécuter les migrations SQL (voir procédure ci-dessus)
2. Compiler et démarrer le backend
3. Tester tous les endpoints API
4. Mettre à jour le frontend pour utiliser les nouvelles relations
5. Vérifier les performances avec les nouveaux index
