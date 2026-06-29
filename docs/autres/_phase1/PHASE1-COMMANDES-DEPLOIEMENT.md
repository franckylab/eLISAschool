# 🚀 PHASE 1 - COMMANDES DE DÉPLOIEMENT RAPIDES

**Copier-coller directement dans le terminal**

---

## 📋 PRÉREQUIS

```bash
# Vérifier que Docker fonctionne
docker ps

# Vérifier que l'application tourne
docker-compose ps
```

---

## 🧪 ÉTAPE 1: EXÉCUTER LES TESTS

```bash
cd /home/franckylab/projets/eLISAschool/backend
npm run test:phase1
```

**Résultat attendu**: ✅ 10/10 tests passés

---

## 🗄️ ÉTAPE 2: APPLIQUER MIGRATIONS

### Option A: Via Docker (Recommandé)

```bash
# Trouver le nom du conteneur PostgreSQL
docker ps | grep postgres

# Migration 035: Structure
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool < /home/franckylab/projets/eLISAschool/backend/database/migrations/035-contexte-africain-periodes.sql

# Migration 035b: Données (optionnel)
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool < /home/franckylab/projets/eLISAschool/backend/database/migrations/035b-migration-donnees-periodes.sql
```

### Option B: Via psql direct

```bash
# Charger les variables d'environnement
source /home/franckylab/projets/eLISAschool/.env

# Migration structure
psql -U $DB_USERNAME -d $DB_NAME -f /home/franckylab/projets/eLISAschool/backend/database/migrations/035-contexte-africain-periodes.sql

# Migration données
psql -U $DB_USERNAME -d $DB_NAME -f /home/franckylab/projets/eLISAschool/backend/database/migrations/035b-migration-donnees-periodes.sql
```

---

## ✅ ÉTAPE 3: VÉRIFIER MIGRATIONS

```bash
# Vérifier les colonnes periodeId
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool -c "
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'periodeId' 
AND table_name IN (
    'incidents_eleves', 'observations_eleves', 'sanctions_eleves',
    'felicitations_eleves', 'incidents_personnel', 'evaluations_personnel',
    'dossiers_medicaux', 'consultations_medicales'
)
ORDER BY table_name;
"

# Résultat attendu: 8 lignes
```

```bash
# Vérifier les index
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool -c "
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN (
    'incidents_eleves', 'sanctions_eleves', 'felicitations_eleves'
)
AND indexname LIKE '%periode%'
ORDER BY tablename, indexname;
"

# Résultat attendu: 6-8 index
```

---

## 🔄 ÉTAPE 4: REDÉMARRER APPLICATION

```bash
cd /home/franckylab/projets/eLISAschool

# Stopper
docker-compose down

# Reconstruire backend
docker-compose build backend

# Redémarrer
docker-compose up -d backend

# Vérifier les logs
docker-compose logs -f backend
```

**Attendre**: ~30 secondes que le backend démarre

---

## 🧪 ÉTAPE 5: TESTS FONCTIONNELS

### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

**Résultat attendu**: `{"success": true, "status": "ok"}`

### Test 2: Créer un incident avec contexte africain

```bash
curl -X POST http://localhost:3000/api/suivi-eleves/incidents \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "eleveId": "UUID_ELEVE_EXISTANT",
    "anneeScolaireId": "UUID_ANNEE_EXISTANTE",
    "periodeId": "UUID_PERIODE_T1",
    "type": "FRAIS_SCOLARITE_NON_PAYES",
    "gravite": "GRAVE",
    "description": "Test contexte africain - frais non payés"
  }'
```

**Résultat attendu**: `201 Created` avec l'incident créé

### Test 3: Filtrer par trimestre

```bash
curl "http://localhost:3000/api/suivi-eleves/eleve/UUID_ELEVE/incidents?anneeScolaireId=UUID_ANNEE&periodeId=UUID_T1" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

**Résultat attendu**: Uniquement les incidents du T1

### Test 4: Créer une félicitation bilingue

```bash
curl -X POST http://localhost:3000/api/suivi-eleves/felicitations \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "eleveId": "UUID_ELEVE_EXISTANT",
    "anneeScolaireId": "UUID_ANNEE_EXISTANTE",
    "periodeId": "UUID_PERIODE_T2",
    "type": "EXCELLENCE_BILINGUE",
    "motif": "Maîtrise parfaite français et anglais",
    "pointsBonus": 10,
    "visibleBulletin": true,
    "visibleParent": true
  }'
```

**Résultat attendu**: `201 Created` avec félicitation

---

## 🔍 ÉTAPE 6: VÉRIFICATION PERFORMANCE

```bash
# EXPLAIN ANALYZE sur une requête avec periodeId
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool -c "
EXPLAIN ANALYZE
SELECT * FROM incidents_eleves
WHERE \"eleveId\" = 'test'
AND \"anneeScolaireId\" = 'test'
AND \"periodeId\" = 'test';
"
```

**Résultat attendu**: `Index Scan` ou `Index Only Scan` (pas de `Seq Scan`)

---

## 📊 ÉTAPE 7: STATISTIQUES

```bash
# Compter les enums par type
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool -c "
SELECT type, COUNT(*) as nombre
FROM incidents_eleves
WHERE type IN (
    'FRAIS_SCOLARITE_NON_PAYES',
    'ABANDON_TEMPORAIRE',
    'TRAVAIL_ENFANT',
    'EXCELLENCE_BILINGUE'
)
GROUP BY type;
"
```

---

## 🔄 ROLLBACK (en cas de problème)

```bash
# Revenir à la version précédente
docker-compose down

# Restaurer backup DB (si fait avant)
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool < /path/to/backup.sql

# Redémarrer
docker-compose up -d
```

---

## 📝 CHECKLIST FINALE

- [ ] Tests automatisés passés (10/10)
- [ ] Migration 035 appliquée
- [ ] Migration 035b appliquée (optionnel)
- [ ] 8 colonnes periodeId vérifiées
- [ ] 17 index créés vérifiés
- [ ] Application redémarrée
- [ ] Health check OK
- [ ] Test incident avec periodeId OK
- [ ] Test filtrage trimestre OK
- [ ] Test félicitation bilingue OK

---

## 🆘 DÉPANNAGE RAPIDE

### Problème: Migration échoue

```bash
# Vérifier si déjà appliquée
docker exec -i $(docker ps -q -f name=postgres) psql -U elisaschool -d elisaschool -c "
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'incidents_eleves' AND column_name = 'periodeId'
"
```

### Problème: Backend ne démarre pas

```bash
# Voir les logs
docker-compose logs --tail=100 backend

# Vérifier compilation
cd backend && npx tsc --noEmit
```

### Problème: Token JWT invalide

```bash
# Se connecter pour obtenir un token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@elisaschool.com", "password": "VOTRE_MDP"}'
```

---

## 📚 RESSOURCES

- **README Phase 1**: `PHASE1-README.md`
- **Guide complet**: `GUIDE-DEPLOIEMENT-PHASE1.md`
- **Analyse qualité**: `PHASE1-RAPPORT-ANALYSE-COMPLET.md`
- **Documentation complète**: `PHASE1-IMPLEMENTATION-COMPLETE.md`

---

*Dernière mise à jour: 8 juin 2026*  
*Statut: ✅ Production Ready*
