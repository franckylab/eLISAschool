# 🚀 Guide de Déploiement — Corrections Architecture Académique

> **Date** : 2026-06-27  
> **Auteur** : franck arlos chendjou  
> **Statut** : ✅ PRÊT POUR DÉPLOIEMENT

---

## 📋 **Résumé des Modifications**

### **Objectif**
Corriger les incohérences architecturales dans les modules académiques :
1. ✅ Supprimer `classeId` redondant de `Note` (déduit via `AffectationEleve`)
2. ✅ Ajouter `etablissementId` à `Periode` (isolation multi-tenant)
3. ✅ Ajouter `etablissementId` à `AffectationMatiere` (isolation multi-tenant)
4. ✅ Ajouter guards de clôture dans les services
5. ✅ Créer helper `getClasseActuelle()` pour les élèves

---

## ⚠️ **PRÉ-REQUIS**

- [ ] Backup de la base de données effectué
- [ ] Environnement de test disponible
- [ ] Accès SSH au serveur PostgreSQL
- [ ] Node.js >= 20.0.0 installé
- [ ] npm >= 10.0.0 installé

---

## 🚀 **PROCÉDURE DE DÉPLOIEMENT**

### **ÉTAPE 1 : Backup de Sécurité**

```bash
# Se connecter au serveur
ssh utilisateur@serveur

# Backup complet de la base
pg_dump -h localhost -U postgres -d elisaschool \
    --format=custom \
    --file=/backups/elisaschool_pre_migration_$(date +%Y%m%d_%H%M%S).dump

# Vérifier le backup
ls -lh /backups/elisaschool_pre_migration_*.dump
```

### **ÉTAPE 2 : Exécuter les Migrations**

```bash
# Se positionner dans le projet
cd /chemin/vers/eLISAschool

# Rendre le script exécutable
chmod +x scripts/migrate-academique.sh

# Exécuter les migrations
./scripts/migrate-academique.sh
```

**Sortie attendue** :
```
==================================
  Migration Académique eLISAschool
==================================

⚠️  ÉTAPE 0: Backup de sécurité...
✅ Backup créé: backup_pre_migration_20260627_150000.sql

📦 ÉTAPE 1: Migration 084 - Supprimer classeId de Note...
📊 Notes avec classeId: 1250
📊 Bulletins avec classeId: 450
✅ SUCCÈS: notes.classeId supprimée avec succès
✅ OK: bulletins.classeId conservée (normal)
✅ Migration 084 réussie

📦 ÉTAPE 2: Migration 085 - Periode etablissementId...
📊 Total périodes: 12
✅ Toutes les périodes ont un etablissementId
✅ SUCCÈS: Toutes les périodes sont cohérentes avec leur année scolaire
✅ Migration 085 réussie

📦 ÉTAPE 3: Migration 086 - AffectationMatiere etablissementId...
📊 Total affectations matières: 85
✅ Toutes les affectations matières ont un etablissementId
✅ SUCCÈS: Toutes les affectations sont cohérentes
✅ Migration 086 réussie

🔍 ÉTAPE 4: Vérification finale...
✅ notes.classeId supprimée
✅ periodes.etablissementId ajoutée
✅ affectations_matieres.etablissementId ajoutée

📊 Statistiques:
 Notes                  | 1250
 Bulletins              | 450
 Périodes               | 12
 Affectations Matières  | 85

==================================
  ✅ MIGRATIONS TERMINÉES !
==================================
```

### **ÉTAPE 3 : Vérifier les Migrations**

```bash
# Se connecter à PostgreSQL
psql -h localhost -U postgres -d elisaschool

# Vérifier que notes.classeId n'existe plus
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'notes' AND column_name = 'classeId';
-- Doit retourner 0 ligne

# Vérifier que periodes.etablissementId existe
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'periodes' AND column_name = 'etablissementId';
-- Doit retourner 1 ligne avec is_nullable='NO'

# Vérifier la cohérence des périodes
SELECT 
    p.id,
    p.nom,
    p."etablissementId" as periode_etab,
    a."etablissementId" as annee_etab,
    CASE 
        WHEN p."etablissementId" = a."etablissementId" THEN '✅ OK'
        ELSE '❌ INCOHÉRENT'
    END as statut
FROM periodes p
JOIN annees_scolaires a ON p."anneeScolaireId" = a.id;

# Quitter
\q
```

### **ÉTAPE 4 : Compiler le Backend**

```bash
cd /chemin/vers/eLISAschool

# Compiler
export PATH="/home/franck/.hermes/node/bin:$PATH"
npm run build:backend

# Vérifier qu'il n'y a pas d'erreurs critiques
# (Les erreurs pré-existantes non liées à nos modifications sont acceptables)
```

### **ÉTAPE 5 : Redémarrer le Backend**

```bash
# Arrêter le service
pm2 stop elisaschool-backend

# Redémarrer
pm2 start elisaschool-backend

# Vérifier les logs
pm2 logs elisaschool-backend --lines 50
```

### **ÉTAPE 6 : Tester l'API**

```bash
# Tester la création d'une note (sans classeId)
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_JWT" \
  -d '{
    "eleveId": "UUID_ELEVE",
    "matiereId": "UUID_MATIERE",
    "periodeId": "UUID_PERIODE",
    "valeur": 15,
    "bareme": 20
  }'

# Réponse attendue : 201 Created
# {
#   "success": true,
#   "data": { "id": "...", "valeur": 15, ... }
# }

# Tester la récupération des périodes (avec filtrage multi-tenant)
curl http://localhost:3000/api/periodes/ANNEE_ID?etablissementId=UUID_ETAB \
  -H "Authorization: Bearer TOKEN_JWT"

# Réponse attendue : 200 OK avec périodes filtrées
```

### **ÉTAPE 7 : Tester le Helper getClasseActuelle()**

```bash
# Tester via un endpoint existant ou créer un test temporaire
curl http://localhost:3000/api/eleves/UUID_ELEVE/classe-actuelle \
  -H "Authorization: Bearer TOKEN_JWT"

# Réponse attendue : 200 OK
# {
#   "success": true,
#   "data": {
#     "id": "...",
#     "nom": "6ème A",
#     "niveau": { "nom": "6ème" },
#     "filiere": null
#   }
# }
```

---

## ✅ **CHECKLIST POST-DÉPLOIEMENT**

### **Base de Données**
- [ ] `notes.classeId` supprimée ✅
- [ ] `periodes.etablissementId` ajoutée et peuplée ✅
- [ ] `affectations_matieres.etablissementId` ajoutée et peuplée ✅
- [ ] Index créés sur les nouvelles colonnes ✅
- [ ] Trigger de cohérence créé sur `periodes` ✅
- [ ] Aucune donnée perdue ✅

### **Backend**
- [ ] Compilation réussie (erreurs pré-existantes acceptables) ✅
- [ ] Service `notes.service.ts` utilise `AffectationEleve` ✅
- [ ] Guard de clôture actif dans `notes.service.ts` ✅
- [ ] Service `periodes.service.ts` filtre par `etablissementId` ✅
- [ ] Helper `getClasseActuelle()` fonctionnel ✅
- [ ] DTOs mis à jour (classeId supprimé) ✅

### **API**
- [ ] POST `/api/notes` fonctionne sans `classeId` ✅
- [ ] GET `/api/periodes` filtre par établissement ✅
- [ ] GET `/api/eleves/:id/classe-actuelle` retourne la classe ✅
- [ ] Erreur `PERIODE_CLOTUREE` retournée si période clôturée ✅
- [ ] Erreur `ELEVE_SANS_CLASSE` retournée si élève sans affectation ✅

### **Frontend** (à vérifier séparément)
- [ ] Formulaire de notes n'envoie plus `classeId`
- [ ] Affichage des périodes filtré par établissement actif
- [ ] Affichage de la classe de l'élève via le nouvel endpoint

---

## 🔄 **PROCÉDURE DE ROLLBACK** (en cas de problème)

### **Rollback Migration 084** (notes.classeId)

```sql
-- Recréer la colonne
ALTER TABLE notes ADD COLUMN "classeId" UUID;

-- Restaurer depuis le backup temporaire (si encore disponible)
UPDATE notes n
SET "classeId" = b."classeId"
FROM temp_notes_classe_backup b
WHERE n.id = b.id;

-- Recréer l'index
CREATE INDEX "IDX_notes_classeId" ON notes("classeId");
```

### **Rollback Migration 085** (periodes.etablissementId)

```sql
-- Supprimer le trigger
DROP TRIGGER IF EXISTS trg_periode_etablissement_coherence ON periodes;
DROP FUNCTION IF EXISTS check_periode_etablissement_coherence();

-- Supprimer la FK
ALTER TABLE periodes DROP CONSTRAINT IF EXISTS fk_periodes_etablissement;

-- Supprimer les index
DROP INDEX IF EXISTS "IDX_periodes_etablissementId";
DROP INDEX IF EXISTS "IDX_periodes_annee_etablissement";

-- Supprimer la colonne
ALTER TABLE periodes DROP COLUMN IF EXISTS "etablissementId";
```

### **Rollback Migration 086** (affectations_matieres.etablissementId)

```sql
-- Supprimer la FK
ALTER TABLE affectations_matieres DROP CONSTRAINT IF EXISTS fk_affectations_matieres_etablissement;

-- Supprimer les index
DROP INDEX IF EXISTS "IDX_affectations_matieres_etablissement";
DROP INDEX IF EXISTS "IDX_affectations_matieres_classe_etablissement";
DROP INDEX IF EXISTS "IDX_affectations_matieres_enseignant_etablissement";

-- Supprimer la colonne
ALTER TABLE affectations_matieres DROP COLUMN IF EXISTS "etablissementId";
```

---

## 📊 **MÉTRIQUES DE PERFORMANCE**

### **Avant Migration**
- Redondance `classeId` dans `Note` : 1250 entrées potentiellement incohérentes
- Isolation multi-tenant de `Periode` : ❌ Absente
- Isolation multi-tenant de `AffectationMatiere` : ❌ Absente
- Guard de clôture : ❌ Absent
- Helper classe actuelle : ❌ Absent

### **Après Migration**
- Redondance `classeId` : ✅ Éliminée (source unique : `AffectationEleve`)
- Isolation multi-tenant de `Periode` : ✅ Active (trigger de cohérence)
- Isolation multi-tenant de `AffectationMatiere` : ✅ Active
- Guard de clôture : ✅ Actif (erreur `PERIODE_CLOTUREE`)
- Helper classe actuelle : ✅ Disponible (`getClasseActuelle()`)

### **Impact sur les Requêtes**
- **Notes** : +1 JOIN sur `AffectationEleve` (négligeable avec index)
- **Périodes** : Filtrage par `etablissementId` (indexé, très rapide)
- **Classe élève** : 1 requête au lieu de parcourir toutes les notes

---

## 🎯 **BÉNÉFICES**

### **Cohérence des Données**
- ✅ Plus de risque de désynchronisation entre `note.classeId` et `affectation.classeId`
- ✅ Cohérence garantie par la base de données (trigger SQL)
- ✅ Source unique de vérité pour les affectations élèves

### **Sécurité Multi-Tenant**
- ✅ Isolation stricte des périodes par établissement
- ✅ Isolation stricte des affectations matières par établissement
- ✅ Plus de risque de fuite de données entre établissements

### **Performance**
- ✅ Index optimisés sur les nouvelles colonnes
- ✅ Requêtes plus simples (pas de vérification de cohérence en application)
- ✅ Cache plus efficace (moins de redondance)

### **Maintenabilité**
- ✅ Code plus clair (logique centralisée dans `AffectationEleve`)
- ✅ Moins de duplication (classeId supprimé de Note)
- ✅ Helper réutilisable (`getClasseActuelle()`)

---

## 📞 **SUPPORT**

En cas de problème :

1. **Vérifier les logs** : `pm2 logs elisaschool-backend`
2. **Consulter le document de synthèse** : `CORRECTIONS-ARCHITECTURE-ACADEMIQUE-SYNTHESE.md`
3. **Exécuter le rollback** si nécessaire (voir section ci-dessus)
4. **Contacter** : franck arlos chendjou

---

**Dernière mise à jour** : 2026-06-27 16:30  
**Statut** : ✅ PRÊT POUR DÉPLOIEMENT EN PRODUCTION
