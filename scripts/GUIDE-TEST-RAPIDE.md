# 🚀 Guide de Test Rapide - Module Finances eLISAschool

## ✅ État Actuel du Déploiement

### Base de Données
- ✅ **11 tables finances** créées et vérifiées
- ✅ **14 catégories OHADA** seedées
- ✅ **1 établissement test** créé
- ✅ **Triggers et indexes** actifs

### Backend
- ✅ **Serveur démarré** sur port 3000
- ✅ **API Health** opérationnelle
- ✅ **Routes finances** enregistrées
- ✅ **0 erreurs compilation**

### Pré-requis pour Tests
- ⚠️ **Aucun utilisateur** en base (nécessaire pour authentification)
- ⚠️ **Aucun élève** en base (nécessaire pour scolarité)

---

## 📋 Étapes pour Tester le Module

### Étape 1 : Créer un Utilisateur Admin

**Option A : Via Swagger UI (Recommandé)**

1. Ouvrir : http://localhost:3000/api/docs
2. Chercher endpoint : `POST /api/auth/register`
3. Cliquer "Try it out"
4. Entrer le body :
```json
{
  "email": "admin@elisaschool.com",
  "motDePasse": "Admin123!",
  "role": "SUPER_ADMIN",
  "nom": "Admin",
  "prenom": "Test"
}
```
5. Cliquer "Execute"
6. Noter le token retourné

**Option B : Via curl**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elisaschool.com",
    "motDePasse": "Admin123!",
    "role": "SUPER_ADMIN",
    "nom": "Admin",
    "prenom": "Test"
  }'
```

### Étape 2 : Se Connecter

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elisaschool.com",
    "motDePasse": "Admin123!"
  }'

# Sauvegarder le token
TOKEN="votre_token_ici"
```

### Étape 3 : Tester les Catégories de Dépenses

```bash
# Récupérer les 14 catégories OHADA
curl http://localhost:3000/api/finances/depenses/categories \
  -H "Authorization: Bearer $TOKEN"

# Doit retourner 14 catégories
```

### Étape 4 : Créer une Année Scolaire

```bash
curl -X POST http://localhost:3000/api/annees-scolaires \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "libelle": "2025-2026",
    "dateDebut": "2025-09-01",
    "dateFin": "2026-07-31",
    "active": true
  }'
```

### Étape 5 : Configurer Frais Scolarité

```bash
# Remplacer {anneeId} et {niveauId} par les IDs réels
curl -X POST http://localhost:3000/api/finances/scolarite/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "anneeScolaireId": "{anneeId}",
    "niveauId": "{niveauId}",
    "fraisInscription": 50000,
    "fraisScolariteAnnuel": 500000,
    "nombreTranches": 3,
    "datePremiereEcheance": "2026-09-15",
    "frequenceEcheance": "TRIMESTRIEL",
    "penaliteRetard": 5,
    "joursGrace": 8
  }'
```

### Étape 6 : Créer une Dépense

```bash
# Récupérer ID d'une catégorie
CAT_ID=$(curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/finances/depenses/categories \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['id'])")

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

### Étape 7 : Workflow Demande de Dépense

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
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])")

echo "Demande créée: $DEMANDE_ID"

# 2. Valider demande
curl -X PATCH http://localhost:3000/api/finances/depenses/demandes/$DEMANDE_ID/valider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision": "APPROUVEE"}'

# 3. Vérifier que dépense auto-créée
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/finances/depenses/demandes/mes
```

---

## 🧪 Tests Automatisés

### Script Complet

```bash
# Rendre exécutable
chmod +x scripts/test-finance-module.sh

# Exécuter (après avoir créé un utilisateur admin)
export ADMIN_EMAIL="admin@elisaschool.com"
export ADMIN_PASSWORD="Admin123!"
./scripts/test-finance-module.sh
```

### Ce que le script teste :

1. ✅ Authentification
2. ✅ Configuration frais scolarité
3. ✅ Génération échéancier élève
4. ✅ Enregistrement paiement
5. ✅ Consultation reçu
6. ✅ Catégories de dépenses
7. ✅ Création dépense
8. ✅ Workflow demande
9. ✅ Détection impayés

---

## 📊 Vérification Base de Données

### Compter les données

```bash
docker exec -i elisaschool_postgres_dev psql -U elisaschool_user -d elisaschool << 'EOF'
-- Tables finances
SELECT 'frais_scolarite' as table_name, count(*) FROM frais_scolarite
UNION ALL
SELECT 'echeanciers_paiement', count(*) FROM echeanciers_paiement
UNION ALL
SELECT 'paiements', count(*) FROM paiements
UNION ALL
SELECT 'recus_paiement', count(*) FROM recus_paiement
UNION ALL
SELECT 'relances_paiement', count(*) FROM relances_paiement
UNION ALL
SELECT 'remises', count(*) FROM remises
UNION ALL
SELECT 'categories_depense', count(*) FROM categories_depense
UNION ALL
SELECT 'depenses', count(*) FROM depenses
UNION ALL
SELECT 'demandes_depense', count(*) FROM demandes_depense
UNION ALL
SELECT 'bons_commande', count(*) FROM bons_commande
UNION ALL
SELECT 'factures_fournisseur', count(*) FROM factures_fournisseur
ORDER BY table_name;
EOF
```

### Vérifier catégories OHADA

```bash
docker exec -i elisaschool_postgres_dev psql -U elisaschool_user -d elisaschool -c "
SELECT code, libelle, type, \"compteComptableCharge\" 
FROM categories_depense 
ORDER BY code;"
```

---

## 🔍 Monitoring & Logs

### Logs Backend

```bash
# Logs en temps réel
docker logs -f elisaschool_backend_dev | grep -i "finance"

# Dernières erreurs
docker logs elisaschool_backend_dev 2>&1 | grep -i "error" | tail -20
```

### Vérifier Cron Jobs

```bash
docker logs elisaschool_backend_dev 2>&1 | grep "Cron Finance"

# Doit afficher :
# [Cron Finance] Initialisation des jobs planifiés...
# [Cron Finance] ✅ Tous les jobs planifiés initialisés
```

---

## 🐛 Dépannage

### Problème : Utilisateur n'existe pas

**Solution** : Créer via Swagger ou curl (voir Étape 1)

### Problème : Élève n'existe pas

**Solution** : 
1. Créer un niveau via `/api/niveaux`
2. Créer une classe via `/api/classes`
3. Créer un élève via `/api/eleves`

### Problème : Erreur 403 Forbidden

**Cause** : Permissions insuffisantes  
**Solution** : Utiliser un compte SUPER_ADMIN ou COMPTABLE

### Problème : Erreur 500 Internal Server Error

**Solution** :
```bash
# Vérifier logs
docker logs elisaschool_backend_dev 2>&1 | tail -50

# Redémarrer backend
docker restart elisaschool_backend_dev
```

---

## ✅ Checklist de Validation

- [ ] Utilisateur admin créé
- [ ] Login réussi avec token
- [ ] 14 catégories récupérées
- [ ] Année scolaire créée
- [ ] Frais scolarité configurés
- [ ] Échéancier généré
- [ ] Paiement enregistré
- [ ] Reçu consulté
- [ ] Dépense créée
- [ ] Demande validée
- [ ] Workflow complet testé
- [ ] Cron jobs actifs
- [ ] Logs propres

---

## 📚 Documentation Complète

- **API Reference** : http://localhost:3000/api/docs
- **Documentation** : [docs/API-FINANCES.md](./docs/API-FINANCES.md)
- **Guide Déploiement** : [docs/GUIDE-DEPLOIEMENT-FINANCES.md](./docs/GUIDE-DEPLOIEMENT-FINANCES.md)
- **Résumé Final** : [RESUME-FINAL-FINANCES.md](./RESUME-FINAL-FINANCES.md)

---

**Statut** : 🟡 Prêt pour tests (utilisateur admin requis)  
**Date** : 7 juin 2026  
**Version** : 1.0.0
