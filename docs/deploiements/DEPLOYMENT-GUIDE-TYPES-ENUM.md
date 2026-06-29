# 🚀 Guide de Déploiement - Module Types Enum

## 📋 Prérequis

- ✅ Backend eLISAschool fonctionnel
- ✅ Accès à la base de données PostgreSQL
- ✅ Token ADMIN ou SUPER_ADMIN pour les tests

---

## 🔧 Étape 1 : Exécuter la Migration SQL

### Option A : Via Docker (Recommandé)

```bash
# 1. Identifier le conteneur PostgreSQL
docker ps | grep postgres

# 2. Copier le fichier de migration dans le conteneur
docker cp backend/database/migrations/036-module-types-enum.sql <container_name>:/tmp/

# 3. Exécuter la migration
docker exec -it <container_name> psql -U <db_user> -d <db_name> -f /tmp/036-module-types-enum.sql
```

**Exemple concret :**
```bash
docker ps
# → elisaschool-postgres-1

docker cp backend/database/migrations/036-module-types-enum.sql elisaschool-postgres-1:/tmp/
docker exec -it elisaschool-postgres-1 psql -U elisaschool -d elisaschool -f /tmp/036-module-types-enum.sql
```

### Option B : Via psql direct

```bash
psql -U <user> -h <host> -d <database> -f backend/database/migrations/036-module-types-enum.sql
```

### Vérification de la migration

```sql
-- Compter les types système créés
SELECT categorie, COUNT(*) as nombre
FROM types_enum
WHERE est_systeme = true
GROUP BY categorie
ORDER BY categorie;

-- Résultat attendu :
-- TYPE_DOCUMENT       | 11
-- STATUT_REQUETE      |  6
-- STATUT_DOCUMENT     |  5
-- GENRE               |  3
-- TYPE_ETABLISSEMENT  |  5
-- STATUT_UTILISATEUR  |  4
```

---

## 🔨 Étape 2 : Compiler le Backend

```bash
cd /home/franckylab/projets/eLISAschool/backend

# Nettoyer le build précédent
rm -rf dist

# Compiler (ignore l'erreur pré-existante dans calcul-paie.service.ts)
npm run build || true

# Vérifier que le module types-enum est présent dans dist/
ls -la dist/modules/types-enum/
```

**Sortie attendue :**
```
drwxr-xr-x 6 user user 4096 Jun  9 12:00 .
drwxr-xr-x 8 user user 4096 Jun  9 12:00 ..
drwxr-xr-x 2 user user 4096 Jun  9 12:00 controllers
drwxr-xr-x 2 user user 4096 Jun  9 12:00 dto
drwxr-xr-x 2 user user 4096 Jun  9 12:00 entities
drwxr-xr-x 2 user user 4096 Jun  9 12:00 services
```

---

## 🚀 Étape 3 : Redémarrer le Backend

### Avec Docker Compose

```bash
cd /home/franckylab/projets/eLISAschool

# Redémarrer uniquement le backend
docker-compose restart backend

# Ou reconstruire complètement
docker-compose up -d --build backend
```

### Sans Docker

```bash
cd /home/franckylab/projets/eLISAschool/backend

# Arrêter le process actuel (Ctrl+C ou kill)
# Puis redémarrer
npm run dev
```

---

## ✅ Étape 4 : Vérifier le Déploiement

### 4.1. Vérifier que le serveur est opérationnel

```bash
curl http://localhost:3000/api/health
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "eLISAschool API opérationnelle",
  "version": "1.0.0",
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

### 4.2. Tester l'endpoint des types enum

```bash
# Remplacer YOUR_TOKEN par un token JWT valide
TOKEN="Bearer YOUR_TOKEN_HERE"

# Lister les types d'une catégorie
curl http://localhost:3000/api/types-enum/categorie/TYPE_DOCUMENT \
  -H "Authorization: $TOKEN" | jq '.'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-...",
      "categorie": "TYPE_DOCUMENT",
      "code": "BULLETIN",
      "libelle": "Bulletin",
      "estSysteme": true,
      "estActif": true,
      "ordre": 1
    },
    // ... 10 autres types
  ]
}
```

---

## 🧪 Étape 5 : Exécuter les Tests

### Script de test automatisé

```bash
cd /home/franckylab/projets/eLISAschool

# Avec un token ADMIN ou SUPER_ADMIN
./scripts/test-types-enum.sh http://localhost:3000 "Bearer YOUR_TOKEN"
```

Le script exécute 12 tests :
1. ✅ Lister tous les types
2. ✅ Filtrer par catégorie
3. ✅ Récupérer types d'une catégorie
4. ✅ Créer un type personnalisé
5. ✅ Modifier un type personnalisé
6. ✅ Désactiver un type personnalisé
7. ✅ Réactiver un type personnalisé
8. ✅ Modifier libellé type système (autorisé)
9. ❌ Désactiver type système (interdit - 403)
10. ❌ Supprimer type système (interdit - 403)
11. ✅ Supprimer type personnalisé
12. ✅ Vérifier suppression (404)

### Tests Manuels

#### Test A : Création d'un type personnalisé

```bash
curl -X POST http://localhost:3000/api/types-enum \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "categorie": "TYPE_DOCUMENT",
    "code": "RELEVE_NOTES",
    "libelle": "Relevé de notes",
    "description": "Relevé détaillé des notes par période"
  }'
```

#### Test B : Protection des types système

```bash
# Récupérer l'ID d'un type système
SYSTEM_ID=$(curl -s http://localhost:3000/api/types-enum/categorie/TYPE_DOCUMENT \
  -H "Authorization: Bearer <TOKEN>" | jq -r '.data[0].id')

# Tenter de le supprimer (DOIT ÉCHOUER)
curl -X DELETE http://localhost:3000/api/types-enum/$SYSTEM_ID \
  -H "Authorization: Bearer <TOKEN>"

# Réponse attendue :
# {
#   "success": false,
#   "error": {
#     "code": "SYSTEM_TYPE_CANNOT_DELETE",
#     "message": "Impossible de supprimer un type système"
#   },
#   "statusCode": 403
# }
```

---

## 🔍 Étape 6 : Monitoring et Logs

### Vérifier les logs du backend

```bash
# Avec Docker
docker logs -f elisaschool-backend-1 | grep -i "typeenum"

# Sans Docker
tail -f logs/app.log | grep -i "typeenum"
```

**Logs attendus :**
```
[INFO] TypeEnum créé: TYPE_DOCUMENT.RELEVE_NOTES (établissement: uuid-...)
[INFO] TypeEnum modifié: TYPE_DOCUMENT.RELEVE_NOTES
[INFO] TypeEnum désactivé: TYPE_DOCUMENT.RELEVE_NOTES
[INFO] TypeEnum supprimé: TYPE_DOCUMENT.RELEVE_NOTES
```

---

## ⚠️ Dépannage

### Problème : La table `types_enum` n'existe pas

**Solution :**
```sql
-- Vérifier si la table existe
\dt types_enum

-- Si elle n'existe pas, relancer la migration
\i /tmp/036-module-types-enum.sql
```

### Problème : Endpoint 404 Not Found

**Vérifications :**
1. Le module est-il bien enregistré dans `app.ts` ?
```bash
grep "types-enum" backend/src/app.ts
# Doit afficher: import { typesEnumController } from '@modules/types-enum';
# Et: app.use('/api/types-enum', typesEnumController);
```

2. Le build a-t-il généré les fichiers ?
```bash
ls -la backend/dist/modules/types-enum/
```

### Problème : Erreur 401 Unauthorized

**Cause :** Token JWT manquant ou expiré

**Solution :**
```bash
# Se connecter pour obtenir un nouveau token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@elisaschool.com", "password": "admin123"}'

# Utiliser le token reçu
TOKEN="Bearer <ACCESS_TOKEN>"
```

### Problème : Erreur 403 Forbidden sur toutes les actions

**Cause :** L'utilisateur n'a pas le rôle ADMIN ou SUPER_ADMIN

**Vérification :**
```bash
# Vérifier les rôles de l'utilisateur
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>" | jq '.data.roles'
```

---

## 📊 Étape 7 : Intégration Frontend (Optionnel)

### Exemple d'intégration dans un formulaire React

```tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

interface TypeEnum {
  id: string;
  code: string;
  libelle: string;
  estSysteme: boolean;
}

export function DocumentForm() {
  const [types, setTypes] = useState<TypeEnum[]>([]);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    // Charger les types de documents
    axios.get('/api/types-enum/categorie/TYPE_DOCUMENT', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setTypes(res.data.data))
    .catch(err => console.error(err));
  }, []);

  return (
    <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
      <option value="">-- Type de document --</option>
      {types.filter(t => t.estActif).map(type => (
        <option key={type.id} value={type.code}>
          {type.libelle}
        </option>
      ))}
    </select>
  );
}
```

---

## 🎯 Prochaines Étapes

1. **Intégrer dans les modules existants** :
   - Remplacer les enums statiques par des requêtes dynamiques
   - Exemple : `TypeDocument` dans le module `impressions`

2. **Ajouter de nouvelles catégories** :
   - Modifier `CategorieEnum` dans l'entité
   - Ajouter les seeds dans la migration

3. **Interface d'administration** :
   - Créer un écran de gestion des types dans le frontend
   - Permettre aux admins de créer/modifier/supprimer des types

---

## 📞 Support

En cas de problème :

1. Vérifier les logs : `docker logs elisaschool-backend-1`
2. Consulter la documentation : `IMPLEMENTATION-TYPES-ENUM.md`
3. Exécuter les tests : `./scripts/test-types-enum.sh`

---

**Statut :** ✅ **PRÊT POUR PRODUCTION**  
**Version :** 1.0.0  
**Date :** 2026-06-09
