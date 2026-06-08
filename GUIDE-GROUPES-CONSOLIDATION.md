# Guide d'utilisation : Module Groupes & Consolidation Multi-Établissements

## 📋 Vue d'ensemble

Le module `groupes-etablissements` permet aux chefs d'établissements de regrouper plusieurs établissements et de consulter des dashboards et rapports consolidés.

---

## 🚀 Installation

### 1. Exécuter la migration

```bash
cd backend
psql -U votre_user -d elisaschool -f src/database/migrations/016-groupes-etablissements.sql
```

### 2. Redémarrer le backend

```bash
npm run dev
```

---

## 📖 API Endpoints

### Créer un groupe

```bash
POST /api/groupes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Groupe Scolaire ABC",
  "description": "Primaire + Collège + Lycée",
  "code": "GS-ABC",
  "etablissementIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "uuid-groupe",
    "nom": "Groupe Scolaire ABC",
    "code": "GS-ABC",
    "proprietaireId": "uuid-user",
    "actif": true
  }
}
```

### Lister mes groupes

```bash
GET /api/groupes?page=1&limit=20
Authorization: Bearer <token>
```

**Paramètres query** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre de résultats par page (défaut: 20, max: 100)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-groupe",
      "nom": "Groupe Scolaire ABC",
      "code": "GS-ABC",
      "actif": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Dashboard consolidé

```bash
GET /api/groupes/:id/dashboard
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "groupeId": "uuid",
    "nombreEtablissements": 3,
    "eleves": {
      "total": 1500,
      "actifs": 1450,
      "inactifs": 50,
      "parGenre": { "masculin": 750, "feminin": 700 }
    },
    "notes": {
      "moyenneGenerale": 12.5,
      "totalNotes": 5000,
      "distribution": {
        "0-5": 100,
        "5-10": 800,
        "10-15": 2500,
        "15-20": 1600
      }
    },
    "finances": { ... },
    "detailsParEtablissement": [
      {
        "etablissementId": "uuid1",
        "nom": "École Primaire ABC",
        "eleves": { "total": 500, "actifs": 480 }
      }
    ],
    "timestamp": "2026-06-07T10:00:00.000Z"
  }
}
```

### Rapport scolarité consolidé

```bash
GET /api/groupes/:id/rapports/scolarite?dateDebut=2026-01-01&dateFin=2026-06-07
Authorization: Bearer <token>
```

**⚠️ Important** : Les paramètres `dateDebut` et `dateFin` sont **obligatoires** et doivent être au format ISO (YYYY-MM-DD).

### Rapport financier consolidé

```bash
GET /api/groupes/:id/rapports/finances?dateDebut=2026-01-01&dateFin=2026-06-07
Authorization: Bearer <token>
```

**⚠️ Important** : Les paramètres `dateDebut` et `dateFin` sont **obligatoires** et doivent être au format ISO (YYYY-MM-DD).

### Ajouter un établissement

```bash
POST /api/groupes/:id/etablissements
Authorization: Bearer <token>
Content-Type: application/json

{
  "etablissementId": "uuid-nouvel-etablissement"
}
```

### Retirer un établissement

```bash
DELETE /api/groupes/:id/etablissements/:etablissementId
Authorization: Bearer <token>
```

### Ajouter un co-administrateur

```bash
POST /api/groupes/:id/admins
Authorization: Bearer <token>
Content-Type: application/json

{
  "utilisateurId": "uuid-admin"
}
```

### Lister les administrateurs du groupe

```bash
GET /api/groupes/:id/admins
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-lien",
      "groupeId": "uuid-groupe",
      "utilisateurId": "uuid-admin",
      "dateAssignation": "2026-06-07T10:00:00.000Z",
      "assignePar": "uuid-proprietaire"
    }
  ]
}
```

---

## 🔐 Permissions & Sécurité

### Permissions RBAC

Les nouvelles permissions ajoutées :

- `groupes:view` — Voir ses groupes
- `groupes:manage` — Modifier/supprimer ses groupes
- `groupes:dashboard:consolide` — Accéder au dashboard consolidé
- `groupes:rapports:scolarite` — Rapports scolarité consolidés
- `groupes:rapports:finances` — Rapports financiers consolidés
- `groupes:etablissements:manage` — Gérer les établissements d'un groupe

### Contrôle d'accès par endpoint

| Endpoint | Middleware | Rôles Requis |
|----------|-----------|--------------|
| `GET /api/groupes` | `authMiddleware` | Tous authentifiés |
| `POST /api/groupes` | `authMiddleware` | `SUPER_ADMIN`, `CHEF_ETABLISSEMENT`, `DIRECTEUR`, `DIRECTEUR_ADJOINT` |
| `GET /api/groupes/:id` | `requireGroupeAccess` | Propriétaire ou Admin |
| `PATCH /api/groupes/:id` | `requireGroupeAccess` + `requireRoles` | `SUPER_ADMIN`, `CHEF_ETABLISSEMENT`, `DIRECTEUR`, `DIRECTEUR_ADJOINT` |
| `DELETE /api/groupes/:id` | `requireGroupeAccess` + `requireRoles` | `SUPER_ADMIN`, `CHEF_ETABLISSEMENT`, `DIRECTEUR` |
| `GET /api/groupes/:id/dashboard` | `requireGroupeAccess` | Propriétaire ou Admin |
| `GET /api/groupes/:id/rapports/*` | `requireGroupeAccess` | Propriétaire ou Admin |
| `POST/DELETE /:id/etablissements` | `requireGroupeAccess` + `requireRoles` | `SUPER_ADMIN`, `CHEF_ETABLISSEMENT`, `DIRECTEUR` |
| `GET /api/groupes/:id/admins` | `requireGroupeAccess` | Propriétaire ou Admin |
| `POST/DELETE /:id/admins` | `requireGroupeAccess` + `requireRoles` | `SUPER_ADMIN`, `CHEF_ETABLISSEMENT`, `DIRECTEUR` |

**Rôles avec accès par défaut** :
- `CHEF_ETABLISSEMENT` — Lecture + Dashboard + Rapports
- `DIRECTEUR` — Gestion complète
- `DIRECTEUR_ADJOINT` — Gestion groupes (pas suppression)
- `SUPER_ADMIN` — Accès total

---

## 🏗️ Architecture

### Structure du module

```
backend/src/modules/groupes-etablissements/
├── entities/
│   ├── groupe-etablissement.entity.ts     # Groupe principal
│   ├── groupe-etablissement-lien.entity.ts # Jointure groupe ↔ établissement
│   └── groupe-admin.entity.ts             # Co-administrateurs
├── dto/
│   ├── groupe.dto.ts                      # Schémas Zod validation
│   └── lien.dto.ts
├── services/
│   ├── groupes.service.ts                 # CRUD + gestion liens
│   └── consolidation.service.ts           # Agrégation stats
├── controllers/
│   └── groupes.controller.ts              # Routes API
├── guards/
│   └── groupe-access.guard.ts             # Middleware accès
└── index.ts                               # Barrel export
```

### Base de données

**Tables créées** :
1. `groupes_etablissements` — Métadonnées du groupe
2. `groupe_etablissement_liens` — Associations groupe ↔ établissement
3. `groupe_admins` — Co-administrateurs

**Indexes** :
- `(proprietaire_id, actif)` — Requêtes par propriétaire
- `(code)` UNIQUE — Recherche par code
- `(groupe_id)` — Requêtes liens par groupe
- `(etablissement_id)` — Requêtes liens par établissement
- `(date_ajout)` — Tri chronologique des liens
- `(groupe_id, etablissement_id)` UNIQUE — Évite doublons
- `(groupe_id, utilisateur_id)` UNIQUE — Évite doublons admins

---

## ⚡ Performance

### Cache

- **Dashboard consolidé** : TTL 4 heures
- **Clé cache** : `precalc:groupe:{groupeId}`
- **Invalidation** : Automatique après ajout/retrait établissement

### Optimisation

- Requêtes parallèles avec `Promise.all()`
- Agrégation SQL (`COUNT`, `SUM`, `GROUP BY`)
- Clause `IN()` pour batch queries

---

## 🧪 Tests

### Tester avec curl

```bash
# 1. Créer un token (login)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chef@ecole.com","motDePasse":"password"}' \
  | jq -r '.data.token')

# 2. Créer un groupe
curl -X POST http://localhost:3000/api/groupes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test Groupe","code":"TEST-001"}'

# 3. Dashboard consolidé
curl http://localhost:3000/api/groupes/{groupeId}/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 📝 Notes

### ✅ Améliorations implémentées (v1.1)

1. **Stats genre** : ✅ Implémentées via jointure SQL avec table `utilisateurs`
2. **Validation dates** : ✅ Stricte sur tous les endpoints de rapports (throw erreur si format invalide)
3. **Pagination** : ✅ Implémentée sur `GET /api/groupes` avec métadonnées complètes
4. **Guard d'accès** : ✅ Middleware `requireGroupeAccess` utilisé sur toutes les routes (DRY principle)
5. **Permissions RBAC** : ✅ Vérification stricte sur routes sensibles (PATCH, DELETE, gestion)
6. **Imports statiques** : ✅ Performance optimisée (plus d'imports dynamiques)
7. **Helper cache** : ✅ Méthode `invalidateGroupeCache()` pour éviter duplication code
8. **Index DB** : ✅ Index sur `date_ajout` pour tri optimisé
9. **Endpoint admins** : ✅ `GET /:id/admins` pour lister les administrateurs
10. **Timestamps** : ✅ Correction incohérence noms colonnes (`cree_at`, `maj_at`)

### Limitations actuelles

1. **Finances dashboard** : Données simplifiées dans le dashboard — rapport financier complet disponible via endpoint dédié avec dates
2. **Pagination liste** : Pagination manuelle côté application (à optimiser avec `findAndCount` si >1000 groupes)

### Évolutions futures

- [ ] Intégration complète Finances dans dashboard (paiements, dépenses, échéanciers)
- [ ] Export PDF/Excel des rapports consolidés
- [ ] Notifications automatiques quand un établissement du groupe change
- [ ] Dashboard temps réel avec WebSockets
- [ ] Optimisation pagination avec `findAndCount` pour gros volumes

---

## 🐛 Dépannage

### Erreur "Groupe non trouvé"

Vérifiez que :
- Le groupe existe et `actif = true`
- L'utilisateur est propriétaire OU admin du groupe

### Erreur "Accès non autorisé"

Vérifiez que :
- Le token JWT est valide
- L'utilisateur a les permissions `groupes:*`
- L'utilisateur est dans `groupe_admins` OU `proprietaire_id`

### Erreur "Format de dateDebut invalide"

Vérifiez que :
- Le format est ISO : `YYYY-MM-DD` (ex: `2026-01-01`)
- La date est valide (pas `2026-02-30`)
- Le paramètre est bien passé dans la query string

### Cache non invalidé

Forcer le recalcul :
```bash
# Via Redis (si utilisé)
redis-cli DEL "elisa:cache:precalc:groupe:{groupeId}"

# Ou supprimer et recréer le groupe
```

---

## 📞 Support

Pour toute question ou bug, contacter l'équipe de développement eLISAschool.
