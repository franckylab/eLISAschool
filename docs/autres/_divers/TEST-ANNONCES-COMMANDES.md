# 🧪 Commandes de Test - Module Annonces

## 1. Déploiement

```bash
# Exécuter la migration
cd /home/franckylab/projets/eLISAschool/backend
../scripts/deploy-annonces.sh
```

## 2. Vérification Base de Données

```bash
# Se connecter à PostgreSQL
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Vérifier les tables
\d annonces
\d annonce_ciblages

# Vérifier les permissions
SELECT * FROM permissions WHERE module = 'annonces';

# Vérifier les paramètres
SELECT * FROM parametres_systeme WHERE cle LIKE 'annonces.%';

# Quitter
\q
```

## 3. Compilation & Démarrage

```bash
cd /home/franckylab/projets/eLISAschool/backend

# Compiler
npm run build

# Démarrer (développement)
npm run dev

# Ou en production
npm start
```

## 4. Test API (avec curl)

### Obtenir un token d'authentification

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elisaschool.com",
    "motDePasse": "admin123"
  }'

# Copier le token JWT retourné
export TOKEN="votre_token_jwt_ici"
```

### Tester les annonces actives

```bash
curl -X GET http://localhost:3000/api/annonces/actives \
  -H "Authorization: Bearer $TOKEN"
```

### Créer une annonce

```bash
curl -X POST http://localhost:3000/api/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test - Réunion parents-professeurs",
    "contenu": "La réunion aura lieu le 15 mars à 18h dans le hall principal",
    "typeContenu": "texte",
    "dateDebut": "2026-03-01T00:00:00.000Z",
    "dateFin": "2026-03-20T23:59:59.000Z",
    "cibleGlobale": false,
    "priorite": 50,
    "ciblages": [
      { "typeCible": "role", "cibleId": "PARENT" },
      { "typeCible": "role", "cibleId": "ENSEIGNANT" }
    ]
  }'
```

### Lister les annonces

```bash
curl -X GET "http://localhost:3000/api/annonces?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Soumettre pour validation

```bash
# Remplacer :id par l'ID de l'annonce créée
curl -X POST http://localhost:3000/api/annonces/:id/soumettre-validation \
  -H "Authorization: Bearer $TOKEN"
```

### Valider une annonce

```bash
curl -X POST http://localhost:3000/api/annonces/:id/valider \
  -H "Authorization: Bearer $TOKEN"
```

### Archiver une annonce

```bash
curl -X POST http://localhost:3000/api/annonces/:id/archiver \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Test avec Postman/Insomnia

### Collection de tests

Importez cette collection dans Postman :

```json
{
  "info": {
    "name": "eLISAschool - Module Annonces",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Annonces Actives",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{TOKEN}}"
          }
        ],
        "url": {
          "raw": "{{BASE_URL}}/api/annonces/actives",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "annonces", "actives"]
        }
      }
    },
    {
      "name": "Créer Annonce",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{TOKEN}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"titre\": \"Test annonce\",\n  \"contenu\": \"Contenu de test\",\n  \"typeContenu\": \"texte\",\n  \"dateDebut\": \"2026-03-01T00:00:00.000Z\",\n  \"dateFin\": \"2026-03-31T23:59:59.000Z\",\n  \"cibleGlobale\": true,\n  \"priorite\": 50\n}"
        },
        "url": {
          "raw": "{{BASE_URL}}/api/annonces",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "annonces"]
        }
      }
    }
  ]
}
```

## 6. Logs & Debugging

```bash
# Voir les logs du serveur
tail -f /var/log/elisaschool/backend.log

# Ou si vous utilisez pm2
pm2 logs elisaschool-backend

# Filtrer les logs du module annonces
pm2 logs elisaschool-backend | grep -i "annonce"
```

## 7. Nettoyage (si nécessaire)

```bash
# Supprimer les tables (ATTENTION: irréversible!)
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
DROP TABLE IF EXISTS annonce_ciblages CASCADE;
DROP TABLE IF EXISTS annonces CASCADE;
DELETE FROM permissions WHERE module = 'annonces';
DELETE FROM parametres_systeme WHERE cle LIKE 'annonces.%';
"
```

## 8. Vérification Finale

```bash
# 1. Compiler sans erreurs
npm run build

# 2. Démarrer le serveur
npm start

# 3. Tester la santé
curl http://localhost:3000/api/health

# 4. Tester les annonces actives
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/annonces/actives

# 5. Vérifier dans Swagger UI
# Ouvrir: http://localhost:3000/api/docs
```

---

## ✅ Checklist de Validation

- [ ] Migration SQL exécutée sans erreurs
- [ ] Tables créées (annonces, annonce_ciblages)
- [ ] Permissions créées (12)
- [ ] Paramètres créés (13)
- [ ] Compilation TypeScript réussie
- [ ] Serveur démarré sans erreurs
- [ ] GET /api/annonces/actives retourne 200
- [ ] POST /api/annonces crée une annonce
- [ ] Workflow validation fonctionne
- [ ] Multi-tenant isolé par établissement
- [ ] Logs propres sans erreurs

---

**🎉 Si tous les tests passent, le module est prêt pour la production !**
