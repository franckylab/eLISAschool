# Guide de Déploiement - Module Finances eLISAschool

## 📋 Prérequis

### Environnement
- ✅ PostgreSQL 16+ en cours d'exécution
- ✅ Node.js 20+ installé
- ✅ Redis 7+ (optionnel, pour cache)
- ✅ Backend eLISAschool compilé

### Variables d'environnement

Ajouter dans `.env` :

```env
# ==================================
# MODULE FINANCES
# ==================================

# Activer les cron jobs automatiques
ENABLE_CRON_JOBS=true

# Configuration Mobile Money (optionnel)
MTN_MOMO_API_KEY=your_api_key_here
MTN_MOMO_SECRET=your_secret_here
ORANGE_MONEY_API_KEY=your_api_key_here

# Clé de chiffrement pour backups (si utilisé)
BACKUP_ENCRYPTION_KEY=minimum_32_characters_long_key_here

# Seuil double validation dépenses (FCFA)
FINANCES_DOUBLE_VALIDATION_THRESHOLD=500000

# Jours de grâce par défaut
FINANCES_JOURS_GRACE_DEFAUT=8

# Pénalité retard par défaut (% par mois)
FINANCES_PENALITE_RETARD_DEFAUT=5
```

---

## 🚀 Étapes de Déploiement

### Étape 1 : Exécuter la Migration SQL

```bash
cd /home/franckylab/projets/eLISAschool/backend

# Vérifier la connexion PostgreSQL
psql -U postgres -d elisaschool -c "SELECT version();"

# Exécuter la migration
psql -U postgres -d elisaschool -f database/migrations/010-module-finances.sql

# Vérifier les tables créées
psql -U postgres -d elisaschool -c "\dt finances*"
psql -U postgres -d elisaschool -c "SELECT count(*) FROM categories_depense;"
```

**Vérification attendue** :
```
 count 
-------
    14
(1 row)
```

### Étape 2 : Compiler le Backend

```bash
# Vérifier la compilation
npm run build

# Doit afficher 0 erreurs finances
# Les erreurs existantes dans common/ sont non bloquantes
```

### Étape 3 : Démarrer le Serveur

```bash
# Mode développement (hot reload)
npm run start:dev

# OU mode production
npm run start:prod
```

**Logs attendus** :
```
✅ Connexion à la base de données établie avec succès
[Cron Finance] Initialisation des jobs planifiés...
[Cron Finance] ✅ Tous les jobs planifiés initialisés
✅ Cron jobs activés (notifications + finances)
🚀 Serveur eLISAschool démarré sur le port 3000
```

### Étape 4 : Tester l'API

```bash
# Health check
curl http://localhost:3000/api/health

# Documentation Swagger
open http://localhost:3000/api/docs
```

---

## 🧪 Tests de Validation

### Test 1 : Configuration Frais Scolarité

```bash
# 1. Obtenir un token ADMIN/COMPTABLE
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elisaschool.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 2. Récupérer IDs nécessaires
ANNEE_ID=$(curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/annees-scolaires \
  | jq -r '.data[0].id')

NIVEAU_ID=$(curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/niveaux \
  | jq -r '.data[0].id')

# 3. Configurer frais
curl -X POST http://localhost:3000/api/finances/scolarite/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"anneeScolaireId\": \"$ANNEE_ID\",
    \"niveauId\": \"$NIVEAU_ID\",
    \"fraisInscription\": 50000,
    \"fraisScolariteAnnuel\": 500000,
    \"nombreTranches\": 3,
    \"datePremiereEcheance\": \"2026-09-15\",
    \"frequenceEcheance\": \"TRIMESTRIEL\",
    \"penaliteRetard\": 5,
    \"joursGrace\": 8
  }"
```

**Réponse attendue** : `201 Created`

### Test 2 : Générer Échéancier Élève

```bash
# Récupérer un élève test
ELEVE_ID=$(curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/eleves \
  | jq -r '.data[0].id')

# Générer échéancier
curl -X POST http://localhost:3000/api/finances/echeanciers/generer/$ELEVE_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue** : 3 tranches créées

### Test 3 : Enregistrer Paiement

```bash
# Récupérer premier écheancier
ECHEANCIER_ID=$(curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/finances/echeanciers/eleve/$ELEVE_ID" \
  | jq -r '.data[0].id')

# Enregistrer paiement
curl -X POST http://localhost:3000/api/finances/paiements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"eleveId\": \"$ELEVE_ID\",
    \"echeancierId\": \"$ECHEANCIER_ID\",
    \"montant\": 166667,
    \"methodePaiement\": \"ESPECES\",
    \"observations\": \"Paiement test\"
  }"
```

**Réponse attendue** : `201 Created` avec `numeroRecu: "REC-2026-00001"`

### Test 4 : Créer Dépense

```bash
# Récupérer catégorie
CAT_ID=$(curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/finances/depenses/categories \
  | jq -r '.data[0].id')

# Créer dépense
curl -X POST http://localhost:3000/api/finances/depenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"categorieDepenseId\": \"$CAT_ID\",
    \"libelle\": \"Achat fournitures bureau\",
    \"montantHT\": 100000,
    \"tva\": 19.25,
    \"dateFacture\": \"2026-01-15\",
    \"fournisseur\": \"Papeterie Centrale\",
    \"methodePaiement\": \"VIREMENT\"
  }"
```

**Réponse attendue** : `201 Created` avec `numeroPiece: "DEP-2026-00001"`

### Test 5 : Workflow Demande de Dépense

```bash
# 1. Créer demande
DEMANDE_ID=$(curl -X POST http://localhost:3000/api/finances/depenses/demandes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categorieDepenseId": "'$CAT_ID'",
    "libelle": "Réparation climatiseur",
    "montantEstime": 150000,
    "urgence": "HAUTE",
    "justification": "Climatiseur en panne"
  }' | jq -r '.data.id')

# 2. Valider demande (avec rôle CHEF ou COMPTABLE)
curl -X PATCH http://localhost:3000/api/finances/depenses/demandes/$DEMANDE_ID/valider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision": "APPROUVEE"}'

# 3. Vérifier que dépense auto-créée
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/finances/depenses/demandes/mes
```

---

## 🔍 Vérifications Base de Données

### Vérifier les données

```sql
-- Vérifier configuration frais
SELECT count(*) as configs FROM frais_scolarite;

-- Vérifier échéanciers
SELECT count(*) as echeanciers, statut 
FROM echeanciers_paiement 
GROUP BY statut;

-- Vérifier paiements
SELECT numero_recu, montant_total, methode_paiement, date_paiement
FROM paiements
ORDER BY date_paiement DESC
LIMIT 5;

-- Vérifier reçus
SELECT numero_recu, eleve_nom, montant
FROM recus_paiement
ORDER BY date_emission DESC
LIMIT 5;

-- Vérifier dépenses
SELECT numero_piece, libelle, montant_ttc, statut
FROM depenses
ORDER BY date_facture DESC
LIMIT 10;

-- Vérifier catégories (doit afficher 14)
SELECT code, libelle, type, actif
FROM categories_depense
ORDER BY code;
```

---

## 📊 Monitoring

### Logs à surveiller

```bash
# Logs en temps réel
tail -f logs/app.log | grep -i "finance\|paiement\|depense"

# Erreurs
tail -f logs/error.log | grep -i "finance"
```

### Métriques importantes

1. **Nombre de paiements/jour**
```sql
SELECT DATE(date_paiement) as jour, count(*) as nombre, SUM(montant_total) as total
FROM paiements
WHERE date_paiement >= NOW() - INTERVAL '7 days'
GROUP BY DATE(date_paiement)
ORDER BY jour DESC;
```

2. **Impayés en retard**
```sql
SELECT count(*) as impayes, 
       SUM(montant_attendu - montant_paye) as montant_total_du
FROM echeanciers_paiement
WHERE statut IN ('EN_RETARD', 'EN_ATTENTE')
  AND date_echeance < CURRENT_DATE;
```

3. **Dépenses par catégorie (mois en cours)**
```sql
SELECT cd.libelle, count(*) as nombre, SUM(d.montant_ttc) as total
FROM depenses d
JOIN categories_depense cd ON d.categorie_depense_id = cd.id
WHERE d.date_facture >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY cd.libelle
ORDER BY total DESC;
```

---

## 🛡️ Sécurité & Permissions

### Vérifier les permissions

```sql
-- Voir permissions finances assignées au rôle COMPTABLE
SELECT p.code as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'COMPTABLE'
  AND p.code LIKE 'finances:%'
ORDER BY p.code;
```

### Tester les restrictions

```bash
# Tenter d'accéder avec rôle PARENT (doit échouer pour config)
curl -X POST http://localhost:3000/api/finances/scolarite/config \
  -H "Authorization: Bearer $TOKEN_PARENT" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Doit retourner : 403 Forbidden
```

---

## 🔄 Cron Jobs - Vérification

### Vérifier l'activation

```bash
# Dans les logs au démarrage, chercher :
grep "Cron Finance" logs/app.log

# Doit afficher :
# [Cron Finance] Initialisation des jobs planifiés...
# [Cron Finance] ✅ Tous les jobs planifiés initialisés
```

### Tester manuellement un cron job

```bash
# Dans Node.js REPL ou script
const { scolariteService } = require('./dist/modules/finances/services');

// Tester détection impayés
scolariteService.detecterImpayes('etablissement-uuid')
  .then(impayes => console.log(`${impayes.length} impayés détectés`));
```

---

## 📈 Performance

### Index à vérifier

```sql
-- Vérifier que les index existent
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN (
  'paiements', 'echeanciers_paiement', 'depenses',
  'recus_paiement', 'demandes_depense'
)
ORDER BY tablename, indexname;
```

### Optimisations recommandées

1. **Cache Redis** pour rapports financiers fréquents
2. **Partitionnement** tables `paiements` et `depenses` par année si > 100k lignes
3. **Archivage** automatique des reçus PDF > 90 jours (cron job existant)

---

## 🐛 Dépannage

### Problème : Migration échoue

```bash
# Vérifier si tables existent déjà
psql -U postgres -d elisaschool -c "\dt finances*"

# Si oui, supprimer et recréer
psql -U postgres -d elisaschool -c "DROP TABLE IF EXISTS factures_fournisseur CASCADE;"
# ... (répéter pour toutes les tables)

# Puis relancer migration
psql -U postgres -d elisaschool -f database/migrations/010-module-finances.sql
```

### Problème : Erreur de compilation

```bash
# Nettoyer cache
rm -rf dist/
npm run build

# Vérifier erreurs finances spécifiquement
npm run build 2>&1 | grep -i "finances"
```

### Problème : Cron jobs ne s'exécutent pas

```bash
# Vérifier variable d'environnement
echo $ENABLE_CRON_JOBS

# Doit être : true

# Redémarrer serveur
npm run start:dev
```

---

## ✅ Checklist Finale

- [ ] Migration SQL exécutée avec succès
- [ ] 14 catégories de dépenses créées
- [ ] Backend compile sans erreurs finances
- [ ] Serveur démarré avec cron jobs actifs
- [ ] Test configuration frais réussi
- [ ] Test génération échéancier réussi
- [ ] Test enregistrement paiement réussi
- [ ] Test création dépense réussi
- [ ] Test workflow demande réussi
- [ ] Permissions vérifiées en DB
- [ ] Logs monitorés (pas d'erreurs)
- [ ] Documentation API accessible (/api/docs)

---

## 📞 Support

En cas de problème :

1. Consulter logs : `logs/app.log` et `logs/error.log`
2. Vérifier DB : `psql -U postgres -d elisaschool`
3. Tester API : `http://localhost:3000/api/docs`
4. Consulter documentation : `docs/API-FINANCES.md`

---

**Version** : 1.0.0  
**Date** : 7 juin 2026  
**Statut** : ✅ Guide complet et testé
