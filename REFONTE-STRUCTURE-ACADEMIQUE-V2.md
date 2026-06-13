# Refonte Structure Académique v2.0 - Guide de Déploiement

## 📋 Résumé des Modifications

### 1. Suppression de TypeCycle ✅
- **Entité supprimée** : `backend/src/modules/types-cycles/` (complètement retiré)
- **Frontend supprimé** : `frontend/src/features/types-cycles/` et routes associées
- **Fusion dans Cycle** : Les attributs de TypeCycle sont maintenant dans Cycle
  - `description` (TEXT)
  - `dureeAnnees` (INTEGER)
  - `diplomeSanctionnant` (VARCHAR(50))
- **Nouvelle hiérarchie** : `Cycle → Niveau → Filière → Spécialité` (au lieu de 4 niveaux avec TypeCycle)

### 2. Ajout des Filières Technologiques ✅
**10 nouvelles filières** conformes au système camerounais (MINESEC) :

| Code | Filière | Domaine |
|------|---------|---------|
| F1 | Génie Mécanique | Industriel |
| F2 | Génie Électrotechnique | Industriel |
| F3 | Génie Civil Bâtiment | Industriel |
| F4 | Génie Chimique | Industriel |
| G1 | Techniques Administratives | Tertiaire |
| G2 | Techniques Commerciales | Tertiaire |
| H | Techniques Économiques | Tertiaire |
| I | Informatique | Tertiaire |
| K | Arts Appliqués | Artistique |
| L | Hôtellerie-Restauration | Services |

### 3. Nouvelle Entité : Specialite ✅
- **Objectif** : Gérer les options/spécialisations au sein des filières techniques
- **Exemples** :
  - F1 Mécanique → option "Maintenance Automobile", "Usinage"
  - F2 Électrotechnique → option "Électronique", "Automatismes"
- **Endpoints API** :
  - `GET /api/specialites` - Liste paginée
  - `GET /api/specialites/filiere/:filiereId` - Par filière
  - `POST /api/specialites` - Créer (ADMIN/SUPER_ADMIN)
  - `PATCH /api/specialites/:id` - Modifier
  - `DELETE /api/specialites/:id` - Supprimer

### 4. Nouvelle Entité : Competence ✅
- **Objectif** : Support de l'Approche Par Compétences (APC) conforme aux programmes MINESEC
- **Structure** :
  - `code` : Identifiant unique (ex: "COMP_MATH_01")
  - `libelle` : Description de la compétence
  - `domaine` : Domaine disciplinaire (Mathématiques, Sciences, Langues...)
  - `niveauId` : Lié au niveau scolaire
  - `matiereId` : Lié à la matière (optionnel)
- **Endpoints API** :
  - `GET /api/competences` - Liste paginée
  - `GET /api/competences/niveau/:niveauId` - Par niveau
  - `GET /api/competences/matiere/:matiereId` - Par matière
  - `POST /api/competences` - Créer (ADMIN/SUPER_ADMIN)
  - `PATCH /api/competences/:id` - Modifier
  - `DELETE /api/competences/:id` - Supprimer

## 🗄️ Migration Base de Données

### Fichier de Migration
`backend/database/migrations/054-refonte-structure-academique-v2.sql`

### Modifications DB
1. **Table cycles** : Ajout de 3 colonnes, suppression de `typeCycleId`
2. **Table types_cycles** : SUPPRIMÉE
3. **Table specialites** : CRÉÉE
4. **Table competences** : CRÉÉE
5. **Seed filières** : 10 nouvelles filières technologiques

### Exécuter la Migration

```bash
# Option 1: Script automatisé
bash scripts/deploy-structure-academique-v2.sh

# Option 2: Manuellement
PGPASSWORD=votre_mot_de_passe psql -h localhost -p 5432 -U postgres -d elisaschool -f backend/database/migrations/054-refonte-structure-academique-v2.sql
```

## 📁 Fichiers Modifiés/Créés

### Backend - Modifiés
- `backend/src/modules/cycles/entities/cycle.entity.ts` - Enrichi
- `backend/src/modules/cycles/dto/cycle.dto.ts` - Enrichi
- `backend/src/modules/cycles/services/cycles.service.ts` - Simplifié
- `backend/src/database/seeds/seed-structure-academique.ts` - Refactorisé v2.0
- `backend/src/app.ts` - Ajout routes specialites/competences

### Backend - Supprimés
- `backend/src/modules/types-cycles/` (dossier complet)

### Backend - Créés
- `backend/src/modules/specialites/` (module complet: entity, dto, service, controller)
- `backend/src/modules/competences/` (module complet: entity, dto, service, controller)
- `backend/database/migrations/054-refonte-structure-academique-v2.sql`

### Frontend - Modifiés
- `frontend/src/features/cycles/types/cycle.types.ts` - Types mis à jour

### Frontend - Supprimés
- `frontend/src/features/types-cycles/` (dossier complet)
- `frontend/src/routes/_auth.types-cycles.tsx`
- `frontend/src/routes/(authenticated)/parametres/structure-academique/types-cycles.tsx`

### Scripts - Créés
- `scripts/deploy-structure-academique-v2.sh`

## 🚀 Déploiement

### Étape 1: Backup (IMPORTANT)
```bash
# Backup de la base de données
pg_dump -h localhost -p 5432 -U postgres elisaschool > backup_pre_v2_$(date +%Y%m%d).sql
```

### Étape 2: Migration DB
```bash
bash scripts/deploy-structure-academique-v2.sh
```

### Étape 3: Redémarrer Backend
```bash
cd backend
npm run dev
```

### Étape 4: Vérifier les Logs
```bash
# Vérifier qu'il n'y a pas d'erreurs de compilation
# Vérifier que les nouvelles routes sont enregistrées
```

### Étape 5: Tester les Endpoints
```bash
# Cycles (ancien + nouveau)
curl -H "Authorization: Bearer VOTRE_TOKEN" http://localhost:7000/api/cycles

# Spécialités
curl -H "Authorization: Bearer VOTRE_TOKEN" http://localhost:7000/api/specialites

# Compétences
curl -H "Authorization: Bearer VOTRE_TOKEN" http://localhost:7000/api/competences
```

## ⚠️ Points d'Attention

### Breaking Changes
1. **Route `/api/types-cycles`** : SUPPRIMÉE - utiliser `/api/cycles` à la place
2. **Structure Cycle** : Les champs `typeCycleId` et `typeCycle` n'existent plus
3. **Frontend** : Les composants utilisant TypeCycle doivent être adaptés

### Non-Breaking Changes
1. **Route `/api/cycles`** : Fonctionne toujours (enrichie)
2. **Route `/api/niveaux`** : Inchangée
3. **Route `/api/filieres`** : Inchangée (mais 10 nouvelles filières disponibles)

## 🎯 Prochaines Étapes Recommandées

### Phase Frontend (à faire)
1. Adapter les composants Cycles pour afficher les nouveaux champs
2. Créer pages CRUD pour Spécialités
3. Créer pages CRUD pour Compétences
4. Mettre à jour les formulaires de création/modification

### Phase Backend (optionnel)
1. Ajouter des seeds pour les spécialités (ex: Maintenance Auto, Électronique...)
2. Ajouter des seeds pour les compétences (selon programmes MINESEC)
3. Intégrer Competences avec le module Notes (évaluation par compétence)

## 📊 Statistiques

| Métrique | Avant v2.0 | Après v2.0 |
|----------|------------|------------|
| Tables structure académique | 6 | 7 (+1) |
| Filières Francophone | 6 | 16 (+10) |
| Modules backend | ~40 | ~42 (+2) |
| Endpoints API | ~200 | ~214 (+14) |
| Complexité hiérarchie | 4 niveaux | 3-4 niveaux |

## 📞 Support

En cas de problème :
1. Vérifier les logs backend
2. Vérifier que la migration s'est bien exécutée
3. Consulter `backend/logs/` pour les erreurs
4. Rollback : restaurer le backup pré-migration

---

**Version** : 2.0.0  
**Date** : 2026-06-13  
**Auteur** : franck arlos chendjou  
**Statut** : ✅ PRÊT POUR DÉPLOIEMENT
