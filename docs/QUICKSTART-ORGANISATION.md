# Guide de Démarrage Rapide - Module Organisation

> **Temps estimé** : 10 minutes  
> **Niveau** : Administrateur système

---

## 🚀 Déploiement en 3 Étapes

### Étape 1 : Exécuter la Migration

```bash
# Depuis la racine du projet eLISAschool
chmod +x scripts/deploy-organisation.sh
./scripts/deploy-organisation.sh
```

**Ce que fait le script** :
- ✅ Vérifie la connexion à la base de données
- ✅ Exécute la migration SQL (4 tables)
- ✅ Crée les index (14)
- ✅ Insère les seeds (organisation + unités par défaut)
- ✅ Valide l'intégration backend

### Étape 2 : Redémarrer le Backend

```bash
docker-compose restart backend
```

### Étape 3 : Tester l'API

```bash
# Remplacer YOUR_TOKEN par un JWT valide
TOKEN="YOUR_TOKEN"

# Lister les organisations
curl -X GET http://localhost:3000/api/organisation/organisations \
  -H "Authorization: Bearer $TOKEN"

# Créer une unité organisationnelle
curl -X POST http://localhost:3000/api/organisation/unites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Département Sciences",
    "type": "DEPARTEMENT",
    "code": "DEP-SCI",
    "organisationId": "uuid-organisation",
    "ordre": 0
  }'
```

---

## 📋 Vérification Post-Déploiement

### 1. Vérifier les Tables

```bash
docker exec -it elisaschool-postgres psql -U elisaschool_user -d elisaschool_db

# Lister les tables
\dt organisations
\dt unites_organisationnelles
\dt postes
\dt hierarchie_personnel

# Vérifier les données
SELECT COUNT(*) FROM organisations;
SELECT COUNT(*) FROM unites_organisationnelles;

# Quitter
\q
```

### 2. Tester les Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/organisation/organisations` | Lister organisations |
| GET | `/api/organisation/unites` | Lister unités |
| GET | `/api/organisation/postes` | Lister postes |
| GET | `/api/organisation/hierarchie` | Lister hiérarchie |
| GET | `/api/organisation/arborescence/:id` | Arborescence |
| GET | `/api/organisation/organigramme/:id` | Organigramme complet |
| GET | `/api/organisation/statistiques/:id` | Statistiques |

---

## 🎯 Cas d'Usage : Structurer un Lycée

### Exemple Complet

```typescript
const token = "YOUR_JWT_TOKEN";
const baseUrl = "http://localhost:3000/api/organisation";

// 1. Récupérer l'organisation (créée automatiquement par migration)
const orgs = await fetch(`${baseUrl}/organisations`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

const organisationId = orgs.data[0].id;

// 2. Créer la Direction
const direction = await fetch(`${baseUrl}/unites`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nom: 'Direction Générale',
    type: 'DIRECTION',
    code: 'DIR-GEN',
    organisationId,
    ordre: 0,
    responsableNom: 'M. le Proviseur'
  })
}).then(r => r.json());

// 3. Créer le Département Pédagogique
const depPedagogique = await fetch(`${baseUrl}/unites`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nom: 'Département Pédagogique',
    type: 'DEPARTEMENT',
    code: 'DEP-PED',
    organisationId,
    ordre: 1
  })
}).then(r => r.json());

// 4. Créer le Service Sciences (sous le département)
const serviceSciences = await fetch(`${baseUrl}/unites`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nom: 'Service Sciences',
    type: 'SERVICE',
    code: 'SRV-SCI',
    organisationId,
    parentId: depPedagogique.data.id, // ← Sous-unité
    ordre: 0
  })
}).then(r => r.json());

// 5. Créer un poste de Professeur de Mathématiques
const posteMaths = await fetch(`${baseUrl}/postes`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    intitulé: 'Professeur de Mathématiques',
    code: 'POSTE-MATH',
    type: 'ENSEIGNANT',
    niveauResponsabilite: 'EXECUTANT',
    uniteOrganisationnelleId: serviceSciences.data.id
  })
}).then(r => r.json());

// 6. Assigner un occupant au poste
await fetch(`${baseUrl}/postes/${posteMaths.data.id}/assigner`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    occupantId: 'uuid-personnel-123',
    occupantNom: 'M. Jean Dupont'
  })
});

// 7. Obtenir l'organigramme complet
const organigramme = await fetch(`${baseUrl}/organigramme/${organisationId}`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

console.log(JSON.stringify(organigramme, null, 2));
```

---

## 🔍 Résolution de Problèmes

### Problème : Migration échoue

**Symptôme** : Erreur lors de l'exécution du script

**Solution** :
```bash
# Vérifier que PostgreSQL tourne
docker ps | grep postgres

# Vérifier les variables d'environnement
cat .env | grep POSTGRES

# Exécuter manuellement la migration
docker cp backend/database/migrations/044-module-organisation.sql elisaschool-postgres:/tmp/migration.sql
docker exec elisaschool-postgres psql -U elisaschool_user -d elisaschool_db -f /tmp/migration.sql
```

### Problème : Module non trouvé

**Symptôme** : `Cannot find module '@modules/organisation'`

**Solution** :
```bash
# Reconstruire le backend
docker-compose build backend
docker-compose up -d backend
```

### Problème : Permission denied

**Symptôme** : `403 Forbidden` sur les routes POST/PATCH/DELETE

**Solution** : Vérifier que votre JWT a le rôle `ADMIN` ou `SUPER_ADMIN`

```bash
# Décoder le JWT pour vérifier le rôle
echo "YOUR_JWT_TOKEN" | cut -d'.' -f2 | base64 -d | jq
```

---

## 📚 Ressources

| Ressource | Lien |
|-----------|------|
| Documentation complète | `docs/MODULE-ORGANISATION.md` |
| Résumé d'implémentation | `IMPLEMENTATION-ORGANISATION-RESUME.md` |
| Migration SQL | `backend/database/migrations/044-module-organisation.sql` |
| Script de déploiement | `scripts/deploy-organisation.sh` |
| Entités | `backend/src/modules/organisation/entities/` |
| Service métier | `backend/src/modules/organisation/services/organisation.service.ts` |
| Controller | `backend/src/modules/organisation/controllers/organisation.controller.ts` |

---

## ✅ Checklist de Validation

Après déploiement, vérifiez :

- [ ] Les 4 tables sont créées dans PostgreSQL
- [ ] Les seeds ont inséré au moins 1 organisation
- [ ] Le backend redémarre sans erreur
- [ ] `GET /api/organisation/organisations` retourne des données
- [ ] Vous pouvez créer une unité organisationnelle
- [ ] L'arborescence se construit correctement
- [ ] Les statistiques sont calculées

---

## 🎉 Félicitations !

Le module **Organisation** est maintenant déployé et opérationnel.

**Prochaines étapes recommandées** :
1. Créer la structure complète de votre établissement
2. Définir les postes et assigner les occupants
3. Établir les relations hiérarchiques
4. Consulter l'organigramme généré automatiquement

**Support** : Consulter `docs/MODULE-ORGANISATION.md` pour la documentation complète.
