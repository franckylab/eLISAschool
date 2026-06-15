# 🧪 GUIDE DE TEST - Multi-Tenant V3.0

> **Date** : 14 juin 2025  
> **Version** : 3.0.0

---

## 📋 Prérequis

1. **Backend en cours** : `http://localhost:3001`
2. **Frontend en cours** : `http://localhost:7001`
3. **Migration exécutée** : `050-multi-tenant-v3-max-etablissements.sql`
4. **Utilisateur de test** avec multi-établissements

---

## 🎯 Test 1 : Connexion Mono-Établissement

### Scénario
Utilisateur avec 1 seul établissement actif

### Étapes

1. Ouvrir `http://localhost:7001/login`
2. Entrer les identifiants
3. Cliquer sur "Se connecter"

### Résultat Attendu
- ✅ Connexion réussie
- ✅ **PAS** de modal de sélection
- ✅ Redirection automatique vers `/dashboard`
- ✅ Toast "Bienvenue" affiché

### Vérification Console
```javascript
// Dans F12 → Console
// Aucune erreur
// Navigation directe vers /dashboard
```

---

## 🎯 Test 2 : Connexion Multi-Établissements

### Scénario
Utilisateur avec 2+ établissements actifs

### Étapes

1. Ouvrir `http://localhost:7001/login`
2. Entrer les identifiants
3. Cliquer sur "Se connecter"

### Résultat Attendu
- ✅ Connexion réussie (étape 1)
- ✅ **Modal de sélection affiché** automatiquement
- ✅ Liste des établissements avec :
  - Logo (ou placeholder)
  - Nom de l'établissement
  - Code (si disponible)
  - Rôle dans l'établissement
  - Badge "Principal" sur l'établissement principal
- ✅ Établissement principal pré-sélectionné
- ✅ Timer countdown visible (5 minutes)
- ✅ Bouton "Continuer" activé après sélection

### Résultat Après Sélection
- ✅ Modal se ferme
- ✅ Toast "Bienvenue" affiché
- ✅ Redirection vers `/dashboard`
- ✅ Token final stocké dans localStorage

---

## 🎯 Test 3 : Changement d'Établissement (Navbar)

### Scénario
Utilisateur connecté avec multi-établissements

### Étapes

1. Se connecter (Test 2)
2. Aller sur `/dashboard`
3. Cliquer sur le sélecteur d'établissement dans la navbar
4. Sélectionner un autre établissement

### Résultat Attendu
- ✅ Dropdown animé affiché
- ✅ Liste des établissements visible
- ✅ Établissement actuel mis en évidence
- ✅ Clic sur un établissement :
  - Rechargement de la page
  - Nouvel établissement actif
  - Données filtrées correctement

### Vérification API
```bash
# Vérifier le token
localStorage.getItem('accessToken')

# Décoder le JWT (https://jwt.io)
# Vérifier que etablissementId a changé
```

---

## 🎯 Test 4 : API Pre-Login

### Commande

```bash
# Obtenir un token d'abord
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifiant": "admin@elisaschool.com",
    "motDePasse": "password123"
  }' | jq -r '.data.accessToken')

# Tester pre-login
curl -X POST http://localhost:3001/api/auth/pre-login \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Résultat Attendu (Mono)

```json
{
  "success": true,
  "data": {
    "requiereSelection": false,
    "etablissements": null
  }
}
```

### Résultat Attendu (Multi)

```json
{
  "success": true,
  "data": {
    "requiereSelection": true,
    "etablissements": [
      {
        "id": "uuid-1",
        "nom": "École A",
        "code": "EA001",
        "role": "ADMIN",
        "etablissementPrincipal": true,
        "logoUrl": null
      },
      {
        "id": "uuid-2",
        "nom": "École B",
        "code": "EB002",
        "role": "ENSEIGNANT",
        "etablissementPrincipal": false,
        "logoUrl": null
      }
    ],
    "tokenTemporaire": "eyJ...",
    "expiresIn": 300
  }
}
```

---

## 🎯 Test 5 : API Complete-Login

### Commande

```bash
# Tester complete-login
curl -X POST http://localhost:3001/api/auth/complete-login \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "etablissementId": "uuid-1"
  }' | jq
```

### Résultat Attendu

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 86400,
    "utilisateur": {
      "id": "...",
      "email": "...",
      "nom": "...",
      "prenom": "...",
      "role": "ADMIN",
      "etablissementActif": "uuid-1"
    },
    "etablissementsDisponibles": [...]
  }
}
```

---

## 🎯 Test 6 : API Établissements Disponibles

### Commande

```bash
curl http://localhost:3001/api/auth/etablissements-disponibles \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Résultat Attendu

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "nom": "École A",
      "code": "EA001",
      "role": "ADMIN",
      "etablissementPrincipal": true
    },
    {
      "id": "uuid-2",
      "nom": "École B",
      "code": "EB002",
      "role": "ENSEIGNANT",
      "etablissementPrincipal": false
    }
  ]
}
```

---

## 🎯 Test 7 : Middleware Filtrage

### Scénario
Tenter d'accéder aux données d'un autre établissement

### Commande

```bash
# Se connecter à l'établissement A
TOKEN_A=$(curl -s -X POST http://localhost:3001/api/auth/complete-login \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"etablissementId": "uuid-a"}' | jq -r '.data.accessToken')

# Tenter d'accéder aux données de l'établissement B
curl http://localhost:3001/api/eleves?etablissementId=uuid-b \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

### Résultat Attendu
- ✅ Requête ignorée ou erreur 403
- ✅ **PAS** de données de l'établissement B retournées
- ✅ Logs backend montrent la tentative

### Vérification Logs Backend

```bash
tail -f /tmp/elisaschool-backend.log | grep -i "cross-tenant\|security"
```

---

## 🎯 Test 8 : Token Temporaire Expiré

### Scénario
Attendre 5 minutes après pre-login sans compléter

### Étapes

1. Se connecter
2. Modal de sélection affiché
3. **NE PAS** sélectionner immédiatement
4. Attendre 5 minutes
5. Essayer de sélectionner

### Résultat Attendu
- ✅ Timer countdown visible
- ✅ À 0 : message "Token expiré"
- ✅ Bouton "Continuer" désactivé
- ✅ Nécessite de se reconnecter

---

## 🎯 Test 9 : SuperAdmin Multi-Établissements Illimité

### Scénario
Utilisateur SUPER_ADMIN avec maxEtablissementsPersonnel = 0

### Vérification Base de Données

```sql
SELECT id, email, role, maxEtablissementsPersonnel
FROM utilisateurs
WHERE role = 'SUPER_ADMIN';
```

### Résultat Attendu

```
 id | email | role | maxEtablissementsPersonnel
----|-------|------|---------------------------
 xx | ...   | SUPER_ADMIN | 0
```

### Test Connexion
- ✅ Peut appartenir à N établissements
- ✅ Modal affiche tous les établissements
- ✅ Pas de restriction

---

## 🎯 Test 10 : Limitation Nombre d'Établissements

### Scénario
Utilisateur avec maxEtablissementsPersonnel = 3 essayant d'ajouter un 4ème

### Commande Admin

```bash
# Tenter d'ajouter un 4ème établissement
curl -X POST http://localhost:3001/api/utilisateur-etablissements \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "utilisateurId": "user-id",
    "etablissementId": "uuid-4"
  }' | jq
```

### Résultat Attendu
- ✅ Erreur 400 : "Nombre maximum d'établissements atteint"
- ✅ Établissement NON ajouté

---

## 🐛 Débogage

### Problème : Modal ne s'affiche pas

**Vérifications** :
```bash
# 1. Vérifier les logs frontend
tail -f /tmp/elisaschool-frontend.log

# 2. Vérifier la console navigateur (F12)
console.log('preLoginData:', preLoginData);
console.log('showEtablissementModal:', showEtablissementModal);

# 3. Vérifier la réponse API
curl -X POST http://localhost:3001/api/auth/pre-login \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Problème : Erreur 404 sur endpoints

**Vérifications** :
```bash
# 1. Vérifier que le backend est en cours
curl http://localhost:3001/api/health

# 2. Vérifier les routes enregistrées
grep -r "pre-login\|complete-login" backend/src/modules/auth/controllers/auth.controller.ts

# 3. Redémarrer le backend
cd backend && npm run dev
```

### Problème : Données cross-tenant visibles

**Vérifications** :
```bash
# 1. Vérifier que le middleware est appliqué
grep "filterByEtablissement" backend/src/modules/*/controllers/*.controller.ts

# 2. Vérifier les logs de sécurité
tail -f /tmp/elisaschool-backend.log | grep -i "cross-tenant"

# 3. Tester manuellement le filtrage
curl http://localhost:3001/api/eleves \
  -H "Authorization: Bearer $TOKEN" | jq '.data[].etablissementId'
# Tous doivent avoir le même etablissementId
```

---

## 📊 Checklist de Validation

### Fonctionnel

- [ ] Test 1 : Connexion mono-établissement ✅
- [ ] Test 2 : Connexion multi-établissements ✅
- [ ] Test 3 : Changement d'établissement ✅
- [ ] Test 4 : API pre-login ✅
- [ ] Test 5 : API complete-login ✅
- [ ] Test 6 : API établissements disponibles ✅
- [ ] Test 7 : Middleware filtrage ✅
- [ ] Test 8 : Token expiré ✅
- [ ] Test 9 : SuperAdmin illimité ✅
- [ ] Test 10 : Limitation établissements ✅

### Performance

- [ ] Temps de réponse pre-login < 500ms
- [ ] Temps de réponse complete-login < 1s
- [ ] Modal s'affiche < 200ms après login
- [ ] Rechargement après switch < 2s
- [ ] Pas de fuite mémoire (test 10+ switches)

### Sécurité

- [ ] Pas de données cross-tenant accessibles
- [ ] Token temporaire expire bien après 5min
- [ ] Middleware appliqué sur toutes les routes sensibles
- [ ] Logs de sécurité fonctionnels
- [ ] Tentatives de bypass bloquées

### UX/UI

- [ ] Modal design moderne et responsive
- [ ] Animations fluides (Framer Motion)
- [ ] Timer countdown visible et précis
- [ ] Établissement principal pré-sélectionné
- [ ] Dropdown navbar fonctionne correctement
- [ ] Messages d'erreur clairs

---

## 🎯 Tests Automatisés (Optionnel)

### Script de Test Rapide

```bash
#!/bin/bash
# test-multi-tenant.sh

echo "🧪 Test Multi-Tenant V3.0"

# Login
echo "1. Login..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifiant":"admin@elisaschool.com","motDePasse":"password123"}')

TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Échec login"
    exit 1
fi
echo "✅ Login réussi"

# Pre-login
echo "2. Pre-login..."
PRE_LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/pre-login \
  -H "Authorization: Bearer $TOKEN")

REQUIERE=$(echo $PRE_LOGIN | jq -r '.data.requiereSelection')
echo "   Requiere selection: $REQUIERE"

if [ "$REQUIERE" = "true" ]; then
    echo "✅ Multi-établissements détecté"
    NB_ETAB=$(echo $PRE_LOGIN | jq '.data.etablissements | length')
    echo "   Nombre d'établissements: $NB_ETAB"
else
    echo "✅ Mono-établissement"
fi

# Établissements disponibles
echo "3. Établissements disponibles..."
ETABS=$(curl -s http://localhost:3001/api/auth/etablissements-disponibles \
  -H "Authorization: Bearer $TOKEN")

echo "$ETABS" | jq '.data[] | {nom, role, etablissementPrincipal}'

echo "✅ Tests terminés"
```

---

## 📞 Support

En cas de problème :

1. Consulter les logs : `tail -f /tmp/elisaschool-*.log`
2. Vérifier la base de données : `psql -U postgres -d elisaschool`
3. Tester les endpoints avec curl (commandes ci-dessus)
4. Consulter la documentation : `IMPLÉMENTATION-MULTI-TENANT-V3-FINAL.md`

---

> **Développé avec ❤️ par franck arlos chendjou pour eLISAschool**  
> **Version 3.0.0 - 14 juin 2025**
