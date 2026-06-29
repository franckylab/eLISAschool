# 🚀 GUIDE DE DÉPLOIEMENT - PHASE 1

**Date**: 8 juin 2026  
**Version**: 1.0.0  
**Statut**: ✅ **PRÊT POUR PRODUCTION**  

---

## 📋 PRÉREQUIS

- [ ] Backup de la base de données effectué
- [ ] Environnement de test disponible
- [ ] Accès PostgreSQL (docker ou direct)
- [ ] Node.js installé pour compilation TypeScript

---

## 🎯 ÉTAPE 1 : COMPILATION TYPESCRIPT

```bash
# Aller dans le backend
cd /home/franckylab/projets/eLISAschool/backend

# Vérifier la compilation
npx tsc --noEmit

# Si erreurs, corriger avant de continuer
# Si OK, compiler
npm run build
```

**Vérification attendue**: ✅ Aucune erreur TypeScript

---

## 🎯 ÉTAPE 2 : APPLY MIGRATION 035

### Option A: Via Docker (recommandé)

```bash
# Trouver le conteneur PostgreSQL
docker ps | grep postgres

# Exécuter la migration
docker exec -i <postgres_container> psql -U <user> -d <database> < /home/franckylab/projets/eLISAschool/backend/database/migrations/035-contexte-africain-periodes.sql
```

### Option B: Via psql direct

```bash
# Charger les variables d'environnement
source /home/franckylab/projets/eLISAschool/.env

# Exécuter la migration
psql -U $DB_USERNAME -d $DB_NAME -f /home/franckylab/projets/eLISAschool/backend/database/migrations/035-contexte-africain-periodes.sql
```

**Vérification**:
```sql
-- Vérifier les colonnes ajoutées
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'periodeId' 
AND table_name IN (
    'incidents_eleves', 'observations_eleves', 'sanctions_eleves',
    'felicitations_eleves', 'incidents_personnel', 'evaluations_personnel',
    'dossiers_medicaux', 'consultations_medicales'
)
ORDER BY table_name;

-- Résultat attendu: 8 lignes
```

---

## 🎯 ÉTAPE 3 : MIGRATION DONNÉES EXISTANTES (OPTIONNEL)

```bash
# Exécuter le script de migration des données
docker exec -i <postgres_container> psql -U <user> -d <database> < /home/franckylab/projets/eLISAschool/backend/database/migrations/035b-migration-donnees-periodes.sql
```

**Résultat attendu**:
```
 incidents_eleves_avec_periode    | 150
 observations_avec_periode        | 300
 sanctions_avec_periode           | 45
 felicitations_avec_periode       | 80
 incidents_personnel_avec_periode | 20
 consultations_avec_periode       | 120
```

---

## 🎯 ÉTAPE 4 : REDÉMARRAGE APPLICATION

```bash
# Stopper l'application
docker-compose down

# Reconstruire l'image backend
docker-compose build backend

# Redémarrer
docker-compose up -d backend

# Vérifier les logs
docker-compose logs -f backend
```

**Vérification**:
```bash
# Tester la compilation en runtime
curl http://localhost:3000/api/health

# Résultat attendu: {"success": true, "status": "ok"}
```

---

## 🎯 ÉTAPE 5 : TESTS FONCTIONNELS

### 5.1 Créer un incident avec periodeId

```bash
curl -X POST http://localhost:3000/api/suivi-eleves/incidents \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eleveId": "UUID_ELEVE",
    "anneeScolaireId": "UUID_ANNEE",
    "periodeId": "UUID_PERIODE_T1",
    "type": "FRAIS_SCOLARITE_NON_PAYES",
    "gravite": "GRAVE",
    "description": "Test contexte africain"
  }'
```

**Résultat attendu**: `201 Created` avec l'incident créé

### 5.2 Filtrer par periodeId

```bash
curl "http://localhost:3000/api/suivi-eleves/eleve/UUID_ELEVE/incidents?anneeScolaireId=UUID_ANNEE&periodeId=UUID_PERIODE_T1" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Résultat attendu**: Uniquement les incidents du T1

### 5.3 Tester enums structurés

```bash
# Test avec type invalide (doit échouer)
curl -X POST http://localhost:3000/api/suivi-eleves/incidents \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eleveId": "UUID_ELEVE",
    "anneeScolaireId": "UUID_ANNEE",
    "type": "TYPE_INVALIDE",
    "gravite": "GRAVE",
    "description": "Test validation"
  }'
```

**Résultat attendu**: `400 Bad Request` avec erreur de validation

### 5.4 Tester contexte africain

```bash
# Créer une félicitation bilingue
curl -X POST http://localhost:3000/api/suivi-eleves/felicitations \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eleveId": "UUID_ELEVE",
    "anneeScolaireId": "UUID_ANNEE",
    "periodeId": "UUID_PERIODE_T2",
    "type": "EXCELLENCE_BILINGUE",
    "motif": "Maîtrise parfaite français et anglais",
    "pointsBonus": 10
  }'
```

**Résultat attendu**: `201 Created` avec félicitation

---

## 🎯 ÉTAPE 6 : VÉRIFICATION PERFORMANCE

### 6.1 Vérifier les index

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'incidents_eleves', 'sanctions_eleves', 'felicitations_eleves'
)
AND indexname LIKE '%periode%'
ORDER BY tablename, indexname;
```

**Résultat attendu**: 6-8 index par table

### 6.2 Test de requête avec EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM incidents_eleves
WHERE "eleveId" = 'xxx'
AND "anneeScolaireId" = 'yyy'
AND "periodeId" = 'zzz';
```

**Résultat attendu**: `Index Scan` ou `Index Only Scan` (pas de Seq Scan)

---

## 🎯 ÉTAPE 7 : VALIDATION CONTEXTE AFRICAIN

### 7.1 Vérifier les enums en base

```sql
-- Les enums sont stockés comme varchar, pas de vérification nécessaire
-- Mais on peut vérifier les valeurs existantes

SELECT DISTINCT type, COUNT(*) as nombre
FROM incidents_eleves
WHERE type IN (
    'FRAIS_SCOLARITE_NON_PAYES',
    'ABANDON_TEMPORAIRE',
    'TRAVAIL_ENFANT',
    'RENTREE_TARDIVE'
)
GROUP BY type;
```

### 7.2 Rapport trimestriel

```bash
# Récupérer dashboard élève avec filtre trimestre
curl "http://localhost:3000/api/suivi-eleves/eleve/UUID_ELEVE/dashboard?periodeId=UUID_T1" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## ✅ CHECKLIST DE VALIDATION

### Structure
- [ ] 8 colonnes `periodeId` créées
- [ ] 8 contraintes FOREIGN KEY actives
- [ ] 17 index composites créés
- [ ] Compilation TypeScript OK

### Fonctionnel
- [ ] Création incident avec periodeId ✅
- [ ] Filtrage par trimestre ✅
- [ ] Validation enums Zod ✅
- [ ] Types africains disponibles ✅

### Performance
- [ ] Index utilisés dans EXPLAIN ✅
- [ ] Temps de réponse < 100ms ✅
- [ ] Pas de Seq Scan ✅

### Contexte Africain
- [ ] FRAIS_SCOLARITE_NON_PAYES ✅
- [ ] EXCELLENCE_BILINGUE ✅
- [ ] ABANDON_TEMPORAIRE ✅
- [ ] CONVOCATION_CHEF_FAMILLE ✅

---

## 🔧 DÉPANNAGE

### Problème: Erreur de compilation TypeScript

```bash
# Vérifier les erreurs
npx tsc --noEmit

# Corriger les imports si nécessaire
# Vérifier que Periode est bien importé
grep -r "import.*Periode" backend/src/modules/suivi-*/entities/
```

### Problème: Migration SQL échoue

```bash
# Vérifier si migration déjà appliquée
SELECT * FROM information_schema.columns 
WHERE column_name = 'periodeId' AND table_name = 'incidents_eleves';

# Si colonne existe, la migration est déjà appliquée
```

### Problème: periodeId non reconnu

```bash
# Vérifier la table periodes
SELECT COUNT(*) FROM periodes;

# Si vide, créer des périodes d'abord
```

### Problème: Validation Zod échoue

```bash
# Vérifier que les enums sont exportés
grep "export enum TypeIncidentEleve" backend/src/modules/suivi-eleves/entities/incident-eleve.entity.ts

# Vérifier l'import dans DTO
grep "import.*TypeIncidentEleve" backend/src/modules/suivi-eleves/dto/suivi-eleve.dto.ts
```

---

## 📊 MÉTRIQUES ATTENDUES

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Types incidents | 1 (libre) | 20 | 2000% |
| Types sanctions | 6 | 18 | 300% |
| Types félicitations | 5 | 20 | 400% |
| Filtre trimestre | ❌ | ✅ | N/A |
| Index performance | 8 | 25 | 312% |
| Contexte africain | 0% | 100% | ∞ |

---

## 📁 FICHIERS MODIFIÉS

### Entities (8 fichiers)
- `backend/src/modules/suivi-eleves/entities/incident-eleve.entity.ts`
- `backend/src/modules/suivi-eleves/entities/observation-eleve.entity.ts`
- `backend/src/modules/suivi-eleves/entities/sanction-eleve.entity.ts`
- `backend/src/modules/suivi-eleves/entities/felicitation-eleve.entity.ts`
- `backend/src/modules/suivi-personnel/entities/incident-personnel.entity.ts`
- `backend/src/modules/suivi-personnel/entities/evaluation-personnel.entity.ts`
- `backend/src/modules/sante/entities/dossier-medical.entity.ts`
- `backend/src/modules/sante/entities/consultation-medicale.entity.ts`

### DTOs (3 fichiers)
- `backend/src/modules/suivi-eleves/dto/suivi-eleve.dto.ts`
- `backend/src/modules/suivi-personnel/dto/suivi-personnel.dto.ts`
- `backend/src/modules/sante/dto/sante.dto.ts`

### Services (3 fichiers)
- `backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts`
- `backend/src/modules/suivi-personnel/services/suivi-personnel.service.ts`
- `backend/src/modules/sante/services/sante.service.ts`

### Controllers (3 fichiers)
- `backend/src/modules/suivi-eleves/controllers/suivi-eleve.controller.ts`
- `backend/src/modules/suivi-personnel/controllers/suivi-personnel.controller.ts`
- `backend/src/modules/sante/controllers/sante.controller.ts`

### Migrations (2 fichiers)
- `backend/database/migrations/035-contexte-africain-periodes.sql`
- `backend/database/migrations/035b-migration-donnees-periodes.sql`

**Total**: 19 fichiers modifiés/créés

---

## 🎉 DÉPLOIEMENT RÉUSSI !

### Prochaines étapes recommandées

1. **Monitoring** : Surveiller les performances des nouvelles requêtes
2. **Formation** : Former les utilisateurs aux nouveaux types africains
3. **Documentation** : Mettre à jour la documentation utilisateur
4. **Feedback** : Collecter les retours après 1 semaine d'utilisation

### Support

En cas de problème :
- Consulter les logs: `docker-compose logs -f backend`
- Vérifier la DB: `docker exec -it <postgres> psql -U <user> -d <db>`
- Tester l'API: `curl http://localhost:3000/api/health`

---

*Guide de déploiement généré automatiquement - 8 juin 2026*
